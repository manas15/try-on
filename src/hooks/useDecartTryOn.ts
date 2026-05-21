"use client";

import { useCallback, useRef, useState } from "react";
import { createDecartClient, models } from "@decartai/sdk";
import type { RealTimeClient } from "@decartai/sdk";
import type { Product } from "@/data/catalog";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface DecartTryOnHook {
  status: ConnectionStatus;
  currentProduct: Product | null;
  outputRef: React.RefObject<HTMLVideoElement | null>;
  localRef: React.RefObject<HTMLVideoElement | null>;
  remoteStreamRef: React.RefObject<MediaStream | null>;
  cameraReady: boolean;
  startCamera: () => Promise<void>;
  connect: (initialProduct?: Product) => Promise<void>;
  disconnect: () => void;
  tryOn: (product: Product) => Promise<void>;
  error: string | null;
}

export function useDecartTryOn(): DecartTryOnHook {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const outputRef = useRef<HTMLVideoElement | null>(null);
  const localRef = useRef<HTMLVideoElement | null>(null);
  const realtimeClientRef = useRef<RealTimeClient | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const autoDisconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startCamera = useCallback(async () => {
    if (streamRef.current) return; // already started
    try {
      const model = models.realtime("lucy-vton-latest");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          frameRate: model.fps,
          width: model.width,
          height: model.height,
        },
      });
      streamRef.current = stream;
      if (localRef.current) {
        localRef.current.srcObject = stream;
      }
      setCameraReady(true);
    } catch (err) {
      console.error("Camera error:", err);
      setError(err instanceof Error ? err.message : "Camera access denied");
    }
  }, []);

  const connect = useCallback(async (initialProduct?: Product) => {
    try {
      setStatus("connecting");
      setError(null);

      // Start camera if not already
      if (!streamRef.current) {
        await startCamera();
      }
      const stream = streamRef.current;
      if (!stream) throw new Error("No camera stream");

      // Show local feed
      if (localRef.current) {
        localRef.current.srcObject = stream;
      }

      // Get client token
      const tokenRes = await fetch("/api/token", { method: "POST" });
      if (!tokenRes.ok) throw new Error("Failed to get API token");
      const { apiKey } = await tokenRes.json();

      const client = createDecartClient({ apiKey });

      const realtimeClient = await client.realtime.connect(stream, {
        model: models.realtime("lucy-vton-latest"),
        mirror: "auto",
        onRemoteStream: (remoteStream: MediaStream) => {
          remoteStreamRef.current = remoteStream;
          if (outputRef.current) {
            outputRef.current.srcObject = remoteStream;
          }
        },
      });

      realtimeClient.on("error", (err) => {
        console.error("Decart realtime error:", err);
        setError(err.message);
        setStatus("error");
      });

      const applyProduct = async (product: Product) => {
        try {
          let imageBlob: Blob | undefined;
          try {
            const imgRes = await fetch(product.image);
            if (imgRes.ok) imageBlob = await imgRes.blob();
          } catch {}
          if (imageBlob && imageBlob.size > 0) {
            await realtimeClient.set({ prompt: product.prompt, image: imageBlob, enhance: false });
          } else {
            await realtimeClient.setPrompt(product.prompt);
          }
          setCurrentProduct(product);
        } catch (err) {
          console.error("Try-on error:", err);
        }
      };

      realtimeClient.on("connectionChange", (state) => {
        if (state === "disconnected") {
          setStatus("disconnected");
          setCurrentProduct(null);
        } else if (state === "connected" || state === "generating") {
          setStatus("connected");
          // Apply product when WebRTC is truly ready
          if (initialProduct) {
            applyProduct(initialProduct);
          }
        } else if (state === "reconnecting") {
          setStatus("connecting");
        }
      });

      realtimeClientRef.current = realtimeClient;
      setStatus("connected");

      // Also try applying immediately
      if (initialProduct) {
        applyProduct(initialProduct);
      }

      // Auto-disconnect after 1 minute to save credits
      if (autoDisconnectRef.current) clearTimeout(autoDisconnectRef.current);
      autoDisconnectRef.current = setTimeout(() => {
        console.log("Auto-disconnecting to save credits (1 min limit)");
        if (realtimeClientRef.current) {
          realtimeClientRef.current.disconnect();
          realtimeClientRef.current = null;
        }
        setStatus("disconnected");
        setCurrentProduct(null);
        setError("Session ended after 1 minute to save credits (~120 credits used). Click Start to reconnect.");
      }, 60 * 1000);
    } catch (err) {
      console.error("Connection error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
      setStatus("error");
    }
  }, [startCamera]);

  const disconnect = useCallback(() => {
    if (autoDisconnectRef.current) clearTimeout(autoDisconnectRef.current);
    if (realtimeClientRef.current) {
      realtimeClientRef.current.disconnect();
      realtimeClientRef.current = null;
    }
    // Keep camera running - don't stop stream
    setStatus("disconnected");
    setCurrentProduct(null);
  }, []);

  const tryOn = useCallback(async (product: Product) => {
    if (!realtimeClientRef.current) return;

    try {
      let imageBlob: Blob | undefined;
      try {
        const imgRes = await fetch(product.image);
        if (imgRes.ok) {
          imageBlob = await imgRes.blob();
        }
      } catch {
        // proceed with prompt only
      }

      if (imageBlob && imageBlob.size > 0) {
        await realtimeClientRef.current.set({
          prompt: product.prompt,
          image: imageBlob,
          enhance: false,
        });
      } else {
        await realtimeClientRef.current.setPrompt(product.prompt);
      }

      setCurrentProduct(product);
    } catch (err) {
      console.error("Try-on error:", err);
      setError(err instanceof Error ? err.message : "Failed to apply try-on");
    }
  }, []);

  return {
    status,
    currentProduct,
    outputRef,
    localRef,
    remoteStreamRef,
    cameraReady,
    startCamera,
    connect,
    disconnect,
    tryOn,
    error,
  };
}
