import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/portal/auth";
import { resolvePortalHomeRedirect } from "@/lib/portal/courseSnapshot";
import { PortalEmptyLessons } from "@/components/portal/PortalEmptyLessons";
import { PortalLoginClient } from "@/components/portal/PortalLoginClient";

export const metadata: Metadata = {
  title: "Student portal",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function PortalPage() {
  await cookies();

  const student = await getCurrentStudent();
  if (!student) {
    return <PortalLoginClient />;
  }

  const target = await resolvePortalHomeRedirect(student.id);
  if (target.startsWith("/portal/lesson/")) {
    redirect(target);
  }

  return <PortalEmptyLessons />;
}