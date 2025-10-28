"use client";
import { useEffect, useState } from "react";

interface BlobFile {
  url: string;
  pathname: string;
}

export default function BlobImageList() {
  const [images, setImages] = useState<BlobFile[]>([]);

  useEffect(() => {
    async function loadImages() {
      const res = await fetch("/api/list-blobs");
      const data = await res.json();
      setImages(data.blobs);
    }
    loadImages();
  }, []);

  return (
    <div className="p-8 grid grid-cols-3 gap-6">
      {images.map((img) => (
        <div key={img.url} className="rounded shadow">
          <a
            href={`/blob/${img.pathname}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={`/blob/${img.pathname}`}
              alt={img.pathname}
              className="rounded-lg object-cover w-full h-48 transition hover:scale-105"
            />
          </a>
          <p className="text-xs text-gray-600 mt-2 break-all">{img.pathname}</p>
        </div>
      ))}
    </div>
  );
}
