 "use client";

import Link from "next/link";

interface ApiErrorFallbackProps {
  title?: string;
  message?: string;
  showRetry?: boolean;
  errorType?: "network" | "api" | "empty" | "unknown";
  onClearFilters?: () => void;
}

export default function ApiErrorFallback({
  title,
  message,
  showRetry = true,
  errorType = "unknown",
  onClearFilters,
}: ApiErrorFallbackProps) {
  const handleRetry = () => {
    window.location.reload();
  };

  // ✅ Dynamic title based on error type
  const getTitle = () => {
    if (title) return title;
    switch (errorType) {
      case "network":
        return "Connection Error";
      case "api":
        return "Server Error";
      case "empty":
        return "No Results Found";
      default:
        return "Something went wrong";
    }
  };

  // ✅ Dynamic message based on error type
  const getMessage = () => {
    if (message) return message;
    switch (errorType) {
      case "network":
        return "Unable to connect to the server. Please check your internet connection and try again.";
      case "api":
        return "Our servers are temporarily unavailable. We're working on it!";
      case "empty":
        return "No caravans found matching your filters. Try adjusting your search criteria.";
      default:
        return "We're having trouble loading this page. Please try again.";
    }
  };

  // ✅ Dynamic suggestions based on error type
  const getSuggestions = () => {
    switch (errorType) {
      case "network":
        return [
          "Check your internet connection",
          "Try turning WiFi off and on",
          "Refresh the page",
        ];
      case "api":
        return [
          "Refresh the page",
          "Come back in a few minutes",
          "Contact support if the issue persists",
        ];
      case "empty":
        return [
          "Try different filter options",
          "Clear all filters and start fresh",
          "Browse all listings",
        ];
      default:
        return [
          "Checking your internet connection",
          "Refreshing the page",
          "Coming back in a few minutes",
        ];
    }
  };

  const getIcon = () => {
    switch (errorType) {
      case "network":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#dc3545"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* WiFi with X - Network Error Icon */}
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
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#dc3545"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Server Error Icon */}
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
            <line x1="13" y1="6" x2="18" y2="6" />
            <line x1="13" y1="18" x2="18" y2="18" />
          </svg>
        );
      case "empty":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffc107"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Search with minus - No Results Icon */}
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        );
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#dc3545"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Alert Circle - Default Error Icon */}
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
    }
  };

  // ✅ Get icon background color
  const getIconBgColor = () => {
    switch (errorType) {
      case "network":
        return "#fff5f5";
      case "api":
        return "#fff5f5";
      case "empty":
        return "#fffbeb";
      default:
        return "#fff5f5";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        minHeight: "400px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          padding: "40px 32px",
          textAlign: "center",
          maxWidth: "450px",
          width: "100%",
        }}
      >
        {/* Icon with background circle */}
        <div
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            background: getIconBgColor(),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px auto",
          }}
        >
          {getIcon()}
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#212529",
            margin: "0 0 12px 0",
          }}
        >
          {getTitle()}
        </h2>

        {/* Message */}
        <p
          style={{
            fontSize: "15px",
            color: "#6c757d",
            margin: "0 0 24px 0",
            lineHeight: 1.6,
          }}
        >
          {getMessage()}
        </p>

        {/* Suggestions Box */}
        <div
          style={{
            background: "#f8f9fa",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
            textAlign: "left",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#495057",
              margin: "0 0 10px 0",
            }}
          >
            You can try:
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: "18px",
              color: "#6c757d",
              fontSize: "13px",
            }}
          >
            {getSuggestions().map((suggestion, index) => (
              <li key={index} style={{ marginBottom: index < 2 ? "6px" : 0 }}>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            alignItems: "center",
          }}
        >
          {/* Primary Button Row */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {showRetry && (
              <button
                onClick={handleRetry}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: 600,
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textDecoration: "none",
                  background: "#007bff",
                  color: "white",
                  border: "none",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
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

            {errorType === "empty" && onClearFilters && (
              <button
                onClick={onClearFilters}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: 600,
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textDecoration: "none",
                  background: "#28a745",
                  color: "white",
                  border: "none",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: "8px" }}
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Clear Filters
              </button>
            )}

             
          </div>
        </div>

        {/* Contact Support */}
        <div
          style={{
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: "1px solid #e9ecef",
          }}
        >
          <p style={{ fontSize: "13px", color: "#6c757d", margin: 0 }}>
            If the problem persists, please{" "}
            <Link
              href="/contact"
              style={{ color: "#007bff", textDecoration: "none" }}
            >
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>

  );
}