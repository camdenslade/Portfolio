'use client';

type SkipIntroButtonProps = {
  onSkip: () => void;
};

export function SkipIntroButton({ onSkip }: SkipIntroButtonProps) {
  return (
    <button
      type="button"
      onClick={onSkip}
      className="absolute right-4 top-4 z-20 rounded-md border border-neutral-700 bg-neutral-900/90 px-3 py-2 text-sm text-neutral-100 hover:bg-neutral-800"
    >
      Plaintext
    </button>
  );
}
