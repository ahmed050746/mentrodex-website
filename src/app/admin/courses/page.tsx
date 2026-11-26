import type { Metadata } from "next";
import { AdminCoursesClient } from "@/components/admin/courses/AdminCoursesClient";

export const metadata: Metadata = {
  title: "Admin — Courses",
  robots: { index: false, follow: false },
};

export default function AdminCoursesPage() {
  return <AdminCoursesClient />;
}