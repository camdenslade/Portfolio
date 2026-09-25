// Content for the single continuous /capstone page. No slide/deck concept:
// this is prose the page renders top to bottom, section by section, in the
// story order the presentation follows.
//
//   1. Hook: the cold-boot / evil-roommate problem
//   2. Background: what a Diffie-Hellman key exchange actually is, worked
//      by hand in a small toy group (p = 23, g = 5)
//   3. Symmetric ratchet: Gear 1, forward secrecy
//   4. DH ratchet / PCS: Gear 2, the self-healing paradox, worked by hand
//      with the same toy numbers, including the honest one-round delay
//   5. Live demo: the interactive simulator (rendered separately by the
//      page, using RatchetVisualizer/AdversaryHarness)
//   6. Baby-step giant-step: one theorem, proved from scratch, in place of
//      the old unsourced formal reduction

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
      text: "We want a scheme where knowing today's key does not let you recover yesterday's messages. Call that forward secrecy. And, this is the part that sounds impossible, we want it so that knowing today's key does not let you recover next week's messages either, without either party doing anything special. Call that post-compromise security. Both properties come from replacing the single fixed K with a whole sequence of keys, built by two interacting recurrence relations. First, the one piece of number theory both of them lean on, and we will work it by hand with real numbers, not just symbols.",
    },
  ],
};

export const DH_BACKGROUND: NarrativeSection = {
  id: 'background',
  eyebrow: 'Before Gear 1',
  title: 'One piece of number theory this whole talk rests on',
  blocks: [
    {
      text: "There is an idea from 1976 that everything from here on depends on: two people can agree on a shared value over a channel someone else is fully watching, and that observer still can't reconstruct it. That sounds impossible the first time you hear it, so we will work through it with small enough numbers to check by hand, since we will use this exact construction twice more later in the talk.",
    },
    {
      heading: 'A toy group we can actually compute in',
      text: 'Take $p = 23$ and $g = 5$. The powers of 5, reduced mod 23, hit all 22 nonzero remainders before repeating, so 5 is a generator of the whole group. By Fermat\'s little theorem, $5^{22} \\equiv 1 \\pmod{23}$, so exponents themselves only matter mod 22: $5^{23} \\equiv 5^1$, $5^{90} \\equiv 5^{90 \\bmod 22}$, and so on. That single fact, exponents wrap around mod 22, is what makes the arithmetic below manageable.',
      math: '5^{22} \\equiv 1 \\pmod{23}',
      isBlockMath: true,
    },
    {
      heading: 'Two exponents, one shared base',
      text: 'User 1 picks a private exponent $a = 6$ and sends $5^6 \\bmod 23 = 8$. User 2 picks a private exponent $b = 15$ and sends $5^{15} \\bmod 23 = 19$. Only the two public numbers, 8 and 19, ever cross the open channel; the exponents 6 and 15 never do.',
      math: '5^{6} \\equiv 8, \\qquad 5^{15} \\equiv 19 \\pmod{23}',
      isBlockMath: true,
    },
    {
      heading: 'The trick: exponentiation commutes',
      text: 'User 1 takes the value they received, 19, and raises it to their own exponent 6, giving $19^6 \\bmod 23$. User 2 takes the value they received, 8, and raises it to their own exponent 15, giving $8^{15} \\bmod 23$. Both computations equal $5^{6 \\cdot 15} = 5^{90}$, and since $90 = 4 \\cdot 22 + 2$, that reduces to $5^2 = 2$. Both sides land on 2 without either one ever seeing the other\'s exponent.',
      math: '19^{6} \\equiv 8^{15} \\equiv 5^{90} \\equiv 5^{2} = 2 \\pmod{23}',
      isBlockMath: true,
    },
    {
      heading: 'Why an observer is stuck',
      text: 'The observer sees $g = 5$, and the two public values 8 and 19. Recovering the exponent 6 from 8 alone means solving $5^x \\equiv 8 \\pmod{23}$ for $x$, which is the discrete logarithm problem. At this tiny size an observer could just try all 22 possible exponents, but real protocols use groups where that brute-force search is hopeless, and later in the talk we will prove the best known general method still costs about the square root of the group size, not something instant. No exponent, no way to compute 2, even with a perfect record of everything that crossed the channel.',
    },
    {
      heading: 'Where the double ratchet uses this',
      text: 'Run this exchange once and you get one shared value, fixed forever. That is fine for old-fashioned encrypted email, but it is exactly the single point of failure this talk opened with: learn that one value and the whole conversation, past and future, is open. The double ratchet\'s idea is to re-run this exact exchange continuously, with fresh exponents every time, throughout the conversation, so no single value is ever enough on its own.',
    },
    {
      heading: 'What we are assuming, honestly',
      text: 'Everything in this talk rests on one assumption: that computing $g^{ab}$ from $g^a$ and $g^b$ alone, without ever seeing $a$ or $b$, is computationally hard. That assumption has never been proven in the mathematical sense, the way you would prove a theorem in this class; it is a belief backed by decades of failed attacks against it. The Signal protocol this talk is built around has a full, rigorous security proof under this and related assumptions, but that proof runs many pages of cryptographic reduction and is well beyond what a talk like this can honestly present. If you want to see it, the reference is Cohn-Gordon, Cremers, Dowling, Garratt, and Stebila, "A Formal Security Analysis of the Signal Messaging Protocol," IEEE EuroS&P 2017.',
    },
  ],
};

export const SYMMETRIC_RATCHET: NarrativeSection = {
  id: 'symmetric-ratchet',
  eyebrow: 'Gear 1: Forward Secrecy',
  title: 'A recurrence relation that only runs forward',
  blocks: [
    {
      text: 'Instead of one key for the whole conversation, define a sequence of keys by a recurrence relation: each term is produced from the one before it by a fixed function $H$. Treat $H$ as a black box with one stated property: easy to evaluate forward, and believed to be effectively impossible to invert. We are not claiming any particular real-world function has been proven to have this property, only assuming one exists that does, and building the sequence on top of that assumption.',
      math: 'CK_{i+1} = H(CK_i), \\qquad MK_i = H\'(CK_i)',
      isBlockMath: true,
    },
    {
      heading: 'The invariant',
      text: 'The moment User 1 computes $CK_{i+1}$, they delete $CK_i$. Not marks it unused, actually erases the value. Each term of the sequence exists for exactly as long as it takes to compute the next term and this message\'s key from it.',
    },
    {
      heading: 'The payoff',
      text: "Say an adversary learns $CK_{10}$, the value of the sequence at index 10. Can they compute $CK_{11}$, $CK_{12}$, and every later term? Yes, that direction is just evaluating $H$ again and again. Can they recover $CK_9$, and therefore anything encrypted with it? No, not if $H$ really does have the one-way property we assumed. That would mean inverting $H$, which is precisely the property we are assuming it does not have.",
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
      heading: 'The setup: a compromise, in the same toy numbers',
      text: 'Continue the example from the background section. User 1 and User 2 share the value 2, computed from exponents $a = 6$ and $b = 15$. Now suppose an attacker copies everything sitting in User 1\'s memory: that includes the exponent $a = 6$ itself, not just the public value 8. This is the important part the earlier version of this talk got wrong, so watch it closely.',
    },
    {
      heading: 'The attacker is still in, for one more message',
      text: 'User 2 replies next, picking a fresh exponent $b\' = ?$ under the old design, but suppose for a moment they just reuse the exchange as before and send public value 19. The attacker, holding the stolen $a = 6$, computes $19^6 \\bmod 23$ exactly the way User 1 would, landing on the same shared value 2. Stealing $a$ is enough to keep reading anything derived from it, for as long as $a$ stays the exponent in use. This is the honest part the earlier draft skipped: the very next message after a break-in can still be read.',
    },
    {
      heading: 'The fix: a fresh exponent from the compromised side',
      text: 'What actually locks the attacker out is not Bob replying, it is User 1 picking a brand-new exponent of their own. Say User 1 picks $a\' = 9$ and sends the new public value $5^9 \\bmod 23 = 11$. The new shared value is $19^9 \\bmod 23$, and since $9 \\cdot 15 = 135 = 6 \\cdot 22 + 3$, that equals $5^3 = 10$. The attacker has now seen the public values 19 and 11 cross the channel, but they know neither exponent 15 nor the new exponent 9, so they cannot compute $19^9$ or $11^{15}$ themselves.',
      math: '5^{9} \\equiv 11, \\qquad 19^{9} \\equiv 5^{135} \\equiv 5^{3} = 10 \\pmod{23}',
      isBlockMath: true,
    },
    {
      heading: 'Re-seeding the sequence',
      text: 'That new shared value, 10, gets folded into the root key, which seeds an entirely new sequence, independent of the compromised one. The old sequence isn\'t extended or patched, it\'s abandoned, and a fresh recurrence starts in its place, exactly as in Gear 1.',
    },
    {
      heading: 'Why the adversary is now locked out',
      text: 'Computing the new shared value from the two public numbers 19 and 11 alone, without either exponent, is exactly the discrete logarithm problem again: hard for the same reason it was hard in the background section. The one honest caveat is that this healing only works against a passive attacker, one who is just listening. An attacker who can also send messages pretending to be User 1 can keep participating in the exchange itself and is not locked out by this alone; defending against that active case takes additional authentication machinery beyond what this talk covers.',
    },
    {
      heading: 'The catchline',
      text: 'The scheme self-heals in exactly one round trip, counted from the moment the compromised party picks a fresh exponent. Neither party needs to notice anything was compromised or do anything differently. The very next fresh exponent from User 1 quietly restarts the sequence with a seed the adversary never saw, at the cost of that one message in between still being readable. That is the honest version of the guarantee, and it is still the single idea worth remembering from this whole talk.',
    },
  ],
};

// Baby-step giant-step: one theorem proved from scratch, using nothing past
// the division algorithm, replacing the old unsourced CDH reduction. This
// answers "how big does the group have to be" directly from the p = 23
// toy example, where brute force over all 22 exponents is the only option.
export const BSGS: NarrativeSection = {
  id: 'discrete-log',
  eyebrow: 'One theorem, proved here',
  title: 'How hard is the discrete log, really?',
  blocks: [
    {
      text: 'At $p = 23$, an attacker trying to recover an exponent from a public value has only 22 possibilities to check, so they can just try all of them. That is not reassuring. The natural question a real security argument has to answer is: how big does the group need to be before brute force stops being feasible, and is brute force really the best an attacker can do?',
    },
    {
      heading: 'The claim',
      text: 'Baby-step giant-step solves the discrete log problem, find $x$ given $g$ and $h = g^x$ in a group of order $n$, using about $\\sqrt{n}$ steps and $\\sqrt{n}$ storage, instead of the $n$ steps brute force needs. It uses nothing beyond the division algorithm: writing $x$ as a quotient and remainder.',
    },
    {
      heading: 'The construction',
      text: 'Let $m = \\lceil \\sqrt{n} \\rceil$, and write the unknown exponent as $x = im + j$ for some $0 \\le i, j < m$, which the division algorithm guarantees is always possible. Then $g^x = g^{im+j} = (g^m)^i \\cdot g^j$, so $h \\cdot (g^{-m})^i = g^j$.',
      math: 'x = im + j, \\qquad h \\cdot g^{-im} = g^{j}',
      isBlockMath: true,
    },
    {
      heading: 'Baby steps, then giant steps',
      text: 'First, the baby steps: compute and store $g^j$ for every $j$ from 0 to $m - 1$, that is $m$ values. Second, the giant steps: compute $h \\cdot g^{-im}$ for $i = 0, 1, 2, \\dots$ and check each one against the stored table. The first match gives both $i$ and $j$, and therefore $x = im + j$.',
    },
    {
      heading: 'Why this is faster',
      text: 'Building the table costs $m \\approx \\sqrt{n}$ work. Checking giant steps against a lookup table also costs at most $m \\approx \\sqrt{n}$ steps before a match is guaranteed, since $i$ only needs to range from 0 to $m - 1$ as well. Total work and storage are both on the order of $\\sqrt{n}$, a square-root speedup over the $n$ steps of brute force, and this really is a proof, not a claim: every step above follows from the division algorithm and the group law.',
    },
    {
      heading: 'What this means for real key sizes',
      text: 'This is also why "no algorithm beats brute force" was the wrong thing to say earlier. Baby-step giant-step and the closely related Pollard rho method both bring the cost down to about $\\sqrt{n}$ steps, not $n$. That is precisely why real protocols use groups with roughly $2^{256}$ elements: a $\\sqrt{n}$ attack against a group that size costs around $2^{128}$ steps, which is the actual security margin being bought, not an arbitrary large number.',
    },
  ],
};
