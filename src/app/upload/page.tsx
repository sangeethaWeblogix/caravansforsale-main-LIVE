"use client";
import { useState } from "react";

export default function UploadPage() {
  const [url, setUrl] = useState("");

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setUrl(`/blob/${data.pathname}`); // ✅ shows under your domain
  }

  return (
    <div className="p-8">
      <h2 className="text-lg font-bold mb-4">Upload Image</h2>
      <form onSubmit={handleUpload}>
        <input type="file" name="file" accept="image/*" required />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg ml-4"
        >
          Upload
        </button>
      </form>

      {url && (
        <div className="mt-6">
          <p>Uploaded Image:</p>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <img src={url} alt="Uploaded" className="w-64 mt-2 rounded-lg" />
          </a>
          <p className="text-sm text-gray-500 mt-2">{url}</p>
        </div>
      )}
    </div>
  );
}
