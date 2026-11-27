"use client";

import dynamic from "next/dynamic";
import { PortalLoginFallback } from "./PortalLoginFallback";

const PortalLoginClient = dynamic(
  () =>
    import("./PortalLoginClient").then((mod) => mod.PortalLoginClient),
  { ssr: false, loading: () => <PortalLoginFallback /> },
);

export function PortalLoginGate() {
  return <PortalLoginClient />;
}