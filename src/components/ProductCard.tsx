"use client";

import type { Product } from "@/data/catalog";
import { useCallback, useRef, useState } from "react";

interface Props {
  product: Product;
  isActive: boolean;
  onClick: () => void;
  onImageUploaded?: () => void;
}

export function ProductCard({ product, isActive, onClick, onImageUploaded }: Props) {
  const [imageUrl, setImageUrl] = useState<string>(product.image);
  const [hasImage, setHasImage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);
      formData.append("path", product.image);

      try {
        const res = await fetch("/api/products/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          setImageUrl(`${product.image}?t=${Date.now()}`);
          setHasImage(true);
          onImageUploaded?.();
        }
      } catch (err) {
        console.error("Upload failed:", err);
      } finally {
        setUploading(false);
      }
    },
    [product.image, onImageUploaded]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) handleUpload(file);
    },
    [handleUpload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className={`group relative w-full text-left transition-all overflow-hidden cursor-pointer ${
        isActive ? "ring-1 ring-black" : ""
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <button onClick={onClick} className="w-full cursor-pointer">
        <div className="aspect-[3/4] relative bg-[#f5f5f5]">
          {hasImage && (
            <img
              src={imageUrl}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <img
            src={product.image}
            alt=""
            className="hidden"
            onLoad={() => setHasImage(true)}
            onError={() => setHasImage(false)}
          />

          {!hasImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-black/10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="py-2">
          <p className="text-[11px] font-normal text-black leading-tight truncate">
            {product.name}
          </p>
        </div>
      </button>

      {/* Upload button - subtle, top-right on hover */}
      <button
        className={`absolute top-1.5 right-1.5 z-[3] p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm ${
          uploading ? "opacity-100" : ""
        }`}
        onClick={(e) => {
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
        title={hasImage ? "Replace image" : "Upload image"}
      >
        {uploading ? (
          <div className="w-3 h-3 border border-black/20 border-t-black rounded-full animate-spin" />
        ) : (
          <svg
            className="w-3 h-3 text-black/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        )}
      </button>

      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />
      )}
    </div>
  );
}
