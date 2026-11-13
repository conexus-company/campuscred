import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Showcase } from "./showcase";

export const metadata: Metadata = {
  title: "Components · CampusCred (dev)",
  robots: { index: false, follow: false },
};

/** Dev-only gallery of the shared components. 404 in production builds. */
export default function DevComponentsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Showcase />;
}
