import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { updateProfile } from "../../../lib/db/profile";
import { jsonError, readJson } from "../../../lib/http";
import { validateProfileInput } from "../../../lib/validate/profile";

export const PUT: APIRoute = async ({ request }) => {
  const result = validateProfileInput(await readJson(request));
  if (!result.ok) return jsonError(400, result.errors);
  const profile = await updateProfile(env.DB, result.value, new Date());
  return Response.json({ name: profile.name });
};
