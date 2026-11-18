"use client";

import { useState } from "react";
import Image from "next/image";
import { cloudinaryOptimized } from "@/lib/cloudinaryUrl";

type Props = {
  src?: string | null;
  alt: string;
  /** Rough rendered width in CSS px; Cloudinary serves ~this size (use ~2x for crisp retina images). */
  width?: number;
  sizes?: string;
  className?: string;
  /** Shown when the plan has no image or the image fails to load. */
  fallback?: string;
};

/**
 * Plan photo that works for both old local paths (/img/...) and Cloudinary uploads.
 * Must sit inside a `relative` parent with a set size, like any next/image `fill`.
 */
export default function PlanImage({ src, alt, width = 800, sizes, className = "object-cover", fallback = "/img/slide-01.jpg" }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const broken = !src || failedSrc === src;

  return (
    <Image
      src={broken ? fallback : cloudinaryOptimized(src, width)}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => setFailedSrc(src ?? "")}
    />
  );
}
