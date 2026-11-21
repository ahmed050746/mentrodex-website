"use client";

import { useCallback, useMemo, useState } from "react";
import { TESTIMONIAL_VIDEOS } from "@/content/testimonial-videos";
import { bunnyEmbedUrl } from "@/lib/bunny-embed";

type LayoutVariant = "mobile" | "desktop";

type Props = {
  layout: LayoutVariant;
};

export function TestimonialVideoSection({ layout }: Props) {
  const prefix = layout === "mobile" ? "m" : "d";
  const videos = TESTIMONIAL_VIDEOS;

  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(false);

  const active = videos[activeIndex] ?? videos[0];

  const embedSrc = useMemo(() => {
    if (!active?.bunny) return null;
    return bunnyEmbedUrl(active.bunny, { autoplay });
  }, [active?.bunny, autoplay]);

  const selectVideo = useCallback((index: number) => {
    const item = videos[index];
    setActiveIndex(index);
    setAutoplay(Boolean(item?.bunny && bunnyEmbedUrl(item.bunny)));
  }, [videos]);

  if (!active) return null;

  return (
    <section
      className={`${prefix}-testi testi-vswitch`}
      aria-labelledby={`${prefix}-testi-title`}
    >
      <div className={`${prefix}-testi__inner testi-vswitch__inner`}>
        <header className={`${prefix}-testi__head testi-vswitch__head`}>
          <span className={`${prefix}-testi__eyebrow`}>Social proof</span>
          <h2 id={`${prefix}-testi-title`} className={`${prefix}-testi__title`}>
            What Others Say
          </h2>
          <p className={`${prefix}-testi__sub`}>
            Hear from students &amp; professionals.
          </p>
        </header>

        <div className="testi-vswitch__layout">
          <div className="testi-vswitch__player">
            <div
              className="testi-vswitch__media"
              style={{ aspectRatio: "16 / 9" }}
            >
              {embedSrc ? (
                <iframe
                  key={`${active.id}-${autoplay ? "autoplay" : "ready"}`}
                  className="testi-vswitch__iframe"
                  src={embedSrc}
                  title={active.title}
                  loading="lazy"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : null}
            </div>

            <p className="testi-vswitch__now">
              <span className="testi-vswitch__now-label">Now playing</span>
              <span className="testi-vswitch__now-title">{active.title}</span>
            </p>

            <div className={`${prefix}-testi__body testi-vswitch__body`}>
              <h3 className={`${prefix}-testi__name`}>{active.name}</h3>
              <p className={`${prefix}-testi__role`}>{active.role}</p>
              <p className={`${prefix}-testi__quote`}>&ldquo;{active.quote}&rdquo;</p>
            </div>
          </div>

          <ol className="testi-vswitch__list">
            {videos.map((item, index) => {
              const selected = index === activeIndex;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`testi-vswitch__pick${selected ? " is-active" : ""}`}
                    aria-pressed={selected}
                    data-video={item.bunny}
                    onClick={() => selectVideo(index)}
                  >
                    <span className="testi-vswitch__pick-title">
                      {item.title}
                    </span>
                    <span className="testi-vswitch__pick-name">{item.name}</span>
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