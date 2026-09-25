'use client';

import { DoubleRatchetSimulationState, RatchetParticipantState } from '@/types/capstone';

interface RatchetVisualizerProps {
  simulationState: DoubleRatchetSimulationState;
}

// Internal state uses 'Alice' | 'Bob' as plumbing identifiers; the talk's
// prose refers to the same two parties as "User 1" and "User 2".
const DISPLAY_NAME: Record<RatchetParticipantState['identity'], string> = {
  Alice: 'User 1',
  Bob: 'User 2',
};

// One participant's internal cryptographic registers.
const ParticipantCard: React.FC<{ participant: RatchetParticipantState }> = ({ participant }) => {
  return (
    <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{DISPLAY_NAME[participant.identity]}</p>
        <span
          className={`text-[10px] uppercase tracking-widest ${
            participant.isCompromised
              ? 'text-gray-900 dark:text-gray-100'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          {participant.isCompromised ? 'Compromised' : 'Secure'}
        </span>
      </div>

      <dl className="mt-3 space-y-2 font-mono text-xs">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-400 dark:text-gray-500">Root key</dt>
          <dd className="truncate text-gray-600 dark:text-gray-300">{participant.rootKey.slice(0, 12)}…</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-400 dark:text-gray-500">Ephemeral pk</dt>
          <dd className="truncate text-gray-600 dark:text-gray-300">
            {participant.dhKeyPair.publicKey.slice(0, 10)}…
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-gray-400 dark:text-gray-500">Remote pk</dt>
          <dd className="truncate text-gray-600 dark:text-gray-300">
            {participant.dhRemotePublicKey ? `${participant.dhRemotePublicKey.slice(0, 10)}…` : 'None'}
          </dd>
        </div>
      </dl>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500">Sequence (send)</p>
          <p className="mt-0.5 font-mono text-xs text-gray-600 dark:text-gray-300">
            {participant.sendingChain ? participant.sendingChain.chainKey.slice(0, 8) : 'inactive'}
          </p>
          <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-600">
            step {participant.sendingChain?.stepCount ?? 0}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500">Sequence (recv)</p>
          <p className="mt-0.5 font-mono text-xs text-gray-600 dark:text-gray-300">
            {participant.receivingChain ? participant.receivingChain.chainKey.slice(0, 8) : 'inactive'}
          </p>
          <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-600">
            step {participant.receivingChain?.stepCount ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export const RatchetVisualizer: React.FC<RatchetVisualizerProps> = ({ simulationState }) => {
  const { alice, bob, wireCiphertext, epoch } = simulationState;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <span>Epoch</span>
        <span className="font-mono text-gray-600 dark:text-gray-300">{epoch}</span>
      </div>

      <div className="space-y-3">
        <ParticipantCard participant={alice} />
        <ParticipantCard participant={bob} />
      </div>

      <div className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Network wire
        </p>
        {wireCiphertext ? (
          <div className="mt-2 space-y-1 font-mono text-xs">
            <p className="text-gray-500 dark:text-gray-400">
              {wireCiphertext.sender} · seq #{wireCiphertext.messageIndex}
            </p>
            <p className="truncate text-gray-600 dark:text-gray-300">ct: {wireCiphertext.ciphertextHex}</p>
            <p className="truncate text-gray-600 dark:text-gray-300">pk: {wireCiphertext.ephemeralPublicKey}</p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Idle, no frame in transit.</p>
        )}
      </div>
    </div>
  );
};

export default RatchetVisualizer;
