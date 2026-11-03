import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { moveGalleryFile } from "../../../../../lib/files/uploads";
import { jsonError, readJson } from "../../../../../lib/http";

export const POST: APIRoute = async ({ params, request }) => {
  const body = (await readJson(request)) as { direction?: unknown } | null;
  if (body?.direction !== "up" && body?.direction !== "down") return jsonError(400, { file: "옮길 방향이 올바르지 않아요." });
  const result = await moveGalleryFile(env.DB, params.id ?? "", body.direction);
  if (!result.ok) return jsonError(result.status, result.errors);
  return Response.json({ ok: true });
};
