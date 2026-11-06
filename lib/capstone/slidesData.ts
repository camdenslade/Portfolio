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
  title: 'The problem',
  blocks: [
    {
      text: 'Ordinary encrypted chat: one fixed number $K$, and every message uses it.',
      math: '\\text{Encrypt}(m) = E_K(m) \\ \\text{for every message } m',
      isBlockMath: true,
    },
    {
      heading: 'Then someone learns $K$',
      text: 'A borrowed laptop, a memory dump, ten seconds is enough. $K$ is compromised.',
    },
    {
      heading: 'The consequence is total',
      text: 'Every message, past and future, used the same $K$:',
      math: '\\text{know}(K) \\implies \\text{recover}\\big(\\{E_K(m) : \\text{all past and future } m\\}\\big)',
      isBlockMath: true,
    },
    {
      heading: 'What we actually want',
      text: 'Two properties, defined relative to knowing the key at time $i$:',
      math: '\\underbrace{\\text{know}(K_i) \\not\\Rightarrow \\text{recover}(K_{<i})}_{\\text{forward secrecy}} \\qquad \\underbrace{\\text{know}(K_i) \\not\\Rightarrow \\text{recover}(K_{>i})}_{\\text{post-compromise security}}',
      isBlockMath: true,
    },
  ],
};

export const DH_BACKGROUND: NarrativeSection = {
  id: 'background',
  eyebrow: 'Before Gear 1',
  title: 'The critical piece of number theory here',
  blocks: [
    {
      text: "There is an idea from 1976 that everything from here on depends on: two people can agree on a shared value over a channel someone else is fully watching, and that observer still can't reconstruct it. Worked here with numbers small enough to check by hand.",
    },
    {
      heading: 'Two exponents, one shared base',
      text: 'Fix a public base $g$. Each side picks a private exponent and publishes only $g^a$ or $g^b$, never $a$ or $b$ itself:',
      math: 'g^{a}, \\ g^{b} \\ \\text{public} \\qquad a, \\ b \\ \\text{private}',
      isBlockMath: true,
    },
    {
      heading: 'A toy group we can actually compute in',
      text: 'Take $p = 23$, $g = 5$, $a=6$, $b=15$. By Fermat\'s little theorem, exponents wrap around mod 22, which is what makes checking this by hand possible:',
      math: '5^{22} \\equiv 1 \\pmod{23} \\ \\implies \\ 5^{k} \\equiv 5^{k \\bmod 22} \\pmod{23}',
      isBlockMath: true,
    },
    {
      text: 'By repeated squaring: square 5 three times to build up $5^2, 5^4, 5^8$, then combine.',
      math: '5^{1}\\equiv 5, \\ 5^{2}\\equiv 2, \\ 5^{4}\\equiv 4, \\ 5^{8}\\equiv 16 \\pmod{23}',
      isBlockMath: true,
    },
    {
      text: '$5^6 = 5^4 \\cdot 5^2$, and $15 = 8+4+2+1$, so $5^{15} = 5^8 \\cdot 5^4 \\cdot 5^2 \\cdot 5^1$:',
      math: '5^{6} = 4\\cdot 2 \\equiv 8, \\qquad 5^{15} = 16\\cdot 4\\cdot 2\\cdot 5 \\equiv 19 \\pmod{23}',
      isBlockMath: true,
    },
    {
      heading: 'The trick: exponentiation commutes',
      text: 'Each side raises the value it received to its own exponent, landing on the same number without either exponent ever crossing the channel:',
      math: '19^{6} \\equiv 8^{15} \\equiv 5^{6 \\cdot 15} \\equiv 5^{90 \\bmod 22} = 5^{2} = 2 \\pmod{23}',
      isBlockMath: true,
    },
    {
      heading: 'Why an observer is stuck',
      text: 'An observer sees $g$ and the two public values. Recovering $a$ from $g^a$ alone is the discrete logarithm problem:',
      math: '\\text{given } g, \\ g^a \\bmod p, \\quad \\text{find } a',
      isBlockMath: true,
    },
    {
      heading: 'Where the double ratchet uses this',
      text: 'Run this once, get one value, fixed forever, exactly the single point of failure from the hook. The double ratchet re-runs it continuously, with fresh exponents every time.',
    },
    {
      heading: 'What we are assuming, honestly',
      text: 'One assumption underlies all of it, never proven, only believed after decades of failed attacks against it:',
      math: '\\text{computing } g^{ab} \\text{ from } g^a, g^b \\text{ alone is computationally hard}',
      isBlockMath: true,
    },
    {
      text: 'Signal has a full, rigorous proof under this and related assumptions, well beyond this talk\'s scope: Cohn-Gordon, Cremers, Dowling, Garratt, Stebila, "A Formal Security Analysis of the Signal Messaging Protocol," IEEE EuroS&P 2017.',
    },
  ],
};

export const SYMMETRIC_RATCHET: NarrativeSection = {
  id: 'symmetric-ratchet',
  eyebrow: 'Gear 1: Forward Secrecy',
  title: 'A recurrence relation that only runs forward',
  blocks: [
    {
      text: 'A sequence of keys, each term from the one before by a fixed function $H$: easy to evaluate forward, effectively impossible to invert.',
      math: 'CK_{i+1} = H(CK_i), \\qquad MK_i = H\'(CK_i)',
      isBlockMath: true,
    },
    {
      heading: 'The invariant',
      text: 'The instant the next term exists, the one before it is erased:',
      math: 'CK_{i+1} \\text{ computed} \\implies CK_i \\text{ deleted}',
      isBlockMath: true,
    },
    {
      heading: 'The payoff',
      text: 'Forward is free, just evaluating $H$ again. Backward would mean inverting $H$, the property assumed away:',
      math: 'CK_{10} \\to CK_{11} \\to CK_{12} \\to \\cdots \\quad \\text{easy} \\qquad CK_{10} \\to CK_{9} \\quad \\text{would mean inverting } H',
      isBlockMath: true,
    },
    {
      heading: 'What this buys, and what it does not',
      text: 'Forward secrecy holds. Post-compromise security does not: $CK_{10}$ still predicts every later term, forever. Needs a second recurrence.',
    },
  ],
};

export const DH_RATCHET: NarrativeSection = {
  id: 'dh-ratchet',
  eyebrow: 'Gear 2: Post-Compromise Security',
  title: 'Restarting the sequence with a fresh seed',
  blocks: [
    {
      text: 'The paradox Gear 1 leaves open: $CK_{10}$ predicts every term after it, forever.',
      math: '\\text{know}(CK_{10}) \\implies \\text{know}(CK_{11}, CK_{12}, \\dots) \\ \\text{forever}',
      isBlockMath: true,
    },
    {
      heading: 'The setup: a compromise, in the same toy numbers',
      text: 'User 1 and User 2 share the value 2, from $a=6$ and $b=15$. An attacker copies everything in User 1\'s memory, including $a=6$ itself, not just the public value 8.',
    },
    {
      heading: 'The attacker is still in, for one more message',
      text: 'If User 2 replies the old way, the attacker holding the stolen $a$ reproduces the shared value directly:',
      math: '19^{6} \\equiv (5^{15})^{6} = 5^{90} \\equiv 5^{2} = 25 \\equiv 2 \\pmod{23}',
      isBlockMath: true,
    },
    {
      heading: 'The fix: a fresh exponent from the compromised side',
      text: 'User 1 picks a brand-new exponent, $a\' = 9$, and sends a new public value:',
      math: '5^{2}\\equiv 2, \\ 5^{4}\\equiv 4, \\ 5^{8}\\equiv 16, \\ 5^{9} = 5^{8}\\cdot 5 \\equiv 80 \\equiv 11 \\pmod{23}',
      isBlockMath: true,
    },
    {
      text: 'The new shared value, reduced mod 22 since $9 \\cdot 15 = 135$:',
      math: '19^{9} \\equiv 5^{135} \\equiv 5^{3} = 125 \\equiv 10 \\pmod{23}',
      isBlockMath: true,
    },
    {
      heading: 'Re-seeding the sequence',
      text: "That value, 10, folds into the root key and seeds an entirely new sequence. The old one is abandoned, not patched.",
    },
    {
      heading: 'Why the adversary is now locked out',
      text: "Computing 10 from the two public values alone, without either exponent, is the discrete log problem again. Caveat: this only defeats a passive eavesdropper, not an active attacker impersonating User 1, which needs authentication machinery beyond the scope of today.",
    },
    {
      heading: 'The key takeaway',
      text: 'Self-heals in exactly one round trip, counted from the fresh exponent, at the cost of that one message in between staying readable. Neither party has to notice anything or do anything differently. That is the single idea worth remembering.',
      math: '\\text{fresh exponent chosen} \\implies \\text{healed after exactly 1 round trip}',
      isBlockMath: true,
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
      text: 'At our toy size $p=23$, an attacker has only 22 exponents to try, so they just try all of them. That is not reassuring, and it leaves a real question open: how big does the group actually need to be, and is brute force really the best an attacker can do?',
    },
    {
      heading: 'The claim',
      text: 'It is not. Baby-step giant-step solves the discrete log problem with a genuine square-root speedup over brute force, and it needs nothing beyond the division algorithm:',
      math: '\\text{find } x \\text{ s.t. } g^x = h, \\ |G| = n \\quad \\text{in } O(\\sqrt{n}) \\text{ time and space, vs. } O(n)',
      isBlockMath: true,
    },
    {
      heading: 'The construction',
      text: 'Write the unknown exponent $x$ in base $m = \\lceil\\sqrt{n}\\rceil$, which the division algorithm always lets you do:',
      math: 'x = im + j, \\ 0 \\le i,j < m \\quad \\implies \\quad h \\cdot g^{-im} = g^{j}',
      isBlockMath: true,
    },
    {
      heading: 'Baby steps, then giant steps',
      text: 'First, the baby steps: table every $g^j$ for $j < m$. Then the giant steps: check $h \\cdot g^{-im}$ against that table for $i = 0, 1, 2, \\dots$. The first match hands you both $i$ and $j$, and therefore $x$.',
    },
    {
      heading: 'Why this is faster',
      text: 'Building the table costs $m$ work, and the search costs at most $m$ more before a match is guaranteed. This really is a proof, every step follows from the division algorithm and the group law, not a heuristic:',
      math: '\\text{total work} = O(m) = O(\\sqrt{n}) \\quad \\text{vs.} \\quad O(n) \\text{ for brute force}',
      isBlockMath: true,
    },
    {
      heading: 'What this means for real key sizes',
      text: 'Baby-step giant-step and the closely related Pollard rho method both bring the cost down to $\\sqrt{n}$, not $n$. That is exactly why real protocols use groups sized around $2^{256}$:',
      math: '\\sqrt{2^{256}} = 2^{128} \\quad \\text{the actual security margin being bought}',
      isBlockMath: true,
    },
  ],
};
