"use client";

import { useState, useEffect } from "react";

import Image from "next/image";

interface Props {
  src?: string;

  alt?: string;

  width?: number;

  height?: number;

  className?: string;

  style?: React.CSSProperties;

  priority?: boolean;
}

export default function ImageWithSkeleton({
  src,

  alt = "",

  width = 400,

  height = 300,

  className,

  priority = false,
}: Props) {
  const [loaded, setLoaded] = useState(priority);

  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!priority) {
      setLoaded(false);
    }

    setFailed(false);
  }, [src, priority]);

  // ✅ Use native <img> for priority images (MUCH faster!)

  if (priority && src && !failed) {
    return (
      <div className={className}>
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onError={() => setFailed(true)}
          style={{
            width: "100%",

            height: "100%",

            objectFit: "cover",

            display: "block",
          }}
        />
      </div>
    );
  }

  // ✅ Use Next.js Image for lazy-loaded images

  return (
    <div className={className}>
      {/* Skeleton */}

      {!loaded && (
        <div
          style={{
            position: "absolute",

            inset: 0,

            background: "linear-gradient(90deg,#eee,#ddd,#eee)",

            animation: "pulse 1.3s infinite",
          }}
        />
      )}

      {/* Lazy-loaded image */}

      {src && !failed && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          unoptimized
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);

            setLoaded(true);
          }}
          style={{
            width: "100%",

            height: "100%",

            objectFit: "cover",

            transition: "opacity .35s ease",

            opacity: loaded ? 1 : 0,
          }}
        />
      )}

      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 1;
          }

          50% {
            opacity: 0.4;
          }

          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
