"use client";

import dynamic from "next/dynamic";

const TambolaScene = dynamic(() => import("@/components/landing/TambolaScene"), {
  ssr: false,
});

export default function TambolaSceneLoader() {
  return <TambolaScene />;
}
