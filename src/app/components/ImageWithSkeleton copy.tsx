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
  width = 300,
  height = 200,
  className,
   priority=false,
  
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // reset when src changes
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  const realSrc = failed || !src ? "/images/sample3.webp" : src;

  return (
    <div
      
      className={className}
       style={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
      }}
    >
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

      {/* Image */}
      <Image
        src={realSrc}
        alt={alt}
        width={width}
        height={height}
        unoptimized
         priority={priority}  
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "opacity .35s ease",
          opacity: loaded ? 1 : 0,
        }}
      />

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