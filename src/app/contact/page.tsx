import type { Metadata } from "next";
import ContactPageClient from "@/components/contact/ContactPageClient";
import { LegacyStyles } from "@/components/LegacyStyles";
import { OWNER_NAME, SITE_NAME } from "@/lib/site-seo";

export const metadata: Metadata = {
  title: "Contact Us | Book Your Free Consultation",
  description: `Book a consultation for 1-on-1 e-commerce mentorship with ${OWNER_NAME} and the ${SITE_NAME} team. Tell us about your goals.`,
};

export default function ContactPage() {
  return (
    <>
      <LegacyStyles page="contact" />
      <div className="contact-page">
        <ContactPageClient />
      </div>
    </>
  );
}