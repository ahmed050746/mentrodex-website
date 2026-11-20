"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackMetaEvent } from "@/lib/metaTracking";

const WA_NUMBER = "923293412618";

function openWhatsApp(text: string) {
  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function MetaAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPageKey = useRef<string | null>(null);

  useEffect(() => {
    const query = searchParams.toString();
    const pageKey = query ? `${pathname}?${query}` : pathname;
    if (lastPageKey.current === pageKey) return;
    lastPageKey.current = pageKey;

    void trackMetaEvent("PageView");
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const waLink = target.closest('a[href*="wa.me"]');
      if (waLink instanceof HTMLAnchorElement) {
        void trackMetaEvent("Contact", {
          customData: { content_name: "WhatsApp link" },
        });
        return;
      }

      const telLink = target.closest('a[href^="tel:"]');
      if (telLink instanceof HTMLAnchorElement) {
        void trackMetaEvent("Contact", {
          customData: { content_name: "Phone call link" },
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
      void trackMetaEvent("Contact", {
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