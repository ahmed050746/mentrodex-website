import type { Metadata } from "next";
import PayPageClient from "@/components/pay/PayPageClient";
import { LegacyStyles } from "@/components/LegacyStyles";

export const metadata: Metadata = {
  title: "Enroll Now | Pay Rs. 4,500",
  description:
    "Secure your spot in the 1-on-1 e-commerce mentorship. Pay via Bank Transfer or EasyPaisa and confirm your enrollment.",
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