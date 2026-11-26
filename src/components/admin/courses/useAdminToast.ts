"use client";

import { useCallback, useState } from "react";

export type ToastItem = {
  id: number;
  message: string;
  tone: "success" | "error";
};

export function useAdminToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((message: string, tone: ToastItem["tone"]) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, pushToast, dismissToast };
}