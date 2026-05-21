"use client";

import { useEffect, useRef, useCallback, useState } from "react";

type SwipeDirection = "left" | "right" | null;
type GestureType = "thumbsUp" | "ok" | null;

interface SwipeGestureHook {
  direction: SwipeDirection;
  gesture: GestureType;
  tracking: boolean;
}

// MediaPipe hand landmark connections for drawing skeleton
const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],
  [0,17],
];

// Landmark indices
const WRIST = 0;
const THUMB_TIP = 4;
const THUMB_IP = 3;
const THUMB_MCP = 2;
const INDEX_TIP = 8;
const INDEX_PIP = 6;
const INDEX_MCP = 5;
const MIDDLE_TIP = 12;
const MIDDLE_PIP = 10;
const RING_TIP = 16;
const RING_PIP = 14;
const PINKY_TIP = 20;
const PINKY_PIP = 18;

// ─── Landmark smoothing (EMA) ───
const SMOOTHING_FACTOR = 0.6; // 0.5-0.7 recommended; higher = more responsive
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let smoothedLandmarks: any[] | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function smoothLandmarkData(raw: any[]): any[] {
  if (!smoothedLandmarks || smoothedLandmarks.length !== raw.length) {
    smoothedLandmarks = raw.map((p: { x: number; y: number; z: number }) => ({ ...p }));
    return smoothedLandmarks;
  }
  smoothedLandmarks = raw.map((point: { x: number; y: number; z: number }, i: number) => ({
    x: SMOOTHING_FACTOR * point.x + (1 - SMOOTHING_FACTOR) * smoothedLandmarks![i].x,
    y: SMOOTHING_FACTOR * point.y + (1 - SMOOTHING_FACTOR) * smoothedLandmarks![i].y,
    z: SMOOTHING_FACTOR * point.z + (1 - SMOOTHING_FACTOR) * smoothedLandmarks![i].z,
  }));
  return smoothedLandmarks;
}

// ─── Majority voting for gesture stability ───
const VOTE_WINDOW = 5;
const gestureVoteHistory: GestureType[] = [];

function stableGesture(current: GestureType): GestureType {
  gestureVoteHistory.push(current);
  if (gestureVoteHistory.length > VOTE_WINDOW) gestureVoteHistory.shift();
  if (gestureVoteHistory.length < VOTE_WINDOW) return null;

  const counts: Record<string, number> = {};
  for (const g of gestureVoteHistory) {
    if (g) counts[g] = (counts[g] || 0) + 1;
  }

  // Require 4 out of 5 frames to agree
  for (const [gesture, count] of Object.entries(counts)) {
    if (count >= 4) return gesture as GestureType;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function detectGesture(landmarks: any[]): GestureType {
  // Apply EMA smoothing to reduce jitter
  const hand = smoothLandmarkData(landmarks[0]);

  // ─── Thumbs Up Detection ───
  // Best practice: check TIP.y vs PIP.y for each finger (not distance-from-wrist)
  // Thumb pointing up: tip above IP above MCP, and above wrist
  const thumbPointsUp =
    hand[THUMB_TIP].y < hand[THUMB_IP].y &&
    hand[THUMB_IP].y < hand[THUMB_MCP].y &&
    hand[THUMB_TIP].y < hand[WRIST].y;

  // All other fingers curled: TIP.y > PIP.y (tip is below the middle joint)
  const indexCurled = hand[INDEX_TIP].y > hand[INDEX_PIP].y;
  const middleCurled = hand[MIDDLE_TIP].y > hand[MIDDLE_PIP].y;
  const ringCurled = hand[RING_TIP].y > hand[RING_PIP].y;
  const pinkyCurled = hand[PINKY_TIP].y > hand[PINKY_PIP].y;

  if (thumbPointsUp && indexCurled && middleCurled && ringCurled && pinkyCurled) {
    return "thumbsUp";
  }

  // ─── OK Sign Detection ───
  // 3D Euclidean distance between thumb tip and index tip (best practice: use z too)
  const dx = hand[THUMB_TIP].x - hand[INDEX_TIP].x;
  const dy = hand[THUMB_TIP].y - hand[INDEX_TIP].y;
  const dz = hand[THUMB_TIP].z - hand[INDEX_TIP].z;
  const thumbIndexDist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // Threshold 0.05 in normalized coords (recommended 0.045-0.06)
  const pinching = thumbIndexDist < 0.06;

  // Other three fingers should be extended: TIP.y < PIP.y
  const middleExtended = hand[MIDDLE_TIP].y < hand[MIDDLE_PIP].y;
  const ringExtended = hand[RING_TIP].y < hand[RING_PIP].y;
  const pinkyExtended = hand[PINKY_TIP].y < hand[PINKY_PIP].y;

  if (pinching && middleExtended && ringExtended && pinkyExtended) {
    return "ok";
  }

  return null;
}

function drawLandmarks(
  canvas: HTMLCanvasElement,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  landmarks: any[],
  videoWidth: number,
  videoHeight: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = videoWidth;
  canvas.height = videoHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const hand of landmarks) {
    const wrist = hand[0];
    const middleTip = hand[12];
    const handSize = Math.hypot(
      (middleTip.x - wrist.x) * videoWidth,
      (middleTip.y - wrist.y) * videoHeight
    );

    const dotRadius = Math.max(5, Math.min(10, handSize * 0.04));
    const ringRadius = dotRadius * 1.4;
    const lineWidth = Math.max(3, Math.min(6, handSize * 0.025));
    const glowSize = Math.max(4, lineWidth * 1.5);

    ctx.strokeStyle = "#4A90FF";
    ctx.lineWidth = lineWidth;
    ctx.shadowColor = "#4A90FF";
    ctx.shadowBlur = glowSize;
    for (const [i, j] of HAND_CONNECTIONS) {
      const a = hand[i];
      const b = hand[j];
      ctx.beginPath();
      ctx.moveTo(a.x * videoWidth, a.y * videoHeight);
      ctx.lineTo(b.x * videoWidth, b.y * videoHeight);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    for (const point of hand) {
      const px = point.x * videoWidth;
      const py = point.y * videoHeight;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(px, py, ringRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = "#4A90FF";
      ctx.beginPath();
      ctx.arc(px, py, dotRadius, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

export function useSwipeGesture(
  videoEl: HTMLVideoElement | null,
  canvasEl: HTMLCanvasElement | null,
  enabled: boolean,
  onSwipe: (direction: "left" | "right") => void,
  onGesture?: (gesture: "thumbsUp" | "ok") => void
): SwipeGestureHook {
  const [tracking, setTracking] = useState(false);
  const [direction, setDirection] = useState<SwipeDirection>(null);
  const [gesture, setGesture] = useState<GestureType>(null);
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;
  const onGestureRef = useRef(onGesture);
  onGestureRef.current = onGesture;

  const handHistoryRef = useRef<{ x: number; y: number; time: number; refX?: number }[]>([]);
  const cooldownRef = useRef(false);
  const gestureCooldownRef = useRef(false);
  const gestureHoldRef = useRef<{ type: GestureType; start: number }>({ type: null, start: 0 });
  const stableFramesRef = useRef(0); // require N frames of hand presence before acting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const canvasRef = useRef(canvasEl);
  canvasRef.current = canvasEl;

  const processFrame = useCallback(() => {
    if (!videoEl || !landmarkerRef.current || !enabledRef.current) return;
    if (videoEl.readyState < 2) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }

    try {
      const results = landmarkerRef.current.detectForVideo(videoEl, performance.now());

      if (!results.landmarks || results.landmarks.length === 0) {
        handHistoryRef.current = [];
        gestureHoldRef.current = { type: null, start: 0 };
        stableFramesRef.current = 0;
        smoothedLandmarks = null; // reset smoothing when hand disappears
        gestureVoteHistory.length = 0; // reset vote history
        setTracking(false);
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      } else {
        // Require 3 stable frames before acting on gestures (avoid false detections on hand entry)
        stableFramesRef.current++;
        const stable = stableFramesRef.current >= 3;

        setTracking(true);

        if (canvasRef.current) {
          drawLandmarks(
            canvasRef.current,
            results.landmarks,
            videoEl.videoWidth,
            videoEl.videoHeight
          );
        }

        // ─── Gesture Detection (thumbs up / ok) ───
        if (stable && !gestureCooldownRef.current) {
          const rawDetected = detectGesture(results.landmarks);
          const detected = stableGesture(rawDetected); // majority voting

          if (detected) {
            const hold = gestureHoldRef.current;
            if (hold.type === detected) {
              // Same gesture held — check if held for 300ms
              if (Date.now() - hold.start > 300) {
                setGesture(detected);
                onGestureRef.current?.(detected);
                setTimeout(() => setGesture(null), 1000);

                gestureCooldownRef.current = true;
                gestureHoldRef.current = { type: null, start: 0 };
                gestureVoteHistory.length = 0;
                setTimeout(() => {
                  gestureCooldownRef.current = false;
                }, 2000);
              }
            } else {
              // New gesture — start tracking hold time
              gestureHoldRef.current = { type: detected, start: Date.now() };
            }
          } else {
            gestureHoldRef.current = { type: null, start: 0 };
          }
        }

        // ─── Swipe Detection ───
        if (stable) {
          const hand = results.landmarks[0];
          const wrist = hand[WRIST];
          const indexMcp = hand[INDEX_MCP];
          const now = Date.now();

          // Track both wrist and index MCP to distinguish hand swipe from body turn
          handHistoryRef.current.push({
            x: wrist.x, y: wrist.y, time: now,
            refX: indexMcp.x,
          });
          // Keep 500ms history window
          handHistoryRef.current = handHistoryRef.current.filter(
            (p) => now - p.time < 500
          );

          const history = handHistoryRef.current;
          if (history.length >= 3 && !cooldownRef.current) {
            const first = history[0];
            const last = history[history.length - 1];
            const dx = last.x - first.x;
            const dy = last.y - first.y;
            const dt = last.time - first.time;

            // Check that wrist moved relative to the palm (index MCP)
            // If body turns, both move together — refDx ≈ dx
            // If hand swipes intentionally, wrist moves more independently
            const refDx = last.refX! - first.refX!;
            const relativeMotion = Math.abs(dx - refDx);
            const isIntentionalSwipe = relativeMotion > 0.015 || Math.abs(dx) > Math.abs(refDx) * 1.3;

            // Also require at least 2 fingers extended (open hand = intentional gesture)
            const fingersExtended =
              (hand[INDEX_TIP].y < hand[INDEX_PIP].y ? 1 : 0) +
              (hand[MIDDLE_TIP].y < hand[MIDDLE_PIP].y ? 1 : 0) +
              (hand[RING_TIP].y < hand[RING_PIP].y ? 1 : 0) +
              (hand[PINKY_TIP].y < hand[PINKY_PIP].y ? 1 : 0);

            // Swipe requirements:
            // - Min horizontal distance: 0.05
            // - Time window: 30-800ms
            // - Must be intentional (not body turn)
            // - At least 2 fingers extended (open hand)
            if (
              Math.abs(dx) > 0.05 &&
              dt > 30 &&
              dt < 800 &&
              isIntentionalSwipe &&
              fingersExtended >= 2
            ) {
              // Always trigger as "next" regardless of swipe direction
              setDirection("right");
              onSwipeRef.current("right");

              setTimeout(() => setDirection(null), 400);

              cooldownRef.current = true;
              handHistoryRef.current = [];
              setTimeout(() => {
                cooldownRef.current = false;
              }, 1000);
            }
          }
        }
      }
    } catch {
      // continue
    }

    // ~30fps processing for smooth tracking
    setTimeout(() => {
      if (enabledRef.current) {
        rafRef.current = requestAnimationFrame(processFrame);
      }
    }, 33);
  }, [videoEl]);

  useEffect(() => {
    if (!videoEl || !enabled) {
      setTracking(false);
      return;
    }

    let cancelled = false;

    async function init() {
      const vision = await import("@mediapipe/tasks-vision");
      if (cancelled) return;

      const { HandLandmarker, FilesetResolver } = vision;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      if (cancelled) return;

      const handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 1,
        minHandDetectionConfidence: 0.7,   // raised from 0.5 — fewer false positives
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      if (cancelled) {
        handLandmarker.close();
        return;
      }

      landmarkerRef.current = handLandmarker;
      rafRef.current = requestAnimationFrame(processFrame);
    }

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
      smoothedLandmarks = null;
      gestureVoteHistory.length = 0;
      setTracking(false);
    };
  }, [videoEl, enabled, processFrame]);

  return { direction, gesture, tracking };
}
