// Content for the single continuous /capstone page. No slide/deck concept —
// this is prose the page renders top to bottom, section by section, in the
// story order the presentation follows:
//
//   1. Hook            — the cold-boot / evil-roommate problem
//   2. Symmetric ratchet — Gear 1, forward secrecy
//   3. DH ratchet / PCS  — Gear 2, the self-healing paradox
//   4. Live demo         — the interactive simulator (rendered separately
//                          by the page, using RatchetVisualizer/AdversaryHarness)
//   5. The math           — CDH reduction, framed in plain English first

export interface ProseBlock {
  heading?: string;
  text: string;
  math?: string;
  /** Render math as its own centered block rather than inline. */
  isBlockMath?: boolean;
}

export interface NarrativeSection {
  id: string;
  eyebrow: string;
  title: string;
  blocks: ProseBlock[];
}

export const HOOK: NarrativeSection = {
  id: 'hook',
  eyebrow: 'The problem',
  title: 'The evil roommate problem',
  blocks: [
    {
      text: 'Say you and a friend set up an encrypted chat the ordinary way: a handshake establishes one shared key K, and every message afterward is encrypted under K. This is how a lot of software still works, and for a while it is fine.',
    },
    {
      heading: 'Then someone grabs your laptop',
      text: 'Your roommate borrows your unlocked laptop for ten seconds. Or, more realistically, an attacker runs a memory dump, or a cold-boot attack against RAM that has not fully decayed. Either way, they now have K.',
    },
    {
      heading: 'The consequence is total',
      text: 'If they also recorded your encrypted traffic off the wire — which is easy, since ciphertext is not secret — they can now decrypt every message you have ever sent. And every message you send from now on, forever, unless you notice and manually restart the conversation with a new key. One ten-second lapse compromises the entire history and the entire future of the chat.',
    },
    {
      heading: 'What we actually want',
      text: "We want a protocol where stealing today's key does not hand over yesterday's messages (forward secrecy), and — this is the part that sounds impossible — does not hand over next week's messages either, without either party doing anything special (post-compromise security). The double ratchet gets both, using two interlocking mechanisms. Here is how each one works.",
    },
  ],
};

export const SYMMETRIC_RATCHET: NarrativeSection = {
  id: 'symmetric-ratchet',
  eyebrow: 'Gear 1 — Forward Secrecy',
  title: 'A one-way conveyor belt of keys',
  blocks: [
    {
      text: 'Instead of one key for the whole conversation, every single message gets its own unique key. The trick is how the next key gets made: you run the current chain key through a cryptographic one-way function — a hash, or an HMAC — to produce the next one.',
      math: 'CK_{i+1} = H(CK_i), \\qquad MK_i = H\'(CK_i)',
      isBlockMath: true,
    },
    {
      heading: 'The invariant',
      text: 'The moment Alice computes CK_{i+1}, she deletes CK_i. Not marks it unused — erases it. Every chain key exists for exactly as long as it takes to derive the next one and this message\'s key.',
    },
    {
      heading: 'The payoff',
      text: "Say an adversary steals Alice's phone right at message #10 and recovers CK_10. Can they compute CK_11, CK_12, and every future key? Yes — that direction is easy, it's just re-running the hash. Can they compute CK_9, and therefore read message #9 or anything earlier? No. Going backward through a one-way function is the entire premise of it being one-way — computationally infeasible, not just inconvenient.",
    },
    {
      heading: 'What this buys — and what it does not',
      text: "That's forward secrecy: the past is protected no matter what happens to the present key. But notice what it does not do. The adversary who has CK_10 can still predict CK_11 onward. They are locked out of the past, but very much still inside the conversation going forward. Fixing that needs a second mechanism.",
    },
  ],
};

export const DH_RATCHET: NarrativeSection = {
  id: 'dh-ratchet',
  eyebrow: 'Gear 2 — Post-Compromise Security',
  title: 'Locking the intruder back out',
  blocks: [
    {
      text: 'Here is the paradox: forward secrecy protects past messages, but if the attacker has CK_10, they can derive CK_11, CK_12, and so on forever. How do you lock an intruder out of a conversation that is already compromised, without either side restarting the chat from scratch?',
    },
    {
      heading: 'The fix: a fresh Diffie-Hellman exchange, every reply',
      text: 'Every time Bob replies to Alice, he generates a brand-new, random Diffie-Hellman key pair and attaches the public half (g^b) to his message. Alice combines that with her own private key to compute a new shared secret.',
      math: 'SS = (g^{b})^{a} = g^{ab}',
      isBlockMath: true,
    },
    {
      heading: 'Re-seeding the root',
      text: "That shared secret gets mixed into the root key, which produces an entirely new chain key — completely independent of the compromised one. The old chain isn't patched or extended; it's discarded, and a fresh one takes its place.",
    },
    {
      heading: 'Why the adversary is now locked out',
      text: "The adversary who stole Alice's old state does not know Bob's new private scalar b — it was generated after the theft and never touched disk or the network. Without b, they cannot compute g^{ab}, so they cannot derive the new root key, and every message from this point on is opaque to them.",
    },
    {
      heading: 'The catchline',
      text: 'The protocol self-heals in exactly one round trip. Alice does not need to notice she was compromised. She does not need to do anything differently. The very next reply from Bob quietly locks the door — that\'s what makes this feel like it shouldn\'t be possible, and it is the single idea worth remembering from this whole talk.',
    },
  ],
};

export interface CodeSnippet {
  id: string;
  label: string;
  /** Which real file in capstone/double-ratchet-core/src this excerpt is drawn from. */
  file: string;
  intro: string;
  code: string;
}

// Real excerpts from the Rust crate (capstone/double-ratchet-core), lightly
// trimmed for length and re-commented line-by-line for a reader with no
// cryptography background. Every line of actual logic here is unchanged
// from the crate — only comments were added or expanded.
export const CODE_SNIPPETS: CodeSnippet[] = [
  {
    id: 'kdf-ck',
    label: 'Gear 1, in code: turning the crank once',
    file: 'src/kdf.rs',
    intro:
      "This is the function that runs every time a message is sent — the literal implementation of CK_{i+1} = H(CK_i) from Gear 1. It takes the current chain key and produces two things: the next chain key, and this message's one-time key.",
    code: `// "ck" is the CURRENT chain key — a 32-byte secret only Alice and Bob know.
// This function is called once per message, in both directions.
pub fn kdf_ck(ck: &[u8; 32]) -> ([u8; 32], [u8; 32]) {

    // HMAC is a one-way scrambling function: easy to compute forward,
    // practically impossible to reverse. We call it twice on the SAME
    // input key, but with two different "labels" (0x01 vs 0x02), so the
    // two outputs below are unrelated to each other even though they
    // both come from "ck".

    // Label 0x02 -> the NEXT chain key. This is what makes it a chain:
    // tomorrow's key comes from today's, forever, one direction only.
    let next_chain_key = hmac_sha256(ck, CK_INFO_CHAIN);

    // Label 0x01 -> the MESSAGE key. This one-time key, and only this
    // key, encrypts the single message being sent right now.
    let message_key = hmac_sha256(ck, CK_INFO_MESSAGE);

    // The caller stores "next_chain_key" and immediately overwrites
    // (erases) the old "ck" — see the Drop snippet below. There is no
    // path back from next_chain_key to ck.
    (next_chain_key, message_key)
}`,
  },
  {
    id: 'dh-ratchet',
    label: 'Gear 2, in code: the self-healing exchange',
    file: 'src/state.rs',
    intro:
      "This runs whenever a reply arrives carrying a brand-new public key — the code behind SS = (g^b)^a = g^{ab} from Gear 2. Notice it generates a fresh key pair for ourselves too, so the NEXT reply keeps the healing going in both directions.",
    code: `// Called when an incoming message's header carries a DH public key
// we have not seen before — i.e. the other side just rotated keys.
fn dh_ratchet(&mut self, header: &Header) {

    // Step 1: remember the other party's brand-new public key.
    self.dh_remote = Some(header.dh_public);

    // Step 2: combine OUR (old) private key with THEIR (new) public
    // key. This is the Diffie-Hellman handshake: g^{ab}. Neither side
    // ever transmits their private key, only public keys — yet both
    // sides land on the exact same shared secret independently.
    let dh_out_recv = self.dh_self_private.diffie_hellman(&header.dh_public);

    // Step 3: mix that shared secret into the root key. The old root
    // key + brand-new entropy -> a root key an old thief could never
    // predict, because they never saw this DH exchange happen.
    let (root_key, chain_key_recv) = kdf_rk(&self.root_key, dh_out_recv.as_bytes());
    self.root_key = root_key;
    self.chain_key_recv = Some(chain_key_recv);

    // Step 4: generate a FRESH key pair of our own for next time. This
    // is what keeps the healing going — every reply plants a new seed.
    let new_private = StaticSecret::random_from_rng(OsRng);
    self.dh_self_private = new_private;
}`,
  },
  {
    id: 'zeroize-drop',
    label: 'The erase invariant, in code',
    file: 'src/state.rs',
    intro:
      'Gear 1 only works if "delete the old key" is actually enforced, not just a comment saying you should. This runs automatically — the Rust compiler guarantees it — the instant a session\'s memory is no longer needed, whether that\'s a normal cleanup or the program crashing.',
    code: `// Rust calls this function AUTOMATICALLY the moment a SessionState
// value is no longer reachable — you cannot forget to call it, and
// you cannot accidentally skip it, which is the whole point.
impl Drop for SessionState {
    fn drop(&mut self) {

        // "zeroize" overwrites these bytes with zeros in place, rather
        // than just letting the memory be reused later with the old
        // secret still sitting there readable. This defeats exactly
        // the cold-boot / memory-dump attack from the introduction.
        self.root_key.zeroize();

        if let Some(ck) = self.chain_key_send.as_mut() {
            ck.zeroize();
        }
        if let Some(ck) = self.chain_key_recv.as_mut() {
            ck.zeroize();
        }

        // Any message keys we derived early to handle out-of-order
        // delivery get wiped too — nothing capable of decrypting a
        // message is allowed to outlive its usefulness.
        for key in self.skipped_keys.values_mut() {
            key.zeroize();
        }
    }
}`,
  },
];

export const MATH_INTRO: ProseBlock = {
  text: "The reduction below is the formal version of everything just described. You do not need to parse it symbol by symbol — read it once for the shape, then read the plain-English translation underneath.",
};

export const MATH_REDUCTION = {
  statement:
    'Given an elliptic curve group G with generator g of prime order q, if an adversary breaks session key indistinguishability of the DH ratchet stage with non-negligible advantage, there exists an algorithm B solving the Computational Diffie-Hellman problem with advantage bounded by:',
  math: '\\text{Adv}_{\\text{DoubleRatchet}}^{\\text{MSKE}}(\\mathcal{A}) \\le n_s \\cdot \\text{Adv}_{\\mathbb{G}}^{\\text{CDH}}(\\mathcal{B}) + n_s \\cdot \\text{Adv}_{\\text{PRF}}^{\\text{HKDF}}(\\mathcal{B})',
  plainEnglish:
    'This formula is just the formal way of saying: unless an adversary can solve the Discrete Logarithm problem on elliptic curves faster than brute force, they cannot distinguish our derived keys from pure random noise. Break the ratchet, and you\'ve broken one of the hardest problems in classical cryptography.',
  healing: {
    math: '\\text{Adv}_{\\mathcal{A}}(s_{\\text{post-heal}}) \\le \\text{Adv}_{\\mathbb{G}}^{\\text{CDH}}(\\mathcal{B}) + 2^{-\\lambda}',
    plainEnglish:
      'And this is the self-healing guarantee stated formally: once one DH ratchet turn completes after a compromise, the adversary\'s advantage collapses back down to "as hard as breaking CDH" — the same bound as if they\'d never compromised anything at all.',
  },
};
