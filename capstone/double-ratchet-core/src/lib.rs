//! `double-ratchet-core`: a clean-room implementation of the Signal Double
//! Ratchet algorithm, built for the "Continuous Key Exchange and the Double
//! Ratchet Algorithm" math capstone.
//!
//! This crate implements the ratchet itself (this deck's Slides 3, 5-7):
//! the symmetric KDF ratchet for per-message forward secrecy, the
//! Diffie-Hellman ratchet for post-compromise security, and bounded
//! skipped-message-key caching for out-of-order delivery. It does **not**
//! implement X3DH; callers are expected to supply the 32-byte shared root
//! key and initial DH public key that a real X3DH handshake would produce.
//!
//! ```
//! use double_ratchet_core::SessionState;
//! use x25519_dalek::{PublicKey, StaticSecret};
//! use rand_core::OsRng;
//!
//! // Stand-in for the output of an X3DH handshake.
//! let shared_root = [0u8; 32];
//! let bob_private = StaticSecret::random_from_rng(OsRng);
//! let bob_public = PublicKey::from(&bob_private);
//!
//! let mut bob = SessionState::init_bob(shared_root, (bob_private, bob_public));
//! let mut alice = SessionState::init_alice(shared_root, bob_public);
//!
//! let (header, ciphertext) = alice.ratchet_encrypt(b"hello, bob", b"").unwrap();
//! let plaintext = bob.ratchet_decrypt(&header, &ciphertext, b"").unwrap();
//! assert_eq!(plaintext, b"hello, bob");
//! ```

mod errors;
mod kdf;
mod state;

pub use errors::RatchetError;
pub use kdf::{kdf_ck, kdf_rk};
pub use state::{Header, SessionState, MAX_SKIP};

// Re-export the X25519 types callers need to construct key pairs, so
// downstream code (and the capstone presentation's write-up) does not need
// a direct dependency on `x25519-dalek` just to call this crate's API.
pub use x25519_dalek::{PublicKey, StaticSecret};
