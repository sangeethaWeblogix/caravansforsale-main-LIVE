"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
 interface ApiErrorFallbackProps {
  title?: string;
  message?: string;
  showRetry?: boolean;
  errorType?: "network" | "api" | "empty" | "unknown";
}

export default function ApiErrorFallback({
  title = "Something went wrong",
  message = "We're having trouble loading this page. Please try again.",
  showRetry = true,
  errorType = "unknown",
}: ApiErrorFallbackProps) {
  const router = useRouter();

  const handleRetry = () => {
    // Force a hard refresh of the current page
    window.location.reload();
  };

  const getIcon = () => {
    switch (errorType) {
      case "network":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6c757d"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        );
      case "api":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#dc3545"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
            <line x1="7" y1="8" x2="7.01" y2="8" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
            <line x1="17" y1="8" x2="17.01" y2="8" />
            <line x1="7" y1="12" x2="17" y2="12" />
          </svg>
        );
      case "empty":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffc107"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        );
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#dc3545"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
    }
  };

  return (
    <section className="error-fallback-section">
      <div className="container">
        <div className="error-fallback-content">
          {/* Breadcrumb */}
          <div className="breadcrumb-nav">
            <Link href="/" className="breadcrumb-link">
              Home
            </Link>
            <span className="breadcrumb-separator">&gt;</span>
            <span className="breadcrumb-current">Listings</span>
          </div>

          {/* Error Card */}
          <div className="error-card">
            {/* Icon */}
            <div className="error-icon">{getIcon()}</div>

            {/* Title */}
            <h1 className="error-title">{title}</h1>

            {/* Message */}
            <p className="error-message">{message}</p>

            {/* Suggestions */}
            <div className="error-suggestions">
              <p className="suggestions-title">You can try:</p>
              <ul className="suggestions-list">
                <li>Checking your internet connection</li>
                <li>Refreshing the page</li>
                <li>Coming back in a few minutes</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="error-actions">
              {showRetry && (
                <button onClick={handleRetry} className="btn-retry">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: "8px" }}
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  Try Again
                </button>
              )}

              <Link href="/" className="btn-home">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: "8px" }}
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Go to Homepage
              </Link>
            </div>

            {/* Contact Support */}
            <div className="error-footer">
              <p>
                Need help?{" "}
                <Link href="/contact" className="contact-link">
                  Contact our support team
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

    
    </section>
  );
}
