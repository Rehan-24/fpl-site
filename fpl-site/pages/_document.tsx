import Document, { Html, Head, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* iOS / iMessage style icon for Add-to-Home-Screen */}
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

          {/* Favicon + pinned tab (optional) */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5b329e" />

          {/* PWA manifest (Android/modern) */}
          <link rel="manifest" href="/manifest.webmanifest" />
          <meta name="theme-color" content="#5b329e" />

          {/* iOS web app options */}
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="tFPL" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
