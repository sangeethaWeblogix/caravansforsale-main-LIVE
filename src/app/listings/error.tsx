"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ListingsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("Listings page error:", error);
  }, [error]);

  return (
    <section className="error-section bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="container">
        <div className="error-content text-center py-20 px-4">
          {/* Error Icon */}
          <div className="error-icon mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="120"
              height="120"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc3545"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          {/* Error Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Sorry, something went wrong
          </h1>

          {/* Error Message */}
          <p className="text-gray-600 text-lg mb-2 max-w-lg mx-auto">
            We couldn&apos;t load the listings at this moment. This might be due to
            a connection issue or our servers are temporarily unavailable.
          </p>

          <p className="text-gray-500 text-base mb-8">
            Please try again or come back later.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => reset()}
              className="btn btn-primary px-8 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: "#007bff", border: "none" }}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Try Again
            </button>

            <Link
              href="/"
              className="btn btn-outline-secondary px-8 py-3 rounded-lg font-medium transition-all"
              style={{
                border: "2px solid #6c757d",
                color: "#6c757d",
                textDecoration: "none",
              }}
            >
              <i className="bi bi-house me-2"></i>
              Go to Homepage
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-10 text-sm text-gray-400">
            <p>
              If the problem persists, please{" "}
              <Link href="/contact" className="text-blue-500 hover:underline">
                contact support
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Inline styles for standalone functionality */}
      <style jsx>{`
        .error-section {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }
        .error-content {
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          max-width: 600px;
          width: 100%;
        }
        .error-icon svg {
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 160px;
          cursor: pointer;
        }
        .btn:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </section>
  );
}
