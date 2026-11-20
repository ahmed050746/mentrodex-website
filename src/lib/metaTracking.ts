export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1395419915853207";

/** Non-empty test code from override or `NEXT_PUBLIC_META_TEST_EVENT_CODE`. */
export function resolveMetaTestEventCode(
  override?: string | null,
): string | undefined {
  const explicit = override?.trim();
  if (explicit) return explicit;
  const fromEnv = process.env.NEXT_PUBLIC_META_TEST_EVENT_CODE?.trim();
  return fromEnv || undefined;
}

export type MetaUserDataInput = {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export type MetaTrackOptions = {
  eventId?: string;
  eventSourceUrl?: string;
  userData?: MetaUserDataInput;
  customData?: Record<string, unknown>;
  testEventCode?: string;
};

declare global {
  interface Window {
    fbq?: (
      command: string,
      eventName: string,
      customData?: Record<string, unknown>,
      options?: { eventID?: string },
    ) => void;
  }
}

export function createMetaEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function trackMetaEvent(
  eventName: string,
  options: MetaTrackOptions = {},
): Promise<string> {
  const eventId = options.eventId ?? createMetaEventId();
  const customData = options.customData ?? {};
  const eventSourceUrl =
    options.eventSourceUrl ??
    (typeof window !== "undefined" ? window.location.href : undefined);

  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", eventName, customData, { eventID: eventId });
  }

  const testEventCode = resolveMetaTestEventCode(options.testEventCode);

  const payload: Record<string, unknown> = {
    event_name: eventName,
    event_id: eventId,
    event_source_url: eventSourceUrl,
    user_data: options.userData,
    custom_data: Object.keys(customData).length ? customData : undefined,
  };
  if (testEventCode) {
    payload.test_event_code = testEventCode;
  }

  try {
    await fetch("/api/meta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // CAPI is best-effort; browser pixel already fired.
  }

  return eventId;
}