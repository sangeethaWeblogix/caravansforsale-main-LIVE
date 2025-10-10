let defaultFavicon = "/favicon.ico";

export function setFaviconLoading(isLoading: boolean) {
  const existing = document.getElementById(
    "dynamic-favicon-anim"
  ) as HTMLCanvasElement | null;
  if (existing) {
    const animFrameId = existing.dataset.animFrameId;
    if (animFrameId) cancelAnimationFrame(parseInt(animFrameId));
    existing.remove();
  }

  if (!isLoading) {
    const link = getOrCreateFavicon();
    link.href = `${defaultFavicon}?v=${Date.now()}`;
    return;
  }

  startCanvasFaviconAnimation();
}

function getOrCreateFavicon(): HTMLLinkElement {
  let link = document.querySelector(
    "link[rel~='icon']"
  ) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    document.head.appendChild(link);
  }
  return link;
}

function startCanvasFaviconAnimation() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  canvas.id = "dynamic-favicon-anim";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  const color = "#f97316";
  let angle = 0;
  let pulse = 0;
  const link = getOrCreateFavicon();

  function drawFrame() {
    ctx.clearRect(0, 0, 64, 64);

    // Outer faded ring
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.strokeStyle = `${color}40`;
    ctx.lineWidth = 6;
    ctx.stroke();

    // Rotating bright arc
    ctx.beginPath();
    ctx.arc(32, 32, 28, angle, angle + Math.PI / 1.3);
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.stroke();

    // Pulsing inner dot
    const pulseRadius = 9 + Math.sin(pulse) * 2;
    ctx.beginPath();
    ctx.arc(32, 32, pulseRadius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Update favicon
    link.href = canvas.toDataURL("image/png");
    link.rel = "icon";
    link.type = "image/png";

    // Animation control
    angle += 0.4;
    pulse += 0.2;

    const frameId = requestAnimationFrame(drawFrame);
    canvas.dataset.animFrameId = frameId.toString();
  }

  requestAnimationFrame(drawFrame);
}
