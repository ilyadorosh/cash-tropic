import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Action in Love — An Open Research Plan",
  description:
    "A buildable plan for adaptive, stable, energy-aware intelligence—and an invitation to challenge it, improve it, and enjoy it together.",
  alternates: { canonical: "/plan" },
  openGraph: {
    title:
      "Build intelligence that learns without burning the world around it.",
    description:
      "Running artifacts, testable hypotheses, open questions, and an open port for contributors.",
    type: "article",
    url: "/plan",
    siteName: "Action in Love",
    images: [
      {
        url: "/plan/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Action in Love open research plan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Action in Love — An Open Research Plan",
    description:
      "Adaptive learning, stable dynamics, local repair, and the physical cost of computation.",
    images: ["/plan/opengraph-image"],
  },
};

export default function PlanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
