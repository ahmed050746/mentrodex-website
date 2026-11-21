/**
 * "What Others Say" — update this list only.
 *
 * `bunny` accepts any of:
 * - `bunny:786982/your-video-uuid`
 * - `786982/your-video-uuid`
 * - Full embed URL from Bunny dashboard
 *
 * List buttons use `bunny` as the video link; a tap loads that video only in the main player above (lazy iframe).
 */
export type TestimonialVideoItem = {
  id: string;
  /** Display title under the main player */
  title: string;
  bunny: string;
  /** Optional static poster; falls back to Bunny thumbnail API */
  thumbnail?: string;
  name: string;
  role: string;
  quote: string;
};

export const TESTIMONIAL_VIDEOS: TestimonialVideoItem[] = [
  {
    id: "testi-01",
    title: "Student story 01",
    bunny: "bunny:786982/3be219b1-35a9-4ddd-9d14-5fb8aea8dba4",
    thumbnail:
      "https://vz-40eaeb89-41e.b-cdn.net/3be219b1-35a9-4ddd-9d14-5fb8aea8dba4/thumbnail_5439cae9.jpg",
    name: "Student Name",
    role: "Course / City",
    quote: "Add a short student review here.",
  },
  {
    id: "testi-02",
    title: "Student story 02",
    bunny: "bunny:786982/3be219b1-35a9-4ddd-9d14-5fb8aea8dba4",
    thumbnail:
      "https://vz-40eaeb89-41e.b-cdn.net/3be219b1-35a9-4ddd-9d14-5fb8aea8dba4/thumbnail_5439cae9.jpg",
    name: "Student Name",
    role: "Course / City",
    quote: "Add a short student review here.",
  },
  {
    id: "testi-03",
    title: "Student story 03",
    bunny: "bunny:786982/5f8ee15c-968a-47b0-8a00-991b0216deb2",
    thumbnail:
      "https://vz-40eaeb89-41e.b-cdn.net/5f8ee15c-968a-47b0-8a00-991b0216deb2/thumbnail_d554c419.jpg",
    name: "Student Name",
    role: "Course / City",
    quote: "Add a short student review here.",
  },
];