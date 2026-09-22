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
    title: 'Alice sends a message',
    caption: "Gear 1 evaluates once. Watch Alice's sequence step to its next term and a ciphertext appear on the wire.",
    run: (s) => advanceSymmetricStep(s, 'Alice'),
  },
  {
    title: 'Alice sends another',
    caption: 'And again. Every message gets a fresh key; the sequence only ever moves forward.',
    run: (s) => advanceSymmetricStep(s, 'Alice'),
  },
  {
    title: 'Bob runs the Diffie-Hellman exchange',
    caption: 'Bob picks a fresh exponent and replies. This is the exchange from the background section, run live, which also seeds a sequence of his own.',
    run: (s) => executeDHRatchetStep(s, 'Bob'),
  },
  {
    title: 'Bob sends a message back',
    caption: "Now Bob's Gear 1 evaluates too. Both sequences are independently stepping forward.",
    run: (s) => advanceSymmetricStep(s, 'Bob'),
  },
  {
    title: "Now: compromise Alice's state",
    caption: 'This is the cold-boot attack from the introduction. Watch her box turn red. The adversary now knows her current value.',
    run: (s) => corruptParticipantMemory(s, 'Alice'),
  },
  {
    title: 'Alice re-seeds with a fresh exchange',
    caption: 'One round trip. A fresh shared value gets folded into the root and Alice heals, green again, without either party restarting the conversation.',
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
            ? 'Forward secrecy protected every message along the way, and post-compromise security locked the adversary back out in one round trip. Reset to run it again.'
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
                <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{entry.detail}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AdversaryHarness;
