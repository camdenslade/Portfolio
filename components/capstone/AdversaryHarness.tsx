'use client';

import { useState } from 'react';
import { DoubleRatchetSimulationState, AdversaryLogEntry } from '@/types/capstone';
import {
  advanceSymmetricStep,
  executeDHRatchetStep,
  corruptParticipantMemory,
  initSimulation,
} from '@/lib/capstone/protocolEngine';

interface AdversaryHarnessProps {
  simulationState: DoubleRatchetSimulationState;
  onStateChange: (newState: DoubleRatchetSimulationState) => void;
}

// Internal state/log entries use 'Alice' | 'Bob' as plumbing identifiers;
// the talk's prose refers to the same two parties as "User 1" and "User 2".
function toDisplayNames(text: string): string {
  return text.replace(/\bAlice\b/g, 'User 1').replace(/\bBob\b/g, 'User 2');
}

function impactLabel(impact: AdversaryLogEntry['securityImpact']): string {
  switch (impact) {
    case 'BREACH':
      return 'Breach';
    case 'POST_COMPROMISE_HEALING':
      return 'PCS healing';
    case 'FORWARD_SECRECY_TEST':
      return 'FS test';
    default:
      return 'Normal';
  }
}

// A fixed walkthrough of the whole story arc, in order. Each step is one
// button press: advance the simulation, then read the caption out loud.
// This replaces a free-form grid of buttons (easy to click out of order in
// front of a room) with a single "Next step" the presenter drives.
type DemoStep = {
  title: string;
  caption: string;
  run: (state: DoubleRatchetSimulationState) => DoubleRatchetSimulationState;
};

const DEMO_STEPS: DemoStep[] = [
  {
    title: 'User 1 sends a message',
    caption: "Gear 1 evaluates once. Watch User 1's sequence step to its next term and a ciphertext appear on the wire.",
    run: (s) => advanceSymmetricStep(s, 'Alice'),
  },
  {
    title: 'User 1 sends another',
    caption: 'And again. Every message gets a fresh key; the sequence only ever moves forward.',
    run: (s) => advanceSymmetricStep(s, 'Alice'),
  },
  {
    title: 'User 2 runs the Diffie-Hellman exchange',
    caption: 'User 2 picks a fresh exponent and replies. This is the exchange from the background section, run live, which also seeds a sequence of their own.',
    run: (s) => executeDHRatchetStep(s, 'Bob'),
  },
  {
    title: 'User 2 sends a message back',
    caption: "Now User 2's Gear 1 evaluates too. Both sequences are independently stepping forward.",
    run: (s) => advanceSymmetricStep(s, 'Bob'),
  },
  {
    title: "Now: compromise User 1's state",
    caption: "This is the cold-boot attack from the introduction. Watch their box turn red. The adversary now knows User 1's current exponent, not just their public value.",
    run: (s) => corruptParticipantMemory(s, 'Alice'),
  },
  {
    title: 'User 2 replies, but the compromise is not healed yet',
    caption: "Watch the audit trail: User 1's box stays red. The attacker still holds User 1's old exponent, so they can compute this new shared value exactly like User 1 would. This reply is still readable to the attacker.",
    run: (s) => executeDHRatchetStep(s, 'Bob'),
  },
  {
    title: 'User 1 picks a fresh exponent of their own',
    caption: 'This is the step that actually heals the compromise. User 1 throws away the stolen exponent and picks a new one the attacker never saw, one round trip after the fresh exponent is chosen. Now the box turns green.',
    run: (s) => executeDHRatchetStep(s, 'Alice'),
  },
];

export const AdversaryHarness: React.FC<AdversaryHarnessProps> = ({
  simulationState,
  onStateChange,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const atStart = stepIndex === 0;
  const atEnd = stepIndex >= DEMO_STEPS.length;
  const nextStep = atEnd ? null : DEMO_STEPS[stepIndex];

  const handleNext = () => {
    if (!nextStep) return;
    onStateChange(nextStep.run(simulationState));
    setStepIndex((i) => i + 1);
  };

  const handleReset = () => {
    onStateChange(initSimulation());
    setStepIndex(0);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {atEnd ? 'Walkthrough complete' : `Step ${stepIndex + 1} of ${DEMO_STEPS.length}`}
        </p>
        <p className="mt-1 font-semibold">
          {atEnd ? 'That is the whole story' : nextStep!.title}
        </p>
        <p className="mt-1 text-[0.9375rem] leading-relaxed text-gray-600 dark:text-gray-300">
          {atEnd
            ? "Forward secrecy protected every earlier message along the way. Post-compromise security locked the adversary back out too, but only once the compromised party picked a fresh exponent, not on the very next reply. Reset to run it again."
            : nextStep!.caption}
        </p>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleNext}
            disabled={atEnd}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:disabled:hover:bg-transparent"
          >
            {atStart ? 'Start' : atEnd ? 'Done' : 'Next step'}
          </button>
          <button
            onClick={handleReset}
            className="text-xs text-gray-400 underline decoration-gray-300 underline-offset-4 transition-colors hover:text-gray-700 dark:text-gray-500 dark:decoration-gray-700 dark:hover:text-gray-300"
          >
            Reset
          </button>
        </div>

        <div className="mt-4 flex gap-1">
          {DEMO_STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i < stepIndex
                  ? 'bg-gray-400 dark:bg-gray-500'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3 dark:border-gray-800">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Audit trail
        </p>
        <div className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
          {simulationState.logs.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500">No events yet.</p>
          )}
          {simulationState.logs
            .slice()
            .reverse()
            .map((entry) => (
              <div key={entry.id} className="rounded-md border border-gray-100 px-2.5 py-2 dark:border-gray-800">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                    <span className="mr-1.5 font-mono text-[10px] text-gray-400 dark:text-gray-500">
                      e{entry.epoch}
                    </span>
                    {entry.action}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    {impactLabel(entry.securityImpact)}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{toDisplayNames(entry.detail)}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AdversaryHarness;
