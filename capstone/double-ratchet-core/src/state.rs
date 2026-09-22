//! Session state and the core ratchet algorithm.
//!
//! This module implements the state machine described in the Signal Double
//! Ratchet specification: a symmetric KDF ratchet advanced on every message
//! (forward secrecy), interleaved with a Diffie-Hellman ratchet advanced on
//! every change of sending direction (post-compromise security), plus a
//! bounded cache of skipped message keys to tolerate out-of-order delivery.

use std::collections::HashMap;

use chacha20poly1305::{
    aead::{Aead, KeyInit, Payload},
    ChaCha20Poly1305, Key, Nonce,
};
use rand_core::OsRng;
use x25519_dalek::{PublicKey, StaticSecret};
use zeroize::Zeroize;

use crate::errors::RatchetError;
use crate::kdf::{kdf_ck, kdf_rk};

/// Maximum number of message keys the receiving chain will derive and
/// cache while catching up to a header that jumped ahead. Bounds the
/// memory (and CPU) an adversary-influenced sender can force a receiver to
/// spend on a single ratchet turn.
pub const MAX_SKIP: u32 = 1000;

/// The (mostly public) metadata sent alongside every ciphertext.
///
/// The header is authenticated as associated data under the message's
/// AEAD tag (see `ratchet_encrypt`/`ratchet_decrypt`), so an adversary can
/// read it but cannot modify it without the ciphertext failing to decrypt.
#[derive(Debug, Clone, Copy)]
pub struct Header {
    /// The sender's current ratchet DH public key.
    pub dh_public: PublicKey,
    /// Length of the previous sending chain, i.e. how many messages were
    /// sent before the sender's most recent DH ratchet turn. Lets the
    /// receiver know how many trailing skipped keys to derive on the old
    /// chain before switching to the new one.
    pub pn: u32,
    /// Index of this message within the sender's current chain.
    pub n: u32,
}

impl Header {
    /// Serializes the header to a fixed 40-byte wire format:
    /// `dh_public (32) || pn (4, BE) || n (4, BE)`.
    pub fn to_bytes(&self) -> [u8; 40] {
        let mut out = [0u8; 40];
        out[..32].copy_from_slice(self.dh_public.as_bytes());
        out[32..36].copy_from_slice(&self.pn.to_be_bytes());
        out[36..40].copy_from_slice(&self.n.to_be_bytes());
        out
    }

    /// Parses a header from the 40-byte wire format produced by `to_bytes`.
    pub fn from_bytes(bytes: &[u8]) -> Result<Self, RatchetError> {
        if bytes.len() != 40 {
            return Err(RatchetError::SerializationError("header must be 40 bytes"));
        }
        let mut pk_bytes = [0u8; 32];
        pk_bytes.copy_from_slice(&bytes[..32]);
        let pn = u32::from_be_bytes(bytes[32..36].try_into().unwrap());
        let n = u32::from_be_bytes(bytes[36..40].try_into().unwrap());
        Ok(Header {
            dh_public: PublicKey::from(pk_bytes),
            pn,
            n,
        })
    }
}

/// Key used to index the skipped-message-key cache: the sender's DH public
/// key bytes at the time the message was sent, paired with its index in
/// that chain. A message is uniquely identified by (chain, index).
type SkippedKeyId = ([u8; 32], u32);

/// Full session state for one party (Alice or Bob) in an active double
/// ratchet session.
///
/// All secret material (`root_key`, both chain keys, and every cached
/// skipped message key) is wiped from memory as soon as the struct holding
/// it is dropped — see the hand-written `Drop` impl below. This is the
/// "forward secrecy in RAM" requirement: a heap snapshot taken after a
/// `SessionState` goes out of scope should not recover its keys.
///
/// `Drop` is implemented manually rather than derived because the derive
/// macro cannot walk into the `HashMap<_, [u8; 32]>` holding skipped
/// message keys; each cached key is zeroized explicitly instead.
/// `dh_self_private` (an `x25519_dalek::StaticSecret`) already zeroizes
/// itself on drop internally, so it needs no explicit handling here.
pub struct SessionState {
    /// This party's current DH ratchet key pair.
    dh_self_public: PublicKey,
    dh_self_private: StaticSecret,

    /// The remote party's most recently observed DH ratchet public key.
    /// `None` only in the brief window before Bob has received Alice's
    /// first message.
    dh_remote: Option<PublicKey>,

    /// Root key, mixed on every DH ratchet turn.
    root_key: [u8; 32],

    /// Sending chain key. `None` until this party has something to derive
    /// a chain from (mirrors the spec: Bob has no sending chain until he
    /// has received and processed Alice's first message).
    chain_key_send: Option<[u8; 32]>,
    /// Receiving chain key, symmetric counterpart to `chain_key_send`.
    chain_key_recv: Option<[u8; 32]>,

    /// Number of messages sent on the current sending chain.
    ns: u32,
    /// Number of messages received on the current receiving chain.
    nr: u32,
    /// Number of messages sent on the *previous* sending chain, carried in
    /// outgoing headers so the receiver knows how far to catch up on the
    /// old chain before a DH ratchet turn.
    pn: u32,

    /// Skipped message keys not yet consumed, keyed by (sender chain,
    /// index). Bounded by `MAX_SKIP` at insertion time.
    skipped_keys: HashMap<SkippedKeyId, [u8; 32]>,
}

impl Drop for SessionState {
    fn drop(&mut self) {
        self.root_key.zeroize();
        if let Some(ck) = self.chain_key_send.as_mut() {
            ck.zeroize();
        }
        if let Some(ck) = self.chain_key_recv.as_mut() {
            ck.zeroize();
        }
        for key in self.skipped_keys.values_mut() {
            key.zeroize();
        }
    }
}

impl SessionState {
    /// Alice's side of session setup, run immediately after an X3DH
    /// handshake has produced `shared_root`. Alice performs an initial DH
    /// ratchet turn against Bob's published signed prekey so her very
    /// first message already carries fresh sending-chain entropy.
    ///
    /// Returns the initialized session plus nothing else — Alice's first
    /// header is produced by her first call to `ratchet_encrypt`.
    pub fn init_alice(shared_root: [u8; 32], bob_dh_public: PublicKey) -> Self {
        let dh_self_private = StaticSecret::random_from_rng(OsRng);
        let dh_self_public = PublicKey::from(&dh_self_private);

        let dh_out = dh_self_private.diffie_hellman(&bob_dh_public);
        let (root_key, chain_key_send) = kdf_rk(&shared_root, dh_out.as_bytes());

        SessionState {
            dh_self_public,
            dh_self_private,
            dh_remote: Some(bob_dh_public),
            root_key,
            chain_key_send: Some(chain_key_send),
            chain_key_recv: None,
            ns: 0,
            nr: 0,
            pn: 0,
            skipped_keys: HashMap::new(),
        }
    }

    /// Bob's side of session setup. Bob does not know Alice's DH public key
    /// yet — he starts with no sending chain and no remote key, and both
    /// become populated the first time `ratchet_decrypt` processes a
    /// message from Alice (which performs Bob's first DH ratchet turn).
    pub fn init_bob(shared_root: [u8; 32], bob_dh_keypair: (StaticSecret, PublicKey)) -> Self {
        let (dh_self_private, dh_self_public) = bob_dh_keypair;
        SessionState {
            dh_self_public,
            dh_self_private,
            dh_remote: None,
            root_key: shared_root,
            chain_key_send: None,
            chain_key_recv: None,
            ns: 0,
            nr: 0,
            pn: 0,
            skipped_keys: HashMap::new(),
        }
    }

    /// Encrypts `plaintext` under the next message key on the sending
    /// chain, advancing the symmetric ratchet by one step. Returns the
    /// header to send alongside the ciphertext and the ciphertext itself.
    pub fn ratchet_encrypt(
        &mut self,
        plaintext: &[u8],
        associated_data: &[u8],
    ) -> Result<(Header, Vec<u8>), RatchetError> {
        let ck = self
            .chain_key_send
            .ok_or(RatchetError::ChainNotInitialized("sending"))?;

        let (next_ck, mut mk) = kdf_ck(&ck);
        self.chain_key_send = Some(next_ck);

        let header = Header {
            dh_public: self.dh_self_public,
            pn: self.pn,
            n: self.ns,
        };
        self.ns += 1;

        let ciphertext = encrypt_aead(&mk, &header, plaintext, associated_data)?;
        mk.zeroize();

        Ok((header, ciphertext))
    }

    /// Decrypts a message given its header and ciphertext, performing
    /// whatever combination of skipped-key derivation and DH ratchet turn
    /// is needed to bring this session in sync with the sender's header.
    pub fn ratchet_decrypt(
        &mut self,
        header: &Header,
        ciphertext: &[u8],
        associated_data: &[u8],
    ) -> Result<Vec<u8>, RatchetError> {
        // 1. Check the skipped-key cache first — this message may have
        //    arrived out of order after a later one already advanced the
        //    chain past it.
        let id: SkippedKeyId = (*header.dh_public.as_bytes(), header.n);
        if let Some(mut mk) = self.skipped_keys.remove(&id) {
            let plaintext = decrypt_aead(&mk, header, ciphertext, associated_data)?;
            mk.zeroize();
            return Ok(plaintext);
        }

        // 2. If the header carries a new DH public key, this is a DH
        //    ratchet turn: skip and cache any trailing keys on the current
        //    receiving chain, then derive fresh root/receiving keys and a
        //    fresh sending chain, and reset our own DH key pair.
        let is_new_ratchet_key = match self.dh_remote {
            Some(remote) => remote.as_bytes() != header.dh_public.as_bytes(),
            None => true,
        };

        if is_new_ratchet_key {
            self.skip_message_keys(header.pn)?;
            self.dh_ratchet(header)?;
        }

        // 3. A header index at or before our current receiving position
        //    that was not served by the skipped-key cache above refers to
        //    a message we have already consumed and discarded the key
        //    for (or one that never existed on this chain). Reject it
        //    outright rather than deriving past it, which would otherwise
        //    silently desynchronize the chain on a failed decrypt.
        if header.n < self.nr {
            return Err(RatchetError::SessionOutdated { n: header.n });
        }

        // 4. Skip forward on the (now-current) receiving chain up to the
        //    message we actually want, caching each intermediate key.
        self.skip_message_keys(header.n)?;

        // 5. Derive this message's key on a *local* copy of the chain
        //    state first. Only commit `chain_key_recv`/`nr` back onto
        //    `self` once decryption has actually succeeded, so a failed
        //    decrypt (forged ciphertext, wrong AAD, replay with a
        //    mismatched body) never desynchronizes the receiving chain.
        let ck = self
            .chain_key_recv
            .ok_or(RatchetError::ChainNotInitialized("receiving"))?;
        let (next_ck, mut mk) = kdf_ck(&ck);

        let plaintext = decrypt_aead(&mk, header, ciphertext, associated_data);
        mk.zeroize();
        let plaintext = plaintext?;

        self.chain_key_recv = Some(next_ck);
        self.nr += 1;

        Ok(plaintext)
    }

    /// Derives and caches message keys for every index from the current
    /// receiving-chain position up to (but not including) `until`, so a
    /// later out-of-order message at one of those indices can still be
    /// decrypted. No-ops if there is no receiving chain yet or `until` is
    /// not ahead of the current position.
    fn skip_message_keys(&mut self, until: u32) -> Result<(), RatchetError> {
        let Some(remote) = self.dh_remote else {
            return Ok(());
        };
        let Some(mut ck) = self.chain_key_recv else {
            return Ok(());
        };

        if until.saturating_sub(self.nr) > MAX_SKIP {
            return Err(RatchetError::SkippedKeysExceeded(MAX_SKIP));
        }

        while self.nr < until {
            let (next_ck, mk) = kdf_ck(&ck);
            self.skipped_keys
                .insert((*remote.as_bytes(), self.nr), mk);
            ck = next_ck;
            self.nr += 1;
        }
        self.chain_key_recv = Some(ck);
        Ok(())
    }

    /// Performs one Diffie-Hellman ratchet turn in response to observing a
    /// new remote public key in an incoming header: derives a fresh
    /// receiving chain from DH(self_old, remote_new), then generates a
    /// fresh local key pair and derives a fresh sending chain from
    /// DH(self_new, remote_new). This is the step that injects the fresh
    /// entropy responsible for post-compromise security.
    fn dh_ratchet(&mut self, header: &Header) -> Result<(), RatchetError> {
        self.pn = self.ns;
        self.ns = 0;
        self.nr = 0;
        self.dh_remote = Some(header.dh_public);

        let dh_out_recv = self.dh_self_private.diffie_hellman(&header.dh_public);
        let (root_key, chain_key_recv) = kdf_rk(&self.root_key, dh_out_recv.as_bytes());
        self.root_key = root_key;
        self.chain_key_recv = Some(chain_key_recv);

        let new_private = StaticSecret::random_from_rng(OsRng);
        let new_public = PublicKey::from(&new_private);
        self.dh_self_private = new_private;
        self.dh_self_public = new_public;

        let dh_out_send = self.dh_self_private.diffie_hellman(&header.dh_public);
        let (root_key, chain_key_send) = kdf_rk(&self.root_key, dh_out_send.as_bytes());
        self.root_key = root_key;
        self.chain_key_send = Some(chain_key_send);

        Ok(())
    }

    /// This party's current ratchet DH public key, for inspection/testing.
    pub fn dh_public(&self) -> PublicKey {
        self.dh_self_public
    }
}

/// Derives a ChaCha20-Poly1305 nonce deterministically from the message
/// index so encrypt/decrypt need not track or transmit a separate nonce —
/// the header's `n` already uniquely identifies the message within its
/// chain, and a chain key is never reused across chains.
fn nonce_from_counter(n: u32) -> Nonce {
    let mut bytes = [0u8; 12];
    bytes[8..12].copy_from_slice(&n.to_be_bytes());
    Nonce::from(bytes)
}

fn encrypt_aead(
    mk: &[u8; 32],
    header: &Header,
    plaintext: &[u8],
    associated_data: &[u8],
) -> Result<Vec<u8>, RatchetError> {
    let cipher = ChaCha20Poly1305::new(Key::from_slice(mk));
    let nonce = nonce_from_counter(header.n);

    let header_bytes = header.to_bytes();
    let mut aad = Vec::with_capacity(header_bytes.len() + associated_data.len());
    aad.extend_from_slice(&header_bytes);
    aad.extend_from_slice(associated_data);

    cipher
        .encrypt(
            &nonce,
            Payload {
                msg: plaintext,
                aad: &aad,
            },
        )
        .map_err(|_| RatchetError::DecryptionFailed)
}

fn decrypt_aead(
    mk: &[u8; 32],
    header: &Header,
    ciphertext: &[u8],
    associated_data: &[u8],
) -> Result<Vec<u8>, RatchetError> {
    let cipher = ChaCha20Poly1305::new(Key::from_slice(mk));
    let nonce = nonce_from_counter(header.n);

    let header_bytes = header.to_bytes();
    let mut aad = Vec::with_capacity(header_bytes.len() + associated_data.len());
    aad.extend_from_slice(&header_bytes);
    aad.extend_from_slice(associated_data);

    cipher
        .decrypt(
            &nonce,
            Payload {
                msg: ciphertext,
                aad: &aad,
            },
        )
        .map_err(|_| RatchetError::DecryptionFailed)
}
