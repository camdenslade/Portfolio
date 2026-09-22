// Content for the single continuous /capstone page. No slide/deck concept:
// this is prose the page renders top to bottom, section by section, in the
// story order the presentation follows.
//
//   1. Hook: the cold-boot / evil-roommate problem
//   2. Background: what a Diffie-Hellman key exchange actually is
//   3. Symmetric ratchet: Gear 1, forward secrecy
//   4. DH ratchet / PCS: Gear 2, the self-healing paradox
//   5. Real code: annotated excerpts from the Rust implementation
//   6. Live demo: the interactive simulator (rendered separately by the
//      page, using RatchetVisualizer/AdversaryHarness)
//   7. The math: CDH reduction, framed in plain English first

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
      text: 'Say you and a friend set up an encrypted chat the ordinary way: a single number $K$, fixed once at the start, and every message afterward is encrypted using that same $K$. This is how a lot of software still works, and for a while it is fine.',
    },
    {
      heading: 'Then someone grabs your laptop',
      text: 'Your roommate borrows your unlocked laptop for ten seconds. Or, more realistically, an attacker copies whatever numbers happen to be sitting in memory at that moment. Either way, they now know $K$.',
    },
    {
      heading: 'The consequence is total',
      text: 'If they also recorded your encrypted traffic, which is easy since the encrypted version of a message is not secret, they can now recover every message you have ever sent, since every single one used the same $K$. And every message you send from now on, forever, since nothing about $K$ ever changes. One number, known once, breaks the entire past and the entire future of the conversation.',
    },
    {
      heading: 'What we actually want',
      text: "We want a scheme where knowing today's key does not let you recover yesterday's messages. Call that forward secrecy. And, this is the part that sounds impossible, we want it so that knowing today's key does not let you recover next week's messages either, without either party doing anything special. Call that post-compromise security. Both properties come from replacing the single fixed K with a whole sequence of keys, built by two interacting recurrence relations. First, the one piece of number theory both of them lean on.",
    },
  ],
};

export const DH_BACKGROUND: NarrativeSection = {
  id: 'background',
  eyebrow: 'Before Gear 1',
  title: 'One piece of number theory this whole talk rests on',
  blocks: [
    {
      text: "There is a 1976 result that everything from here on depends on: two people can agree on a shared value over a channel someone else is fully watching, and that observer still can't reconstruct it. That sounds impossible the first time you hear it, so here is the shape of it, since we will use this exact construction twice more later in the talk.",
    },
    {
      heading: 'Two exponents, one shared base',
      text: 'Fix a group with generator $g$, known to everyone. Alice picks a private exponent $a$ and publishes $g^a$. Bob picks his own private exponent $b$ and publishes $g^b$. Only the two public values, $g^a$ and $g^b$, ever cross the open channel.',
    },
    {
      heading: 'The trick: exponentiation commutes',
      text: 'Alice takes the value she received, $g^b$, and raises it to her own exponent $a$, giving $(g^b)^a$. Bob does the mirror computation, $(g^a)^b$. Since these are equal, both land on the exact same value without either of them ever revealing $a$ or $b$.',
      math: '(g^{b})^{a} = g^{ab} = (g^{a})^{b}',
      isBlockMath: true,
    },
    {
      heading: 'Why an observer is stuck',
      text: "The observer sees $g$, $g^a$, and $g^b$. Recovering the exponent $a$ from $g^a$ alone is the discrete logarithm problem: on the groups modern protocols use, no algorithm faster than brute force is known for it. No $a$, no $b$, means no way to compute $g^{ab}$, even with a perfect record of everything that crossed the channel.",
    },
    {
      heading: 'Where the double ratchet uses this',
      text: 'Run this exchange once and you get one shared value, fixed forever. That is fine for old-fashioned encrypted email, but it is exactly the single point of failure this talk opened with: learn that one value and the whole conversation, past and future, is open. The double ratchet\'s idea is to re-run this exact exchange continuously, with fresh exponents every time, throughout the conversation, so no single value is ever enough on its own.',
    },
  ],
};

export const SYMMETRIC_RATCHET: NarrativeSection = {
  id: 'symmetric-ratchet',
  eyebrow: 'Gear 1: Forward Secrecy',
  title: 'A recurrence relation that only runs forward',
  blocks: [
    {
      text: 'Instead of one key for the whole conversation, define a sequence of keys by a recurrence relation: each term is produced from the one before it by a fixed function $H$, and $H$ is chosen to be a one-way function, meaning easy to evaluate, effectively impossible to invert.',
      math: 'CK_{i+1} = H(CK_i), \\qquad MK_i = H\'(CK_i)',
      isBlockMath: true,
    },
    {
      heading: 'The invariant',
      text: 'The moment Alice computes $CK_{i+1}$, she deletes $CK_i$. Not marks it unused, actually erases the value. Each term of the sequence exists for exactly as long as it takes to compute the next term and this message\'s key from it.',
    },
    {
      heading: 'The payoff',
      text: "Say an adversary learns $CK_{10}$, the value of the sequence at index 10. Can they compute $CK_{11}$, $CK_{12}$, and every later term? Yes, that direction is just evaluating $H$ again and again. Can they recover $CK_9$, and therefore anything encrypted with it? No. That would mean inverting $H$, which is precisely the property a one-way function is chosen not to have.",
    },
    {
      heading: 'What this buys, and what it does not',
      text: "That's forward secrecy: every earlier term of the sequence stays out of reach no matter what happens to the current one. But notice what it does not give you. Knowing $CK_{10}$ still lets you compute every later term, forever. The adversary is locked out of the past, but very much still inside the sequence going forward. Fixing that needs a second recurrence relation, one built on the exchange from a moment ago.",
    },
  ],
};

export const DH_RATCHET: NarrativeSection = {
  id: 'dh-ratchet',
  eyebrow: 'Gear 2: Post-Compromise Security',
  title: 'Restarting the sequence with a fresh seed',
  blocks: [
    {
      text: 'Here is the paradox: forward secrecy protects earlier terms of the sequence, but knowing $CK_{10}$ lets you compute $CK_{11}$, $CK_{12}$, and every later term for free. How do you break that dependency, mid-sequence, without either party starting an entirely new conversation?',
    },
    {
      heading: 'The fix: a fresh Diffie-Hellman exchange, every reply',
      text: 'The construction from a moment ago: two fresh exponents, combined over the open channel, land both parties on a value nobody watching can reconstruct. The double ratchet runs that exact construction on every single reply. Every time Bob replies to Alice, he picks a brand-new random exponent $b$ and sends the public value $g^b$ along with his message. Alice combines that with her own exponent to compute the new shared value.',
      math: 'SS = (g^{b})^{a} = g^{ab}',
      isBlockMath: true,
    },
    {
      heading: 'Re-seeding the sequence',
      text: "That shared value gets folded into the root key, which seeds an entirely new sequence, independent of the compromised one. The old sequence isn't extended or patched, it's abandoned, and a fresh recurrence starts in its place.",
    },
    {
      heading: 'Why the adversary is now locked out',
      text: "The adversary who learned Alice's old value does not know Bob's new exponent $b$: it was chosen after the compromise and never appeared anywhere they were watching. Without $b$, computing $g^{ab}$ is exactly the discrete logarithm problem again, so they cannot seed the new sequence, and every term from this point on is opaque to them. It's the identical guarantee explained a moment ago, just invoked again partway through the conversation instead of only once at the start.",
    },
    {
      heading: 'The catchline',
      text: 'The scheme self-heals in exactly one round trip. Alice does not need to notice anything was compromised. She does not need to do anything differently. The very next reply from Bob quietly restarts the sequence with a seed the adversary never saw. That is what makes this feel like it shouldn\'t be possible, and it is the single idea worth remembering from this whole talk.',
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
// trimmed for length and re-commented line by line for a reader with no
// cryptography background. Every line of actual logic here is unchanged
// from the crate; only comments were added or expanded.
export const CODE_SNIPPETS: CodeSnippet[] = [
  {
    id: 'kdf-ck',
    label: 'Gear 1, in code: evaluating the recurrence once',
    file: 'src/kdf.rs',
    intro:
      "This is the function that runs every time a message is sent: the literal implementation of the recurrence $CK_{i+1} = H(CK_i)$ from Gear 1. It takes the current term of the sequence and produces two things: the next term, and this message's one-time key.",
    code: `// "ck" is CK_i, the CURRENT term of the sequence: a 32-byte value
// only Alice and Bob know. This function is called once per message.
pub fn kdf_ck(ck: &[u8; 32]) -> ([u8; 32], [u8; 32]) {

    // HMAC is our one-way function H: easy to evaluate forward,
    // effectively impossible to invert. We evaluate it twice on the
    // SAME input, but with two different "labels" (0x01 vs 0x02), so
    // the two outputs below are unrelated to each other even though
    // they both come from the same term "ck".

    // Label 0x02 gives CK_{i+1}, the NEXT term of the sequence. This
    // is the recurrence itself: tomorrow's value from today's.
    let next_chain_key = hmac_sha256(ck, CK_INFO_CHAIN);

    // Label 0x01 gives MK_i, the one-time key for THIS message only.
    let message_key = hmac_sha256(ck, CK_INFO_MESSAGE);

    // The caller stores "next_chain_key" and immediately overwrites
    // (erases) the old "ck", see the Drop snippet below. There is no
    // way to recover ck from next_chain_key; that would mean
    // inverting H.
    (next_chain_key, message_key)
}`,
  },
  {
    id: 'dh-ratchet',
    label: 'Gear 2, in code: the self-healing exchange',
    file: 'src/state.rs',
    intro:
      "This runs whenever a reply arrives carrying a brand-new public value, the code behind $SS = (g^b)^a = g^{ab}$ from Gear 2. Notice it also picks a fresh exponent of its own, so the NEXT reply keeps the healing going in both directions.",
    code: `// Called when an incoming message's header carries a public value
// we have not seen before, i.e. the other side just picked a new
// exponent and this is their g^b arriving.
fn dh_ratchet(&mut self, header: &Header) {

    // Step 1: remember the other party's brand-new public value.
    self.dh_remote = Some(header.dh_public);

    // Step 2: combine OUR (old) exponent with THEIR (new) public
    // value. This is exactly (g^b)^a = g^{ab} from the background.
    // Neither side ever reveals its exponent, only its public value,
    // yet both land on the same shared value independently.
    let dh_out_recv = self.dh_self_private.diffie_hellman(&header.dh_public);

    // Step 3: fold that shared value into the root key. The old root
    // key plus a value nobody but us could compute produces a new
    // seed an old thief could never predict, because they never saw
    // this exchange happen.
    let (root_key, chain_key_recv) = kdf_rk(&self.root_key, dh_out_recv.as_bytes());
    self.root_key = root_key;
    self.chain_key_recv = Some(chain_key_recv);

    // Step 4: pick a FRESH exponent of our own for next time. This is
    // what keeps the healing going: every reply plants a new seed.
    let new_private = StaticSecret::random_from_rng(OsRng);
    self.dh_self_private = new_private;
}`,
  },
  {
    id: 'zeroize-drop',
    label: 'The erase invariant, in code',
    file: 'src/state.rs',
    intro:
      'Gear 1 only works if "delete the old key" is actually enforced, not just a comment saying you should. This runs automatically, the Rust compiler guarantees it, the instant a session\'s memory is no longer needed, whether that\'s a normal cleanup or the program crashing.',
    code: `// Rust calls this function AUTOMATICALLY the moment a SessionState
// value is no longer reachable. You cannot forget to call it, and
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
        // delivery get wiped too: nothing capable of decrypting a
        // message is allowed to outlive its usefulness.
        for key in self.skipped_keys.values_mut() {
            key.zeroize();
        }
    }
}`,
  },
];

export const MATH_INTRO: ProseBlock = {
  text: "The reduction below is the formal version of everything just described, stated as a proof by reduction: assume an adversary who breaks this scheme, then use that adversary as a subroutine to break the underlying hard problem. You do not need to parse every symbol. Read it once for the shape, then read the plain translation underneath.",
};

export const MATH_REDUCTION = {
  statement:
    'Given a group $G$ with generator $g$ of prime order $q$, suppose an adversary $\\mathcal{A}$ distinguishes a derived session key from a uniformly random one with non-negligible advantage. Then there exists an algorithm $\\mathcal{B}$, built directly from $\\mathcal{A}$, that solves the Computational Diffie-Hellman problem, computing $g^{ab}$ from $g^a$ and $g^b$, with advantage bounded by:',
  math: '\\text{Adv}_{\\text{DoubleRatchet}}^{\\text{MSKE}}(\\mathcal{A}) \\le n_s \\cdot \\text{Adv}_{\\mathbb{G}}^{\\text{CDH}}(\\mathcal{B}) + n_s \\cdot \\text{Adv}_{\\text{PRF}}^{\\text{HKDF}}(\\mathcal{B})',
  plainEnglish:
    "In words: if you could reliably tell our derived keys apart from pure random noise, you could use that ability to solve the discrete logarithm problem from earlier in the talk, computing $g^{ab}$ without ever knowing $a$ or $b$. Since nobody has an efficient algorithm for that problem, nobody has an efficient way to break the scheme either. The $n_s$ factor is just bookkeeping from the proof technique, a union bound over which of the $n_s$ stages the adversary attacked, not a weakness in the scheme itself.",
  healing: {
    math: '\\text{Adv}_{\\mathcal{A}}(s_{\\text{post-heal}}) \\le \\text{Adv}_{\\mathbb{G}}^{\\text{CDH}}(\\mathcal{B}) + 2^{-\\lambda}',
    plainEnglish:
      "And this is the self-healing guarantee stated as the same kind of bound: once one round of the exchange completes after a compromise, the adversary's advantage collapses back down to essentially the same bound as if the compromise had never happened at all. The $2^{-\\lambda}$ term is a negligible correction, shrinking exponentially as the security parameter grows, which is the formal way of saying \"as close to zero as you like.\"",
  },
};
