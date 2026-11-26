export type PortalStudent = {
  id: string;
  email: string | null;
  phone_e164: string | null;
  display_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CourseModule = {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type CourseLesson = {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  bunny_ref: string;
  sort_order: number;
  is_published: boolean;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
};

export type LessonProgress = {
  id: string;
  student_id: string;
  lesson_id: string;
  last_position_seconds: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};