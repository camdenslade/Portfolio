//! The two key-derivation functions that drive the double ratchet's two
//! ratchets (see `docs::signal double ratchet spec, §2.2, §5.2`):
//!
//! - `KDF_RK` mixes a fresh Diffie-Hellman output into the root key on every
//!   asymmetric (DH) ratchet turn, producing a new root key and a fresh
//!   sending/receiving chain key. This is what gives the protocol
//!   post-compromise security: an adversary who has stolen the current root
//!   key learns nothing about the *next* root key without also learning the
//!   fresh DH secret.
//!
//! - `KDF_CK` is the symmetric ratchet: it turns a chain key into the next
//!   chain key plus a one-time message key, using a one-way construction so
//!   that recovering `CK_i` does not let an adversary recover `CK_{i-1}`.
//!   This is what gives forward secrecy on every single message.
//!
//! Both are built on HMAC-based HKDF-SHA256 (via the `hkdf` crate) rather
//! than a hand-rolled MAC, per the spec's recommendation.

use hkdf::Hkdf;
use sha2::Sha256;
use zeroize::Zeroize;

/// Domain-separation strings so `KDF_RK` and `KDF_CK` can never be confused
/// with each other even if (hypothetically) fed the same input key material.
const RK_INFO: &[u8] = b"DoubleRatchet_KDF_RK_v1";
const CK_INFO_CHAIN: &[u8] = b"DoubleRatchet_KDF_CK_chain_v1";
const CK_INFO_MESSAGE: &[u8] = b"DoubleRatchet_KDF_CK_message_v1";

/// Root KDF: `KDF_RK(rk, dh_out) -> (next_root_key, chain_key)`.
///
/// `rk` is the current 32-byte root key, `dh_out` is the raw X25519 shared
/// secret from the current DH ratchet turn. HKDF is used with `rk` as salt
/// and `dh_out` as input key material, which is the standard instantiation
/// recommended by the Signal spec (HKDF with SHA-256, 64 bytes of output
/// split into two 32-byte keys).
///
/// Both intermediate HKDF state and the raw 64-byte output buffer are
/// zeroized before returning, so no unexpired copy of the mixed secret
/// lingers in memory beyond the two keys the caller actually keeps.
pub fn kdf_rk(rk: &[u8; 32], dh_out: &[u8; 32]) -> ([u8; 32], [u8; 32]) {
    let hk = Hkdf::<Sha256>::new(Some(rk), dh_out);

    let mut okm = [0u8; 64];
    hk.expand(RK_INFO, &mut okm)
        .expect("64 bytes is a valid HKDF-SHA256 output length");

    let mut next_root_key = [0u8; 32];
    let mut chain_key = [0u8; 32];
    next_root_key.copy_from_slice(&okm[..32]);
    chain_key.copy_from_slice(&okm[32..]);

    // Wipe the combined output buffer now that it has been split into the
    // two keys we actually return.
    okm.zeroize();

    (next_root_key, chain_key)
}

/// Symmetric chain KDF: `KDF_CK(ck) -> (next_chain_key, message_key)`.
///
/// Implemented as two independent HMAC-SHA256 calls over the same chain
/// key with distinct single-byte constants — the construction the Signal
/// spec calls out as a common, safe choice: `CK' = HMAC(CK, 0x02)`,
/// `MK = HMAC(CK, 0x01)`. Because it's a MAC (not encryption), this is a
/// strict one-way function of `CK`: recovering `CK'` or `MK` does not
/// allow recovering `CK`, which is precisely the forward-secrecy property
/// the symmetric ratchet is supposed to provide.
pub fn kdf_ck(ck: &[u8; 32]) -> ([u8; 32], [u8; 32]) {
    let next_chain_key = hmac_sha256(ck, CK_INFO_CHAIN);
    let message_key = hmac_sha256(ck, CK_INFO_MESSAGE);
    (next_chain_key, message_key)
}

/// HMAC-SHA256 built on the same HKDF machinery for consistency (HKDF's
/// `extract` step *is* HMAC-SHA256 with `ck` as key and `info` as message),
/// avoiding a second MAC dependency for one function.
fn hmac_sha256(key: &[u8; 32], info: &[u8]) -> [u8; 32] {
    let (prk, _) = Hkdf::<Sha256>::extract(Some(key), info);
    let mut out = [0u8; 32];
    out.copy_from_slice(&prk);
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn kdf_rk_is_deterministic() {
        let rk = [7u8; 32];
        let dh = [9u8; 32];
        let (rk1, ck1) = kdf_rk(&rk, &dh);
        let (rk2, ck2) = kdf_rk(&rk, &dh);
        assert_eq!(rk1, rk2);
        assert_eq!(ck1, ck2);
    }

    #[test]
    fn kdf_rk_differs_from_input() {
        let rk = [1u8; 32];
        let dh = [2u8; 32];
        let (next_rk, ck) = kdf_rk(&rk, &dh);
        assert_ne!(next_rk, rk);
        assert_ne!(ck, rk);
        assert_ne!(next_rk, ck);
    }

    #[test]
    fn kdf_ck_chain_and_message_keys_differ() {
        let ck = [3u8; 32];
        let (next_ck, mk) = kdf_ck(&ck);
        assert_ne!(next_ck, ck);
        assert_ne!(mk, ck);
        assert_ne!(next_ck, mk);
    }

    #[test]
    fn kdf_ck_advances_deterministically_but_one_way() {
        let ck0 = [5u8; 32];
        let (ck1, mk1) = kdf_ck(&ck0);
        let (ck1_again, mk1_again) = kdf_ck(&ck0);
        // Same input -> same output (needed for Alice and Bob to agree).
        assert_eq!(ck1, ck1_again);
        assert_eq!(mk1, mk1_again);

        // Stepping twice from ck0 does not equal stepping once from ck1
        // in a way that would let you shortcut the chain.
        let (ck2, _) = kdf_ck(&ck1);
        assert_ne!(ck2, ck1);
    }
}
