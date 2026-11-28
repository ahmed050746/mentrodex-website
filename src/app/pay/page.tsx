import type { Metadata } from "next";
import PayPageClient from "@/components/pay/PayPageClient";
import { LegacyStyles } from "@/components/LegacyStyles";
import {
  PAY_DESCRIPTION,
  PAY_TITLE,
  buildPublicMetadata,
} from "@/lib/site-seo";

export const metadata: Metadata = buildPublicMetadata({
  title: PAY_TITLE,
  description: PAY_DESCRIPTION,
  pathname: "/pay",
});

export default function PayPage() {
  return (
    <>
      <LegacyStyles page="pay" />
      <div className="pay-page">
        <PayPageClient />
      </div>
    </>
  );
}