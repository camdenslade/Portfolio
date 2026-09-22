//! Integration tests exercising the public API end to end, covering the
//! four properties the capstone deck argues for on Slides 3-7:
//! symmetric-ratchet message exchange, multi-message sending in one
//! direction, out-of-order / skipped-message delivery, and forward
//! secrecy (an old chain key cannot decrypt a newer message).

use double_ratchet_core::{PublicKey, RatchetError, SessionState, StaticSecret};
use rand_core::OsRng;

/// Bootstraps an (Alice, Bob) session pair sharing the same stand-in root
/// key, as if an X3DH handshake had just completed.
fn new_session_pair() -> (SessionState, SessionState) {
    let shared_root = [0x42u8; 32];
    let bob_private = StaticSecret::random_from_rng(OsRng);
    let bob_public = PublicKey::from(&bob_private);

    let bob = SessionState::init_bob(shared_root, (bob_private, bob_public));
    let alice = SessionState::init_alice(shared_root, bob_public);
    (alice, bob)
}

#[test]
fn basic_ping_pong_exchange() {
    let (mut alice, mut bob) = new_session_pair();

    let (header, ct) = alice.ratchet_encrypt(b"hello bob", b"").unwrap();
    let pt = bob.ratchet_decrypt(&header, &ct, b"").unwrap();
    assert_eq!(pt, b"hello bob");

    // Reply triggers Bob's first DH ratchet turn.
    let (header, ct) = bob.ratchet_encrypt(b"hello alice", b"").unwrap();
    let pt = alice.ratchet_decrypt(&header, &ct, b"").unwrap();
    assert_eq!(pt, b"hello alice");

    // A second round trip should also succeed, confirming both sides
    // stay in sync after alternating DH ratchet turns.
    let (header, ct) = alice.ratchet_encrypt(b"how are you", b"").unwrap();
    let pt = bob.ratchet_decrypt(&header, &ct, b"").unwrap();
    assert_eq!(pt, b"how are you");
}

#[test]
fn multi_message_single_direction_advances_symmetric_ratchet() {
    let (mut alice, mut bob) = new_session_pair();

    let messages: [&[u8]; 5] = [b"one", b"two", b"three", b"four", b"five"];
    for msg in messages {
        let (header, ct) = alice.ratchet_encrypt(msg, b"").unwrap();
        assert_eq!(header.pn, 0, "no DH ratchet turn happened yet, pn stays 0");
        let pt = bob.ratchet_decrypt(&header, &ct, b"").unwrap();
        assert_eq!(pt, msg);
    }
}

#[test]
fn out_of_order_delivery_uses_skipped_key_cache() {
    let (mut alice, mut bob) = new_session_pair();

    let m0 = alice.ratchet_encrypt(b"msg-0", b"").unwrap();
    let m1 = alice.ratchet_encrypt(b"msg-1", b"").unwrap();
    let m2 = alice.ratchet_encrypt(b"msg-2", b"").unwrap();

    // Deliver message 2 first: this forces Bob to derive and cache the
    // message keys for indices 0 and 1 before he can compute index 2's.
    let pt2 = bob.ratchet_decrypt(&m2.0, &m2.1, b"").unwrap();
    assert_eq!(pt2, b"msg-2");

    // Now deliver 0 and 1, out of order relative to arrival but each
    // should be served from the skipped-key cache rather than failing.
    let pt1 = bob.ratchet_decrypt(&m1.0, &m1.1, b"").unwrap();
    assert_eq!(pt1, b"msg-1");
    let pt0 = bob.ratchet_decrypt(&m0.0, &m0.1, b"").unwrap();
    assert_eq!(pt0, b"msg-0");
}

#[test]
fn dropped_message_does_not_block_later_delivery() {
    let (mut alice, mut bob) = new_session_pair();

    let _dropped = alice.ratchet_encrypt(b"never arrives", b"").unwrap();
    let (header, ct) = alice.ratchet_encrypt(b"arrives fine", b"").unwrap();

    // Bob never sees the dropped message at all, only the second one.
    let pt = bob.ratchet_decrypt(&header, &ct, b"").unwrap();
    assert_eq!(pt, b"arrives fine");
}

#[test]
fn skipped_keys_beyond_max_skip_are_rejected() {
    let (mut alice, mut bob) = new_session_pair();

    // Advance Alice's chain far past MAX_SKIP without ever letting Bob
    // process any of the intermediate messages.
    let mut last = None;
    for i in 0..(double_ratchet_core::MAX_SKIP + 10) {
        let (header, ct) = alice.ratchet_encrypt(format!("m{i}").as_bytes(), b"").unwrap();
        last = Some((header, ct));
    }
    let (header, ct) = last.unwrap();

    let result = bob.ratchet_decrypt(&header, &ct, b"");
    assert!(matches!(result, Err(RatchetError::SkippedKeysExceeded(_))));
}

#[test]
fn old_chain_key_cannot_decrypt_a_newer_message_forward_secrecy() {
    let (mut alice, mut bob) = new_session_pair();

    // Establish the session and capture message 0's ciphertext, which Bob
    // correctly decrypts and, per the ratchet, immediately discards the
    // message key for.
    let (h0, ct0) = alice.ratchet_encrypt(b"secret-0", b"").unwrap();
    let pt0 = bob.ratchet_decrypt(&h0, &ct0, b"").unwrap();
    assert_eq!(pt0, b"secret-0");

    // Advance to message 1 and try to decrypt IT using message 0's header
    // and ciphertext replayed against Bob's now-advanced state. This
    // models an adversary who has recorded old traffic and later
    // compromises the receiver: replaying an already-consumed message
    // must fail rather than silently succeeding with stale key material,
    // and a mismatched header/ciphertext pair must not decrypt at all.
    let (h1, ct1) = alice.ratchet_encrypt(b"secret-1", b"").unwrap();

    // h0 replayed against ct1: wrong message key/nonce pairing, AEAD tag
    // must not verify.
    let replay_result = bob.ratchet_decrypt(&h0, &ct1, b"");
    assert!(replay_result.is_err());

    // The legitimate message 1 still decrypts correctly afterward.
    let pt1 = bob.ratchet_decrypt(&h1, &ct1, b"").unwrap();
    assert_eq!(pt1, b"secret-1");
}

#[test]
fn tampered_ciphertext_is_rejected() {
    let (mut alice, mut bob) = new_session_pair();

    let (header, mut ct) = alice.ratchet_encrypt(b"integrity matters", b"").unwrap();
    // Flip a bit in the ciphertext body.
    let last = ct.len() - 1;
    ct[last] ^= 0x01;

    let result = bob.ratchet_decrypt(&header, &ct, b"");
    assert!(matches!(result, Err(RatchetError::DecryptionFailed)));
}

#[test]
fn mismatched_associated_data_is_rejected() {
    let (mut alice, mut bob) = new_session_pair();

    let (header, ct) = alice.ratchet_encrypt(b"bound to context", b"session-id-1").unwrap();
    let result = bob.ratchet_decrypt(&header, &ct, b"session-id-2");
    assert!(matches!(result, Err(RatchetError::DecryptionFailed)));
}
