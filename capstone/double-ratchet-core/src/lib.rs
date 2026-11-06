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
//! let User 2_private = StaticSecret::random_from_rng(OsRng);
//! let User 2_public = PublicKey::from(&User 2_private);
//!
//! let mut User 2 = SessionState::init_User 2(shared_root, (User 2_private, User 2_public));
//! let mut User 1 = SessionState::init_User 1(shared_root, User 2_public);
//!
//! let (header, ciphertext) = User 1.ratchet_encrypt(b"hello, User 2", b"").unwrap();
//! let plaintext = User 2.ratchet_decrypt(&header, &ciphertext, b"").unwrap();
//! assert_eq!(plaintext, b"hello, User 2");
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
