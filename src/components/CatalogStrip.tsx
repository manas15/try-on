"use client";

import type { Product } from "@/data/catalog";
import { useEffect, useRef } from "react";

interface Props {
  products: Product[];
  activeIndex: number;
  onSelect: (index: number) => void;
  swipeDirection: "left" | "right" | null;
}

export function CatalogStrip({ products, activeIndex, onSelect, swipeDirection }: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Scroll active item into center
  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    if (el && stripRef.current) {
      const strip = stripRef.current;
      const scrollLeft = el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2;
      strip.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [activeIndex]);

  return (
    <div className="relative">
      {/* Swipe indicator */}
      {swipeDirection && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className={`flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-[11px] uppercase tracking-[0.15em] animate-pulse ${
            swipeDirection === "left" ? "-translate-x-4" : "translate-x-4"
          } transition-transform`}>
            {swipeDirection === "left" ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Strip */}
      <div
        ref={stripRef}
        className="flex gap-3 overflow-x-auto px-6 py-3 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product, i) => (
          <button
            key={product.id}
            ref={(el) => { itemRefs.current[i] = el; }}
            onClick={() => onSelect(i)}
            className={`flex-shrink-0 flex items-center gap-3 px-3 py-2 transition-all ${
              i === activeIndex
                ? "bg-white/15 backdrop-blur-sm"
                : "bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="w-10 h-12 flex-shrink-0 bg-white/10 overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <span className={`text-[10px] uppercase tracking-[0.1em] whitespace-nowrap ${
              i === activeIndex ? "text-white" : "text-white/50"
            }`}>
              {product.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
