//! Error types for the double ratchet implementation.
//!
//! Every failure mode is a distinct variant rather than a single opaque
//! error so callers (and the capstone presentation) can distinguish, for
//! example, a forged ciphertext from a session that has simply fallen too
//! far out of sync to recover.

use thiserror::Error;

#[derive(Debug, Error)]
pub enum RatchetError {
    /// AEAD decryption failed: either the ciphertext was tampered with, the
    /// wrong message key was used, or the associated data did not match.
    #[error("failed to decrypt ciphertext (authentication tag mismatch)")]
    DecryptionFailed,

    /// The header's authentication (MAC / AEAD tag over the header) did not
    /// verify. Kept distinct from `DecryptionFailed` so a caller can tell a
    /// forged header apart from a forged body during protocol analysis.
    #[error("invalid message authentication code")]
    InvalidMac,

    /// The sender skipped more messages in one chain than
    /// `MAX_SKIP` allows. This caps the memory an adversary can force a
    /// receiver to spend caching skipped message keys.
    #[error("too many skipped messages in one chain (limit is {0})")]
    SkippedKeysExceeded(u32),

    /// The incoming header refers to a message index at or before one this
    /// session has already advanced past on that chain, and no cached
    /// skipped key exists for it. The message cannot be recovered.
    #[error("message counter {n} is older than the current session position")]
    SessionOutdated { n: u32 },

    /// A DH public key or serialized header could not be parsed into the
    /// expected fixed-size representation.
    #[error("failed to (de)serialize protocol data: {0}")]
    SerializationError(&'static str),

    /// Attempted to encrypt or decrypt before the session has a chain key
    /// established in that direction (e.g. Bob trying to send before he
    /// has received Alice's first message).
    #[error("no {0} chain key established for this session")]
    ChainNotInitialized(&'static str),
}
