import {
  DoubleRatchetSimulationState,
  RatchetParticipantState,
  DHKeyPair,
  AdversaryLogEntry,
} from '@/types/capstone';

// Deterministic mock hashing and key derivations
function mockHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    // multiplies the hash by 31 (via 32 - 1) to distribute bits across the space and reduce collisions
    hash = (hash << 5) - hash + input.charCodeAt(i);
    // forces it to be converted into a signed 32 bit integer
    hash |= 0;
  }
  // strip negative, serialize integer to hex, and pad to 8 characters with leading 0's.
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex}${hex}${hex}${hex}`.slice(0, 32);
}

// Deterministircally construct a mock Diffie-Hellman pair tied to a participant and ratchet epoch
function generateMockKeyPair(party: string, index: number): DHKeyPair {
  // derive private scalar
  const priv = mockHash(`${party}_sk_${index}`);
  // prefix pub key with "04" to mimic uncompressed SEC1 curve points
  const pub = `04${mockHash(`${party}_pk_${index}`)}`;
  // return the asymmetric key pair interface
  return { privateKey: priv, publicKey: pub };
}

// Construct baseline initial state representing post-X3DH initial handshake
export function initSimulation(): DoubleRatchetSimulationState {
  // derive synchronized master root key
  const sharedRoot = mockHash('k_root_init_shared');
  // set Bob's base epoch-0 as asymmetric pair
  const bobDH = generateMockKeyPair('Bob', 0);
  // now alice
  const aliceDH = generateMockKeyPair('Alice', 0);

  // init Alice's participant state
  const alice: RatchetParticipantState = {
    identity: 'Alice',
    dhKeyPair: aliceDH,
    dhRemotePublicKey: bobDH.publicKey,
    rootKey: sharedRoot,
    sendingChain: { chainKey: mockHash(`${sharedRoot}_send`), stepCount: 0 },
    receivingChain: null,
    messageKeys: {},
    isCompromised: false,
  };

  // init Bob's participant state
  const bob: RatchetParticipantState = {
    identity: 'Bob',
    dhKeyPair: bobDH,
    dhRemotePublicKey: aliceDH.publicKey,
    rootKey: sharedRoot,
    sendingChain: null,
    receivingChain: { chainKey: mockHash(`${sharedRoot}_send`), stepCount: 0 },
    messageKeys: {},
    isCompromised: false,
  };

  // return the fully bootstrapped initial sim container
  return {
    epoch: 0,
    alice,
    bob,
    wireCiphertext: null,
    compromisedAtEpoch: null,
    healingEpoch: null,
    logs: [
      {
        id: 'init-0',
        epoch: 0,
        actor: 'Alice',
        action: 'INIT_SESSION',
        detail: 'Shared root key established via initial authenticated key exchange',
        securityImpact: 'NORMAL',
      },
    ],
  };
}

// advances the symmetric KDF ratchet by one tick demonstrating Forward Secrecy
export function advanceSymmetricStep(
  state: DoubleRatchetSimulationState,
  sender: 'Alice' | 'Bob'
): DoubleRatchetSimulationState {
  const nextEpoch = state.epoch + 1;
  const isAlice = sender === 'Alice';
  const senderState = isAlice ? { ...state.alice } : { ...state.bob };
  const recieverState = isAlice ? { ...state.bob } : { ...state.alice };

  // guard against stepping into an uninitialized pipeline
  if (!senderState.sendingChain || !recieverState.receivingChain) {
    return state;
  }

  // extract current chain key from transmitter's symmetric state
  const currentCK = senderState.sendingChain.chainKey;
  const nextCK = mockHash(`KDF_CK_${currentCK}`);
  const derivedMK = mockHash(`KDF_MK_${currentCK}`);

  // commit updated forward chain state and increment message sequence
  senderState.sendingChain = {
    chainKey: nextCK,
    stepCount: senderState.sendingChain.stepCount + 1,
  };

  // mirror
  recieverState.receivingChain = {
    chainKey: nextCK,
    stepCount: recieverState.receivingChain.stepCount + 1,
  };

  // construct audit log entry explaining forward secrecy properties
  const newLog: AdversaryLogEntry = {
    id: `step-${nextEpoch}`,
    epoch: nextEpoch,
    actor: sender,
    action: 'SYMMETRIC_STEP',
    detail: `${sender} stepped sending chain: KDF(${currentCK.slice(0, 6)}...) -> MK=${derivedMK.slice(0, 6)}... (Forward Secrecy holds).`,
    securityImpact: 'FORWARD_SECRECY_TEST',
  };

  const logs: AdversaryLogEntry[] = [...state.logs, newLog];

  // return new simulation root with updated states
  return {
    ...state,
    epoch: nextEpoch,
    alice: isAlice ? senderState : recieverState,
    bob: isAlice ? recieverState : senderState,
    wireCiphertext: {
      sender,
      ephemeralPublicKey: senderState.dhKeyPair.publicKey,
      messageIndex: senderState.sendingChain.stepCount,
      ciphertextHex: mockHash(`enc_${derivedMK}`),
      associatedDataHex: 'AD_HEADER_V1',
    },
    logs,
  };
}

// execute an asymmetric DH ratchet turn to inject fresh entropy and demonstrate Post-Compromise Security
export function executeDHRatchetStep(
  state: DoubleRatchetSimulationState,
  sender: 'Alice' | 'Bob'
): DoubleRatchetSimulationState {
  const nextEpoch = state.epoch + 1;
  const isAlice = sender === 'Alice';
  const activeSender = isAlice ? { ...state.alice } : { ...state.bob };
  const activeReceiver = isAlice ? { ...state.bob } : { ...state.alice };

  // generate new ephemeral DH key pair for the sender
  const newDH = generateMockKeyPair(sender, nextEpoch);
  activeSender.dhKeyPair = newDH;

  // resolve peer public key from sender cache or receiver state
  const remotePK = activeSender.dhRemotePublicKey || activeReceiver.dhKeyPair.publicKey;
  // compute DH shared secret: SS = DH(sk_sender, pk_receiver)
  const sharedSecret = mockHash(`DH_${newDH.privateKey}_${remotePK}`);

  // derive new root key mixing old root entropy with DH output: KDF_RK(RK, SS) -> RK'
  const newRoot = mockHash(`KDF_RK_${activeSender.rootKey}_${sharedSecret}`);
  // derive new symmetric sending chain key from the updated root
  const newSendCK = mockHash(`KDF_CK_SEND_${newRoot}`);

  // commit new root and reset sending chain on sender
  activeSender.rootKey = newRoot;
  activeSender.sendingChain = { chainKey: newSendCK, stepCount: 0 };
  // fresh entropy heals any existing memory breach
  activeSender.isCompromised = false;

  // mirror on receiver: update remote DH key and align root/receiving chain
  activeReceiver.dhRemotePublicKey = newDH.publicKey;
  activeReceiver.rootKey = newRoot;
  activeReceiver.receivingChain = { chainKey: newSendCK, stepCount: 0 };
  activeReceiver.isCompromised = false;

  // check if this turn resolves an active adversary compromise
  const wasCompromised = state.compromisedAtEpoch !== null && state.healingEpoch === null;

  // append DH transition log entry
  const newLog: AdversaryLogEntry = {
    id: `dh-step-${nextEpoch}`,
    epoch: nextEpoch,
    actor: sender,
    action: 'DH_RATCHET_STEP',
    detail: `New DH exchange: fresh ephemeral ${newDH.publicKey.slice(0, 10)}... injected. RK updated. Post-Compromise Security achieved.`,
    securityImpact: wasCompromised ? 'POST_COMPROMISE_HEALING' : 'NORMAL',
  };

  const logs: AdversaryLogEntry[] = [...state.logs, newLog];

  // return updated state reflecting refreshed keys and healed channels
  return {
    ...state,
    epoch: nextEpoch,
    alice: isAlice ? activeSender : activeReceiver,
    bob: isAlice ? activeReceiver : activeSender,
    healingEpoch: wasCompromised ? nextEpoch : state.healingEpoch,
    logs,
  };
}

// simulate adversary memory exfiltration (e.g. cold-boot attack or heap inspection)
export function corruptParticipantMemory(
  state: DoubleRatchetSimulationState,
  target: 'Alice' | 'Bob'
): DoubleRatchetSimulationState {
  const nextEpoch = state.epoch + 1;
  const isAlice = target === 'Alice';
  const targetState = isAlice ? { ...state.alice } : { ...state.bob };

  // flag target memory as leaked to adversary
  targetState.isCompromised = true;

  // log memory breach event
  const newLog: AdversaryLogEntry = {
    id: `compromise-${nextEpoch}`,
    epoch: nextEpoch,
    actor: 'Adversary',
    action: 'EXFILTRATE_EPHEMERAL_STATE',
    detail: `Adversary leaked volatile RAM of ${target}. Ephemeral secrets and current chain keys exposed.`,
    securityImpact: 'BREACH',
  };

  const logs: AdversaryLogEntry[] = [...state.logs, newLog];

  // return updated simulation with compromise timestamp set
  return {
    ...state,
    epoch: nextEpoch,
    alice: isAlice ? targetState : state.alice,
    bob: isAlice ? state.bob : targetState,
    compromisedAtEpoch: nextEpoch,
    healingEpoch: null,
    logs,
  };
}