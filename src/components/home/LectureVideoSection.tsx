"use client";

import { useCallback, useMemo, useState } from "react";
import { LECTURE_VIDEOS } from "@/content/lecture-videos";
import { bunnyEmbedUrl } from "@/lib/bunny-embed";
import { useBunnyThumbnails } from "@/hooks/useBunnyThumbnails";

type Props = {
  titleId: string;
};

export function LectureVideoSection({ titleId }: Props) {
  const lectures = LECTURE_VIDEOS;
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const active = lectures[activeIndex] ?? lectures[0];
  const bunnyThumbs = useBunnyThumbnails(lectures.map((l) => l.bunny));

  const embedSrc = useMemo(() => {
    if (!playing || !active?.bunny) return null;
    return bunnyEmbedUrl(active.bunny, {
      autoplay: true,
      preload: true,
      muted: true,
    });
  }, [active?.bunny, active?.id, playing]);

  const idlePoster =
    bunnyThumbs[active.bunny] || active.thumbnail?.trim() || "";

  const selectLecture = useCallback(
    (index: number) => {
      const item = lectures[index];
      if (!item?.bunny || !bunnyEmbedUrl(item.bunny)) return;
      setActiveIndex(index);
      setPlaying(true);
    },
    [lectures],
  );

  const startMainPlayer = useCallback(() => {
    if (active?.bunny && bunnyEmbedUrl(active.bunny)) {
      setPlaying(true);
    }
  }, [active?.bunny]);

  if (!active) return null;

  return (
    <section className="lec" aria-labelledby={titleId}>
      <div className="lec__inner">
        <header className="lec__head">
          <span className="lec__eyebrow">Sample lectures</span>
          <h2 id={titleId} className="lec__title">
            Preview the <span className="lec__title-accent">Course Lessons</span>
          </h2>
          <p className="lec__sub">
            Short sample lessons. See our teaching style and key concepts.
          </p>
        </header>

        <div className="lec__layout">
          <div className="lec__player">
            <div
              className={`youtube-placeholder lec__media${playing ? " is-playing" : ""}`}
              data-video={active.bunny}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (!playing) startMainPlayer();
              }}
              onKeyDown={(e) => {
                if (!playing && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  startMainPlayer();
                }
              }}
            >
              {embedSrc ? (
                <iframe
                  key={active.id}
                  src={embedSrc}
                  title={active.title}
                  loading="lazy"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : idlePoster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={idlePoster}
                  alt={active.title}
                  className="lec__idle-poster"
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
              {!playing ? (
                <div className="play-button" aria-hidden="true">
                  ▶
                </div>
              ) : null}
            </div>
            <p className="lec__now">
              <span className="lec__now-label">Now playing</span>{" "}
              <span className="lec__now-title">{active.title}</span>
            </p>
          </div>

          <ol className="lec__list">
            {lectures.map((item, index) => {
              const selected = index === activeIndex;
              const thumb =
                bunnyThumbs[item.bunny] || item.thumbnail?.trim() || "";
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`lec__btn${selected ? " is-active" : ""}`}
                    aria-pressed={selected}
                    data-video={item.bunny}
                    data-thumb={thumb || undefined}
                    data-title={item.title}
                    onClick={() => selectLecture(index)}
                  >
                    <span
                      className="lec__thumb"
                      aria-hidden="true"
                      style={
                        thumb
                          ? {
                              backgroundImage: `url("${thumb}")`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }
                    >
                      <span className="lec__thumb-play">▶</span>
                    </span>
                    <span className="lec__meta">
                      <span className="lec__num">{item.num}</span>
                      <span className="lec__name">{item.name}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}