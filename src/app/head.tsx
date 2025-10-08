export default function Head() {
  return (
    <>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />

      {/* Preconnect to Google Fonts (safe even though self-hosted) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

      {/* Async preload for large CSS */}
      <link
        rel="preload"
        href="/_next/static/css/991efdcd1ebedf92.css"
        as="style"
        onLoad={(e) => {
          const link = e.currentTarget as HTMLLinkElement;
          link.onload = null;
          link.rel = "stylesheet";
        }}
      />
      <noscript>
        <link rel="stylesheet" href="/_next/static/css/991efdcd1ebedf92.css" />
      </noscript>
    </>
  );
}
 