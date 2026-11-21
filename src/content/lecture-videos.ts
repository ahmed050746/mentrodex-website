export type LectureVideoItem = {
  id: string;
  num: string;
  name: string;
  /** Full “Now playing” line */
  title: string;
  bunny: string;
  /** Fallback list thumb; Bunny oEmbed overrides when loaded */
  thumbnail?: string;
};

export const LECTURE_VIDEOS: LectureVideoItem[] = [
  {
    id: "lec-01",
    num: "Lecture 01",
    name: "How You will make Money",
    title: "Lecture 01 · How You will make Money",
    bunny: "bunny:786982/2b51c5e2-b7b1-4a26-ad4b-7f9aac767c18",
    thumbnail:
      "https://vz-40eaeb89-41e.b-cdn.net/2b51c5e2-b7b1-4a26-ad4b-7f9aac767c18/thumbnail_f9455274.jpg",
  },
  {
    id: "lec-02",
    num: "Lecture 02",
    name: "Discord Marketing Full Introduction",
    title: "Lecture 02 · Discord Marketing Full Introduction",
    bunny: "bunny:786982/465064dc-438f-40f7-a7f4-b8f11ed68973",
    thumbnail:
      "https://vz-40eaeb89-41e.b-cdn.net/465064dc-438f-40f7-a7f4-b8f11ed68973/thumbnail_0c1ed70c.jpg",
  },
  {
    id: "lec-03",
    num: "Lecture 03",
    name: "WhatsApp Group Marketing Strategy",
    title: "Lecture 03 · WhatsApp Group Marketing Strategy",
    bunny: "bunny:786982/14472577-1d3f-4e4e-a400-a6f6f2e946cc",
    thumbnail:
      "https://vz-40eaeb89-41e.b-cdn.net/14472577-1d3f-4e4e-a400-a6f6f2e946cc/thumbnail_1796d606.jpg",
  },
  {
    id: "lec-04",
    num: "Lecture 04",
    name: "Find Winning Product Under 5 Minutes",
    title: "Lecture 04 · Find Winning Product Under 5 Minutes",
    bunny: "bunny:786982/464f54e8-5302-4512-9dea-0fbc9e76dc94",
    thumbnail:
      "https://vz-40eaeb89-41e.b-cdn.net/464f54e8-5302-4512-9dea-0fbc9e76dc94/thumbnail_755933ef.jpg",
  },
];