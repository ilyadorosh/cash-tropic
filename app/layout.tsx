/* eslint-disable @next/next/no-page-custom-font */
import "./styles/globals.scss";
import "./styles/markdown.scss";
import "./styles/highlight.scss";
import { getClientConfig } from "./config/client";
import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getServerSideConfig } from "./config/server";
import { GoogleTagManager } from "@next/third-parties/google";
const serverConfig = getServerSideConfig();

export const metadata: Metadata = {
  title: {
    default: "CzatBoltzmannPlanck",
    template: "%s | CzatBoltzmannPlanck",
  },
  description:
    "AI-powered personal pages and chat. Generate heartfelt connections, explore conversations, and connect with people through generative content.",
  keywords: [
    "AI chat",
    "generative pages",
    "personal AI",
    "ActInLove",
    "AI connections",
  ],
  authors: [{ name: "CzatBoltzmannPlanck" }],
  metadataBase: new URL("https://cash-tropic.vercel.app"),
  openGraph: {
    title: "CzatBoltzmannPlanck",
    description:
      "AI-powered personal pages and chat. Generate heartfelt connections through generative content.",
    type: "website",
    locale: "en_US",
    siteName: "CzatBoltzmannPlanck",
  },
  twitter: {
    card: "summary_large_image",
    title: "CzatBoltzmannPlanck",
    description:
      "AI-powered personal pages and chat. Generate heartfelt connections through generative content.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  appleWebApp: {
    title: "CzatBoltzmannPlanck",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#151515" },
    { media: "(prefers-color-scheme: mania)", color: "#ff0000" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="config" content={JSON.stringify(getClientConfig())} />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <link rel="manifest" href="/site.webmanifest"></link>
        <script src="/serviceWorkerRegister.js" defer></script>
      </head>
      <body>
        {children}
        {serverConfig?.isVercel && (
          <>
            <SpeedInsights />
          </>
        )}
        {serverConfig?.gtmId && (
          <>
            <GoogleTagManager gtmId={serverConfig.gtmId} />
          </>
        )}
      </body>
    </html>
  );
}
