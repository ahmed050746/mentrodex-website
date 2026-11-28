"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TESTIMONIAL_VIDEOS } from "@/content/testimonial-videos";
import { bunnyEmbedUrl } from "@/lib/bunny-embed";
import type { TestimonialVideoItem } from "@/content/testimonial-videos";
import { useBunnyThumbnails } from "@/hooks/useBunnyThumbnails";

type LayoutVariant = "mobile" | "desktop";

type Props = {
  layout: LayoutVariant;
};

export function TestimonialVideoSection({ layout }: Props) {
  const isDesktop = layout === "desktop";
  const prefix = isDesktop ? "d" : "m";
  const videos = TESTIMONIAL_VIDEOS;

  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const active = videos[activeIndex] ?? videos[0];
  const bunnyThumbs = useBunnyThumbnails(videos.map((v) => v.bunny));

  const inlineEmbedSrc = useMemo(() => {
    if (isDesktop || !autoplay || !active?.bunny) return null;
    return bunnyEmbedUrl(active.bunny, {
      autoplay: true,
      preload: true,
      muted: true,
    });
  }, [active?.bunny, autoplay, isDesktop]);

  const inlinePoster = useMemo(() => {
    if (isDesktop || autoplay) return null;
    const staticPoster = active?.thumbnail?.trim();
    const bunnyPoster = active?.bunny
      ? bunnyThumbs[active.bunny]
      : undefined;
    return staticPoster || bunnyPoster || null;
  }, [isDesktop, autoplay, active, bunnyThumbs]);

  const modalEmbedSrc = useMemo(() => {
    if (!modalOpen || !isDesktop || !active?.bunny) return null;
    return bunnyEmbedUrl(active.bunny, { autoplay: true });
  }, [modalOpen, isDesktop, active?.bunny, active?.id]);

  const selectVideo = useCallback(
    (index: number) => {
      const item = videos[index];
      setActiveIndex(index);
      if (isDesktop) {
        if (item?.bunny && bunnyEmbedUrl(item.bunny)) {
          setModalOpen(true);
        }
      } else {
        setAutoplay(Boolean(item?.bunny && bunnyEmbedUrl(item.bunny)));
      }
    },
    [isDesktop, videos],
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [modalOpen, closeModal]);

  if (!active) return null;

  return (
    <section
      className={`${prefix}-testi testi-vswitch${isDesktop ? " testi-vswitch--desktop-list-only" : ""}`}
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
          {!isDesktop ? (
            <div className="testi-vswitch__player">
              <div
                className="testi-vswitch__media"
                style={{ aspectRatio: "16 / 9" }}
              >
                {inlineEmbedSrc ? (
                  <iframe
                    key={active.id}
                    className="testi-vswitch__iframe"
                    src={inlineEmbedSrc}
                    title={active.title}
                    loading="lazy"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                ) : inlinePoster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={inlinePoster}
                    alt={active.title}
                    className="testi-vswitch__iframe testi-vswitch__inline-poster"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span
                    className="testi-vswitch__pick-poster testi-vswitch__pick-poster--loading"
                    aria-hidden="true"
                  />
                )}
              </div>

              <div className={`${prefix}-testi__body testi-vswitch__body`}>
                <h3 className={`${prefix}-testi__name`}>{active.name}</h3>
                <p className={`${prefix}-testi__role`}>{active.role}</p>
                <p className={`${prefix}-testi__quote`}>
                  &ldquo;{active.quote}&rdquo;
                </p>
              </div>
            </div>
          ) : null}

          <ol className="testi-vswitch__list">
            {videos.map((item, index) => {
              const selected = index === activeIndex;
              const staticPoster = item.thumbnail?.trim() || null;
              const bunnyPoster = bunnyThumbs[item.bunny] || null;
              const previewSrc = staticPoster || bunnyPoster || null;
              const showMedia = Boolean(
                previewSrc || (item.bunny && bunnyEmbedUrl(item.bunny)),
              );
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`testi-vswitch__pick${selected ? " is-active" : ""}${showMedia ? " testi-vswitch__pick--has-thumb" : ""}`}
                    aria-pressed={selected}
                    aria-label={!isDesktop ? item.title : undefined}
                    data-video={item.bunny}
                    onClick={() => selectVideo(index)}
                  >
                    {showMedia ? (
                      <span
                        className="testi-vswitch__pick-thumb"
                        style={{ aspectRatio: "16 / 9" }}
                      >
                        {previewSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewSrc}
                            alt={item.title}
                            className="testi-vswitch__pick-poster"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <span
                            className="testi-vswitch__pick-poster testi-vswitch__pick-poster--loading"
                            aria-hidden="true"
                          />
                        )}
                        <span
                          className="testi-vswitch__pick-play"
                          aria-hidden="true"
                        >
                          <span className="lec__thumb-play">▶</span>
                        </span>
                      </span>
                    ) : null}
                    {isDesktop ? (
                      <span className="testi-vswitch__pick-copy">
                        <span className="testi-vswitch__pick-title">
                          {item.title}
                        </span>
                        <span className="testi-vswitch__pick-name">
                          {item.name}
                        </span>
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {isDesktop ? (
        <div
          className="testi-vswitch-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="testi-vswitch-modal-title"
          hidden={!modalOpen}
        >
          <button
            type="button"
            className="testi-vswitch-modal__backdrop"
            aria-label="Close video"
            onClick={closeModal}
          />
          <div className="testi-vswitch-modal__dialog">
            <header className="testi-vswitch-modal__head">
              <h3 id="testi-vswitch-modal-title" className="testi-vswitch-modal__title">
                {active.title}
              </h3>
              <button
                type="button"
                className="testi-vswitch-modal__close"
                aria-label="Close"
                onClick={closeModal}
              >
                ×
              </button>
            </header>
            <div
              className="testi-vswitch-modal__media"
              style={{ aspectRatio: "16 / 9" }}
            >
              {modalEmbedSrc ? (
                <iframe
                  key={active.id}
                  className="testi-vswitch-modal__iframe"
                  src={modalEmbedSrc}
                  title={active.title}
                  loading="lazy"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : null}
            </div>
            <p className="testi-vswitch-modal__meta">
              <span className="testi-vswitch-modal__name">{active.name}</span>
              <span className="testi-vswitch-modal__role">{active.role}</span>
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}