"use client";

import { useCallback, useEffect, useState } from "react";
import { catalog, findProducts } from "@/data/catalog";
import { useDecartTryOn } from "@/hooks/useDecartTryOn";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { VoiceIndicator } from "@/components/VoiceIndicator";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

export default function Home() {
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [savingKey, setSavingKey] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [localVideoEl, setLocalVideoEl] = useState<HTMLVideoElement | null>(null);
  const [landmarkCanvas, setLandmarkCanvas] = useState<HTMLCanvasElement | null>(null);
  const [slideAnim, setSlideAnim] = useState<"left" | "right" | null>(null);
  const [cart, setCart] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; icon: string } | null>(null);
  const [tryOnToast, setTryOnToast] = useState<string | null>(null);

  const { status, currentProduct, outputRef, localRef, remoteStreamRef, cameraReady, startCamera, connect, disconnect, tryOn, error } =
    useDecartTryOn();

  const addLog = useCallback((_msg: string) => {}, []);

  const navigateNext = useCallback(() => {
    setSlideAnim("right");
    setTimeout(() => setSlideAnim(null), 550);
    setActiveIndex((prev) => {
      const next = (prev + 1) % catalog.length;
      if (status === "connected") {
        tryOn(catalog[next]);
      }
      setTryOnToast(catalog[next].name);
      setTimeout(() => setTryOnToast(null), 2000);
      return next;
    });
  }, [status, tryOn]);

  const handleSwipe = useCallback(
    () => {
      navigateNext();
    },
    [navigateNext]
  );

  const handleGesture = useCallback(
    (gesture: "thumbsUp" | "ok") => {
      const product = catalog[activeIndex];
      if (cart.includes(product.id)) {
        setToast({ message: `${product.name} is already in your cart`, icon: "check" });
      } else {
        setCart((prev) => [...prev, product.id]);
        setToast({
          message: gesture === "thumbsUp"
            ? `${product.name} added to cart!`
            : `${product.name} added to cart!`,
          icon: gesture === "thumbsUp" ? "thumbsUp" : "ok",
        });
      }
      setTimeout(() => setToast(null), 2500);
    },
    [activeIndex, cart]
  );

  const { direction: swipeDirection, gesture: detectedGesture, tracking: handTracking } = useSwipeGesture(
    localVideoEl,
    landmarkCanvas,
    cameraReady,
    handleSwipe as (dir: "left" | "right") => void,
    handleGesture
  );

  // Sync activeIndex when currentProduct changes
  useEffect(() => {
    if (!currentProduct) return;
    const idx = catalog.findIndex((p) => p.id === currentProduct.id);
    if (idx !== -1) setActiveIndex(idx);
  }, [currentProduct]);

  // Start camera on mount
  useEffect(() => {
    startCamera();
  }, [startCamera]);


  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setHasApiKey(data.hasApiKey))
      .catch(() => setHasApiKey(false));
  }, []);

  const saveApiKey = useCallback(async () => {
    if (!apiKeyInput.trim()) return;
    setSavingKey(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });
      if (res.ok) {
        setHasApiKey(true);
        setShowSettings(false);
        setApiKeyInput("");
      }
    } catch {}
    finally { setSavingKey(false); }
  }, [apiKeyInput]);

  const handleVoiceResult = useCallback(
    (text: string) => {
      if (status !== "connected") return;
      const matches = findProducts(text);
      if (matches.length > 0) {
        tryOn(matches[0]);
      }
    },
    [status, tryOn]
  );

  const { transcript, isListening, start, stop, supported } =
    useSpeechRecognition(handleVoiceResult);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        isListening ? stop() : start();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isListening, start, stop]);

  const nextIndex = (activeIndex + 1) % catalog.length;
  const activeProduct = catalog[activeIndex];

  const goNext = () => navigateNext();

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* ─── Top Bar ─── */}
      <div className="relative flex items-center justify-between px-8 py-3 bg-gradient-to-b from-neutral-900 to-black border-b border-white/10 z-10 flex-shrink-0">
        {/* Left spacer */}
        <div className="w-48" />

        {/* Center: Logo */}
        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-0.5">
            <span className="text-[26px] font-light text-white tracking-tight">Live</span>
            <span className="text-[26px] font-semibold text-white tracking-tight">Look</span>
          </div>
          <p className="text-[11px] text-white/40 tracking-[0.2em] mt-0.5 font-light">
            by Manas Sharma
          </p>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3 w-48 justify-end">
          <div className="relative flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded transition-colors cursor-default border border-white/10">
            <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center px-1 bg-white text-black text-[11px] font-semibold rounded-full">
                {cart.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-white/30 hover:text-white/70 transition-colors"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          {status === "connected" && (
            <button
              onClick={() => disconnect()}
              className="px-4 py-1.5 border border-white/20 text-[10px] uppercase tracking-[0.15em] text-white/60 hover:border-white/40 hover:text-white transition-colors rounded"
            >
              End
            </button>
          )}
        </div>
      </div>

      {/* ─── Main 2-Column Layout ─── */}
      <div className="flex-1 flex min-h-0 overflow-hidden p-4 gap-4">
        {/* LEFT: Try-On Stream (large) */}
        <div className="flex-[3] relative overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-1 pb-3 flex items-center gap-3 flex-shrink-0">
            <h2 className="text-[15px] font-medium text-white/90 tracking-wide">
              <span className="font-light">Live</span><span className="font-semibold">Look</span> Feed
            </h2>
            {status === "connected" && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[9px] text-green-400/80 uppercase tracking-[0.2em] font-medium">Live</span>
              </div>
            )}
          </div>
          <div className="flex-1 relative overflow-hidden border border-white/10 rounded-sm bg-neutral-950 flex flex-col">
          {/* Toast banner inside the box, above video */}
          {(toast || detectedGesture || tryOnToast) && (
            <div
              key={`${toast?.message || ""}${tryOnToast || ""}`}
              className="flex-shrink-0 flex items-center justify-center gap-3 px-4 py-2.5 bg-white/[0.06] border-b border-white/10"
              style={{ animation: "fadeInUp 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)" }}
            >
              {toast ? (
                <>
                  <span className="text-base">
                    {toast.icon === "thumbsUp" ? "👍" : toast.icon === "ok" ? "👌" : "✓"}
                  </span>
                  <span className="text-[12px] text-white/90 font-medium uppercase tracking-[0.1em]">{toast.message}</span>
                </>
              ) : detectedGesture ? (
                <span className="text-[12px] text-green-400 font-medium uppercase tracking-[0.1em]">
                  {detectedGesture === "thumbsUp" ? "👍" : "👌"} Added to Cart
                </span>
              ) : tryOnToast ? (
                <>
                  <span className="text-base">👕</span>
                  <span className="text-[12px] text-white/90 font-medium uppercase tracking-[0.1em]">Trying on {tryOnToast}</span>
                </>
              ) : null}
            </div>
          )}

          {/* Video area wrapper */}
          <div className="flex-1 relative min-h-0">
          {status === "disconnected" || status === "error" ? (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="relative w-[90%] max-w-[800px] aspect-video">
                {/* Mirror frame */}
                <div className="absolute -inset-2 border-[3px] border-white/8 rounded-sm" />
                <div className="absolute -inset-1 border border-white/5" />
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-white/20 z-10" />
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-white/20 z-10" />
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-white/20 z-10" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-white/20 z-10" />

                {/* Content inside frame */}
                <div className="relative w-full h-full overflow-hidden bg-neutral-950/50 flex flex-col items-center justify-center text-center px-8">
                  <p className="text-[11px] text-white/50 uppercase tracking-[0.3em] mb-4">
                    Real-Time Video Try-On
                  </p>
                  <p className="text-[11px] text-white/40 leading-relaxed font-light max-w-xs mb-8">
                    Swipe your hand left or right to browse garments.
                    Each item is rendered on you in real time.
                  </p>
                  <button
                    onClick={() => connect(catalog[activeIndex])}
                    className="px-8 py-3 bg-white text-black text-[11px] uppercase tracking-[0.2em] hover:bg-white/90 transition-colors"
                  >
                    {status === "error" ? "Retry" : "Try On"}
                  </button>
                  {error && (
                    <p className="text-[11px] text-red-400/80 mt-4 max-w-sm">{error}</p>
                  )}
                </div>

                {/* Label below frame */}
                <div className="absolute -bottom-8 left-0 right-0 text-center">
                  <p className="text-[8px] text-white/25 uppercase tracking-[0.3em]">Trial Room</p>
                </div>
              </div>
            </div>
          ) : status === "connecting" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Trial room frame while connecting */}
              <div className="relative w-[90%] max-w-[800px] aspect-video border-[6px] border-white/10 rounded-sm bg-neutral-900/50">
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                  <p className="text-[11px] text-white/60 uppercase tracking-[0.2em]">
                    Connecting...
                  </p>
                </div>
                {/* Frame corners */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-white/30" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-white/30" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-white/30" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-white/30" />
              </div>
              <p className="text-[8px] text-white/20 uppercase tracking-[0.2em] mt-4">Trial Room</p>
            </div>
          ) : (
            /* ─── Video Stream ─── */
            <div className="absolute inset-0 bg-neutral-950">
              <video
                ref={(el) => {
                  (outputRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
                  if (el && remoteStreamRef.current && !el.srcObject) {
                    el.srcObject = remoteStreamRef.current;
                  }
                }}
                autoPlay
                playsInline
                muted
                width={1088}
                height={624}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          </div>{/* end video area wrapper */}

          </div>
        </div>

        {/* RIGHT: Product Image + Original Camera stacked */}
        <div className="flex-[1] flex flex-col overflow-hidden">
          {/* Product Catalog heading */}
          <h2 className="px-1 pb-3 text-[15px] font-medium text-white/90 tracking-wide flex-shrink-0">
            Product Catalog
          </h2>
          {/* Top: Product Image with slide animation */}
          <div className="flex-[1] relative bg-neutral-950 overflow-hidden flex flex-col border border-white/10 rounded-sm">
            {/* Image area */}
            <div className="flex-1 relative overflow-hidden">
              <div
                key={activeIndex}
                className="absolute inset-0 flex items-center justify-center p-4"
                style={{
                  animation: slideAnim
                    ? slideAnim === "right"
                      ? "slideInFromRight 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)"
                      : "slideInFromLeft 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)"
                    : undefined,
                }}
              >
                <img
                  src={activeProduct.image}
                  alt={activeProduct.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>

            {/* Product name + counter - solid bar below image */}
            <div
              key={`label-${activeIndex}`}
              className="px-4 py-3 bg-neutral-900 text-center flex-shrink-0"
              style={{
                animation: slideAnim ? "fadeInUp 0.45s cubic-bezier(0.25, 0.1, 0.25, 1)" : undefined,
              }}
            >
              <p className="text-[12px] text-white uppercase tracking-[0.15em]">
                {activeProduct.name}
              </p>
              <p className="text-[9px] text-white/40 mt-1">
                {activeIndex + 1} / {catalog.length}
              </p>
            </div>

            {/* Swipe success flash */}
            {slideAnim && (
              <div className="absolute inset-0 z-20 pointer-events-none">
                <div
                  className="absolute inset-0"
                  style={{
                    background: slideAnim === "right"
                      ? "linear-gradient(90deg, transparent 60%, rgba(74,144,255,0.1) 100%)"
                      : "linear-gradient(-90deg, transparent 60%, rgba(74,144,255,0.1) 100%)",
                    animation: "fadeOut 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards",
                  }}
                />
                <div className="absolute top-3 left-0 right-0 flex justify-center">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-sm text-[9px] text-white/80 uppercase tracking-[0.2em]"
                    style={{ animation: "fadeInUp 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)" }}
                  >
                    {slideAnim === "right" ? "Next" : "Previous"}
                  </span>
                </div>
              </div>
            )}

            {/* Next nav */}
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/40 hover:bg-black/60 transition-colors flex items-center gap-1.5"
            >
              <span className="text-[8px] text-white/50 uppercase tracking-[0.15em]">Next</span>
              <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Bottom: Original Camera + MediaPipe */}
          <div className="flex-[1] flex flex-col mt-4">
            {/* Header */}
            <div className="px-1 pb-3 flex items-center gap-3 flex-shrink-0">
              <h2 className="text-[15px] font-medium text-white/90 tracking-wide">Original Feed</h2>
              {handTracking && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[9px] text-green-400/80 uppercase tracking-[0.2em] font-medium">Tracking</span>
                </div>
              )}
            </div>
            <div className="flex-1 relative flex items-center justify-center overflow-hidden border border-white/10 rounded-sm bg-neutral-950">
            <div className="relative w-full aspect-video">
              <video
                ref={(el) => {
                  if (localRef) (localRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
                  setLocalVideoEl(el);
                }}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              <canvas
                ref={(el) => setLandmarkCanvas(el)}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
              {swipeDirection && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white text-[11px] uppercase tracking-[0.2em] animate-pulse">
                    {swipeDirection === "left" ? "Previous" : "Next"}
                  </div>
                </div>
              )}
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-[11px] text-white/40">Starting camera...</p>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Bar: Voice ─── */}
      <div className="px-6 py-2.5 bg-black/90 border-t border-white/5 flex-shrink-0">
        <VoiceIndicator
          isListening={isListening}
          transcript={transcript}
          supported={supported}
          onToggle={isListening ? stop : start}
        />
      </div>



      {/* ─── No API Key Banner ─── */}
      {hasApiKey === false && !showSettings && (
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center py-2 bg-black border-b border-white/10">
          <p className="text-[11px] text-white/60 tracking-wide">
            API key required.{" "}
            <button
              onClick={() => setShowSettings(true)}
              className="text-white underline underline-offset-2"
            >
              Configure
            </button>
          </p>
        </div>
      )}

      {/* ─── Settings Modal ─── */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-neutral-900 border border-white/10 w-full max-w-md p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] text-white/60 uppercase tracking-[0.2em]">
                Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-white/30 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] text-white/40 uppercase tracking-[0.2em]">
                Decart API Key
              </label>
              <div className="flex gap-3">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveApiKey()}
                  placeholder={hasApiKey ? "Key configured" : "dct_..."}
                  className="flex-1 px-3 py-2.5 bg-black border border-white/10 text-[12px] text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                />
                <button
                  onClick={saveApiKey}
                  disabled={!apiKeyInput.trim() || savingKey}
                  className="px-5 py-2.5 bg-white text-black text-[11px] uppercase tracking-[0.1em] hover:bg-white/90 transition-colors disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed"
                >
                  {savingKey ? "..." : "Save"}
                </button>
              </div>
              <p className="text-[10px] text-white/20">
                <a
                  href="https://platform.decart.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/40 underline underline-offset-2 hover:text-white"
                >
                  platform.decart.ai
                </a>
              </p>
            </div>

            {hasApiKey && (
              <p className="text-[10px] text-green-400/60 uppercase tracking-[0.15em]">
                Connected
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
