import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { startUpload } from "../../../../lib/files/uploads";
import { jsonError, readJson } from "../../../../lib/http";

export const POST: APIRoute = async ({ request }) => {
  const result = await startUpload(env.DB, env.FILES, await readJson(request), new Date());
  if (!result.ok) return jsonError(result.status, result.errors);
  return Response.json(result.value, { status: 201 });
};
