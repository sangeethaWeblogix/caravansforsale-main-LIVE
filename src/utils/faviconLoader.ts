let defaultFavicon = "/favicon.ico";

export function setFaviconLoading(isLoading: boolean) {
  // Stop any previous animation
  const existing = document.getElementById("dynamic-favicon-anim");
  if (existing) existing.remove();

  if (!isLoading) {
    const link = getOrCreateFavicon();
    link.href = `${defaultFavicon}?v=${Date.now()}`;
    return;
  }

  // Start animated SVG spinner drawn via canvas
  startCanvasFaviconAnimation();
}

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

function startCanvasFaviconAnimation() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  canvas.id = "dynamic-favicon-anim";
  const ctx = canvas.getContext("2d")!;

  const color = "#f97316";
  let angle = 0;
  let pulse = 0;
  let direction = 1;
  const link = getOrCreateFavicon();

  function drawFrame() {
    ctx.clearRect(0, 0, 64, 64);

    // outer faded ring
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.strokeStyle = `${color}40`; // softer halo
    ctx.lineWidth = 6;
    ctx.stroke();

    // rotating bright arc
    ctx.beginPath();
    ctx.arc(32, 32, 28, angle, angle + Math.PI / 1.3);
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.stroke();

    // pulsing inner dot
    const pulseRadius = 9 + Math.sin(pulse) * 2;
    ctx.beginPath();
    ctx.arc(32, 32, pulseRadius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // convert frame → favicon
    link.href = canvas.toDataURL("image/png");

    // 🔥 Speed controls
    angle += 0.4; // faster rotation (was 0.15)
    pulse += 0.2; // pulse speed

    anim = requestAnimationFrame(drawFrame);
  }

  let anim = requestAnimationFrame(drawFrame);
  window.addEventListener("beforeunload", () => cancelAnimationFrame(anim));
}
