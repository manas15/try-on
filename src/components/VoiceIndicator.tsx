"use client";

interface Props {
  isListening: boolean;
  transcript: string;
  supported: boolean;
  onToggle: () => void;
}

export function VoiceIndicator({
  isListening,
  transcript,
  supported,
  onToggle,
}: Props) {
  if (!supported) {
    return (
      <div className="text-center text-[11px] text-white/30 py-3 tracking-wide">
        Voice control requires Chrome
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onToggle}
        className={`relative flex items-center justify-center w-9 h-9 transition-all ${
          isListening
            ? "bg-white text-black"
            : "border border-white/30 text-white/50 hover:border-white/50 hover:text-white/80"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
        {isListening && (
          <span className="absolute -top-px -right-px w-1.5 h-1.5 bg-black border border-white" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        {isListening ? (
          <p className="text-[11px] text-white/80 tracking-wide truncate">
            {transcript || "Listening..."}
          </p>
        ) : (
          <p className="text-[11px] text-white/50 tracking-wide">
            Press <span className="text-white/70">Space</span> or tap to speak
          </p>
        )}
      </div>
    </div>
  );
}
