import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ActInLove — Personal AI pages",
  description:
    "Send a heartfelt AI-generated page to someone. Connect, express, and share personalized moments powered by generative AI.",
  openGraph: {
    title: "ActInLove — Personal AI pages",
    description:
      "Send a heartfelt AI-generated page to someone. Connect, express, and share personalized moments powered by generative AI.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function FromLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
