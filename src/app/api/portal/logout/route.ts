import { portalJsonOk } from "@/lib/portal/errors";
import { clearPortalSessionOnResponse } from "@/lib/portal/session";

export async function POST() {
  const response = portalJsonOk({});
  clearPortalSessionOnResponse(response);
  return response;
}