 "use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const LOADING_PLACEHOLDER = "/images/imageloading.png";
const FALLBACK_IMAGE = "/images/image.png";
const MAX_RETRIES = 3;

interface Props {
  src?: string;
  alt?: string;
  priority?: boolean;
  width?: number;
  height?: number; // 👈 control height inline
}

export default function ImageWithSkeleton({
  src,
  alt = "",
  priority = false,
  width = 300,
  height = 220, // 👈 default card height
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    setRetry(0);
    setImgSrc(src);
  }, [src]);

  const handleError = useCallback(() => {
    if (!src) return;

    if (retry < MAX_RETRIES) {
      setTimeout(() => {
        setRetry((r) => r + 1);
        setImgSrc(`${src}?retry=${retry + 1}&t=${Date.now()}`);
      }, 800);
    } else {
      setFailed(true);
    }
  }, [retry, src]);

  const finalSrc = failed ? FALLBACK_IMAGE : imgSrc || FALLBACK_IMAGE;

  return (
    <div
      style={{
        position: "relative",
         width: `${width}px`,       // 🔥 FULL AREA
        height: `${height}px`,     // 🔥 FULL AREA
        backgroundColor: "#f2f2f2",
        overflow: "hidden",
        borderRadius: "6px",
      }}
    >
      {/* ✅ LOADING IMAGE (FULL AREA) */}
      {!loaded && !failed && (
        <Image
          src={LOADING_PLACEHOLDER}
          alt="Loading"
          fill
          unoptimized
          style={{
            objectFit: "cover",
          }}
        />
      )}

      {/* ✅ REAL IMAGE */}
      <Image
        src={finalSrc}
        alt={alt}
        fill
        priority={priority}
        unoptimized
        onLoad={() => setLoaded(true)}
        onError={handleError}
        style={{
          objectFit: "cover",
          opacity: loaded || failed ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />
    </div>
  );
}
