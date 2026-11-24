import type { Metadata } from "next";
import PayPageClient from "@/components/pay/PayPageClient";
import { LegacyStyles } from "@/components/LegacyStyles";
import { OWNER_NAME, SITE_NAME } from "@/lib/site-seo";

export const metadata: Metadata = {
  title: "Enroll Now | Pay Rs. 4,500",
  description: `Enroll in ${OWNER_NAME}'s ${SITE_NAME} mentorship. Pay via Bank Transfer or EasyPaisa and confirm your spot.`,
};

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