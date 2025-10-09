let defaultFavicon = "/favicon.ico";

const spinnerSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle
    cx="50" cy="50" r="44"
    stroke="#f97316"
    stroke-width="8"
    stroke-linecap="round"
    stroke-dasharray="260"
    stroke-dashoffset="50"
    fill="none"
    opacity="0.4">
    <animateTransform
      attributeName="transform"
      type="rotate"
      from="0 50 50"
      to="360 50 50"
      dur="0.6s"
      repeatCount="indefinite"/>
  </circle>
  <circle
    cx="50" cy="50" r="25"
    fill="#f97316">
    <animate attributeName="r" values="24;26;24" dur="0.8s" repeatCount="indefinite"/>
  </circle>
</svg>
`;

// ✅ Base64 encode safely
const spinnerDataURL = `data:image/svg+xml;base64,${btoa(
  unescape(encodeURIComponent(spinnerSVG))
)}`;

function getOrCreateFavicon(): HTMLLinkElement {
  let link = document.querySelector(
    "link[rel~='icon']"
  ) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  return link;
}

export function setFaviconLoading(isLoading: boolean) {
  try {
    const link = getOrCreateFavicon();
    // ✅ Add unique query param each time to bust cache
    link.href = isLoading
      ? `${spinnerDataURL}#${Date.now()}`
      : `${defaultFavicon}?v=${Date.now()}`;
    link.type = "image/svg+xml";
  } catch (err) {
    console.warn("⚠️ Favicon update failed:", err);
  }
}
