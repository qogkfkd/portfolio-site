import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { completeUpload } from "../../../../../lib/files/uploads";
import { jsonError, readJson } from "../../../../../lib/http";

export const POST: APIRoute = async ({ params, request }) => {
  const body = (await readJson(request)) as { parts?: unknown } | null;
  const result = await completeUpload(env.DB, env.FILES, params.id ?? "", body?.parts);
  if (!result.ok) return jsonError(result.status, result.errors);
  return Response.json({ file: result.value });
};
