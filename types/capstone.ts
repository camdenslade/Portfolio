export type CurveScalar = string; // Hex representation of scalar key
export type CurvePoint = string; // Hex representation of public key

export interface SymmetricChainState {
  chainKey: string;
  stepCount: number;
}

export interface DHKeyPair {
  privateKey: CurveScalar;
  publicKey: CurvePoint;
}

export interface RatchetParticipantState {
  identity: 'Alice' | 'Bob';
  // Asymmetric state
  dhKeyPair: DHKeyPair;
  dhRemotePublicKey: CurvePoint | null;
  rootKey: string;
  // Symmetric states
  sendingChain: SymmetricChainState | null;
  receivingChain: SymmetricChainState | null;
  // Key store
  messageKeys: Record<string, string>;
  // state flags
  isCompromised: boolean;
}

export type AdversaryActionType =
| 'PASSIVE_EAVSDROP'
| 'CORRUPT_STATE'
| 'REPLACE_EPHEMERAL_KEY'
| 'SKIP_MESSAGE';

export interface AdversaryLogEntry {
  id: string;
  epoch: number;
  actor: 'Alice' | 'Bob' | 'Adversary';
  action: string;
  detail: string;
  securityImpact: 'NORMAL' | 'FORWARD_SECRECY_TEST' | 'POST_COMPROMISE_HEALING' | 'BREACH';
}

export interface DoubleRatchetSimulationState {
  epoch: number;
  alice: RatchetParticipantState;
  bob: RatchetParticipantState;
  wireCiphertext: {
    sender: 'Alice' | 'Bob';
    ephemeralPublicKey: CurvePoint;
    messageIndex: number;
    ciphertextHex: string;
    associatedDataHex: string;
  } | null;
  compromisedAtEpoch: number | null;
  healingEpoch: number | null;
  logs: AdversaryLogEntry[];
}