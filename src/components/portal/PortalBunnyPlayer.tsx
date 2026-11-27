"use client";

import { useEffect, useRef, useState } from "react";
import { bunnyEmbedUrl } from "@/lib/bunny-embed";
import { extractBunnyRefForStorage } from "@/lib/portal/bunnyInput";
import styles from "./portal.module.css";

const PLAYERJS_SRC =
  "https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js";

/** Lesson counts as completed after this fraction of runtime (75%). */
const WATCH_COMPLETE_FRACTION = 0.75;

type Props = {
  bunnyRef: string;
  title: string;
  lessonId: string;
  onAutoComplete?: () => void;
};

function loadPlayerJs(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.playerjs?.Player) return Promise.resolve();

  const existing = document.querySelector(
    `script[src="${PLAYERJS_SRC}"]`,
  ) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve) => {
      if (window.playerjs?.Player) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PLAYERJS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Player.js failed to load"));
    document.head.appendChild(script);
  });
}

export function PortalBunnyPlayer({
  bunnyRef,
  title,
  lessonId,
  onAutoComplete,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const autoCompleteOnceRef = useRef<string | null>(null);
  const onAutoCompleteRef = useRef(onAutoComplete);
  useEffect(() => {
    onAutoCompleteRef.current = onAutoComplete;
  }, [onAutoComplete]);

  const [playerJsReady, setPlayerJsReady] = useState(false);

  const normalized =
    extractBunnyRefForStorage(bunnyRef) ?? bunnyRef.trim();
  const embedSrc = bunnyEmbedUrl(normalized, {
    autoplay: true,
    preload: true,
    muted: true,
  });

  useEffect(() => {
    let cancelled = false;
    void loadPlayerJs()
      .then(() => {
        if (!cancelled) setPlayerJsReady(true);
      })
      .catch(() => {
        /* playback still works; ended auto-complete may not */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    autoCompleteOnceRef.current = null;
  }, [lessonId, embedSrc]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!playerJsReady || !iframe || !embedSrc || !window.playerjs?.Player) {
      return;
    }

    let onMessage: EventListener = () => {};
    const playerjs = window.playerjs;
    const addEvent = playerjs.addEvent;
    playerjs.addEvent = (elem, type, handler) =>
      addEvent(elem, type, (onMessage = handler));

    const player = new playerjs.Player(iframe);
    playerjs.addEvent = addEvent;

    const tryAutoComplete = () => {
      if (autoCompleteOnceRef.current === lessonId) return;
      autoCompleteOnceRef.current = lessonId;
      onAutoCompleteRef.current?.();
    };

    const handleTimeUpdate: (data?: unknown) => void = (data) => {
      if (!data || typeof data !== "object") return;
      const { seconds, duration } = data as {
        seconds?: unknown;
        duration?: unknown;
      };
      if (
        typeof seconds !== "number" ||
        typeof duration !== "number" ||
        duration <= 0
      ) {
        return;
      }
      if (seconds / duration >= WATCH_COMPLETE_FRACTION) {
        tryAutoComplete();
      }
    };

    const handleEnded = () => {
      tryAutoComplete();
    };

    player.on("timeupdate", handleTimeUpdate);
    player.on("ended", handleEnded);

    return () => {
      window.removeEventListener("message", onMessage);
      if (player.off) {
        player.off("timeupdate", handleTimeUpdate);
        player.off("ended", handleEnded);
      }
    };
  }, [playerJsReady, embedSrc, lessonId]);

  if (!embedSrc) {
    return (
      <div className={styles.videoError} role="alert">
        <p>
          This lesson’s video link could not be loaded. Ask your instructor to
          paste the Bunny embed URL or iframe in admin, then save the lesson
          again.
        </p>
        <p className={styles.videoErrorHint}>
          Stored value: <code>{bunnyRef.slice(0, 120)}</code>
          {bunnyRef.length > 120 ? "…" : ""}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.videoFrame}>
      <iframe
        ref={iframeRef}
        key={lessonId}
        src={embedSrc}
        title={title}
        loading="lazy"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  );
}