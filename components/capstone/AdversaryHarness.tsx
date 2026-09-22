'use client';

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

export const AdversaryHarness: React.FC<AdversaryHarnessProps> = ({
  simulationState,
  onStateChange,
}) => {
  const handleAliceSend = () => onStateChange(advanceSymmetricStep(simulationState, 'Alice'));
  const handleBobSend = () => onStateChange(advanceSymmetricStep(simulationState, 'Bob'));
  const handleDHTurn = (sender: 'Alice' | 'Bob') => onStateChange(executeDHRatchetStep(simulationState, sender));
  const handleCorrupt = (target: 'Alice' | 'Bob') => onStateChange(corruptParticipantMemory(simulationState, target));
  const handleReset = () => onStateChange(initSimulation());

  const actionButtonClass =
    'rounded-md border border-gray-200 px-2.5 py-1.5 text-left text-xs text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2">
        <button onClick={handleAliceSend} className={actionButtonClass}>
          Alice sends message
          <span className="block text-[10px] text-gray-400 dark:text-gray-500">KDF step, sending chain</span>
        </button>
        <button onClick={handleBobSend} className={actionButtonClass}>
          Bob sends message
          <span className="block text-[10px] text-gray-400 dark:text-gray-500">KDF step, sending chain</span>
        </button>
        <button onClick={() => handleDHTurn('Alice')} className={actionButtonClass}>
          Turn DH ratchet
          <span className="block text-[10px] text-gray-400 dark:text-gray-500">Inject fresh entropy</span>
        </button>
        <button onClick={() => handleCorrupt('Alice')} className={actionButtonClass}>
          Corrupt Alice's memory
          <span className="block text-[10px] text-gray-400 dark:text-gray-500">Simulate a RAM leak</span>
        </button>
      </div>

      <button
        onClick={handleReset}
        className="text-xs text-gray-400 underline decoration-gray-300 underline-offset-4 transition-colors hover:text-gray-700 dark:text-gray-500 dark:decoration-gray-700 dark:hover:text-gray-300"
      >
        Reset session
      </button>

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
