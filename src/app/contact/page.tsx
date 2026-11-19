import type { Metadata } from "next";
import ContactPageClient from "@/components/contact/ContactPageClient";
import { LegacyStyles } from "@/components/LegacyStyles";

export const metadata: Metadata = {
  title: "Contact Us | Book Your Free Consultation",
  description:
    "Book a consultation for 1-on-1 e-commerce mentorship. Tell us about your goals and our team will contact you.",
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