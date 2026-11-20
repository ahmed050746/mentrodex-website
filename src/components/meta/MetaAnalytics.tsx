"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { createMetaEventId, trackMetaEvent } from "@/lib/metaTracking";

const WA_NUMBER = "923293412618";

/** Survives Strict Mode remount so PageView is not sent twice with different event_ids. */
let lastPageViewUrlModule: string | null = null;

function openWhatsApp(text: string) {
  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function MetaAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const eventSourceUrl = window.location.href;
    if (
      lastTrackedUrlRef.current === eventSourceUrl ||
      lastPageViewUrlModule === eventSourceUrl
    ) {
      lastTrackedUrlRef.current = eventSourceUrl;
      return;
    }
    lastTrackedUrlRef.current = eventSourceUrl;
    lastPageViewUrlModule = eventSourceUrl;

    const eventId = createMetaEventId();
    void trackMetaEvent("PageView", { eventId, eventSourceUrl });
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const waLink = target.closest('a[href*="wa.me"]');
      if (waLink instanceof HTMLAnchorElement) {
        const eventId = createMetaEventId();
        const eventSourceUrl = window.location.href;
        trackMetaEvent("Lead", {
          eventId,
          eventSourceUrl,
          customData: { content_name: "WhatsApp link" },
        });
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    const toggle = document.getElementById("fabWaToggle");
    const panel = document.getElementById("fabWaPanel");
    const closeBtn = document.getElementById("fabWaClose");
    const sendBtn = document.getElementById("fabWaSend");
    const messageEl = document.getElementById("fabWaMessage") as
      | HTMLTextAreaElement
      | null;

    if (!toggle || !panel) return;

    const setPanelOpen = (open: boolean) => {
      if (open) {
        panel.removeAttribute("hidden");
        toggle.setAttribute("aria-expanded", "true");
      } else {
        panel.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", "false");
      }
    };

    const onToggle = () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      setPanelOpen(!isOpen);
    };

    const onClose = () => setPanelOpen(false);

    const onSend = () => {
      const text =
        messageEl?.value.trim() ||
        "Hi, I'd like to know more about the AI Web Crafts e-commerce mentorship (Rs. 4,500).";
      const eventId = createMetaEventId();
      const eventSourceUrl = window.location.href;
      trackMetaEvent("Lead", {
        eventId,
        eventSourceUrl,
        customData: { content_name: "WhatsApp FAB send" },
      });
      openWhatsApp(text);
      setPanelOpen(false);
    };

    toggle.addEventListener("click", onToggle);
    closeBtn?.addEventListener("click", onClose);
    sendBtn?.addEventListener("click", onSend);

    return () => {
      toggle.removeEventListener("click", onToggle);
      closeBtn?.removeEventListener("click", onClose);
      sendBtn?.removeEventListener("click", onSend);
    };
  }, [pathname]);

  return null;
}