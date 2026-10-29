import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createWork } from "../../../../lib/db/adminWorks";
import { sanitizeHtml } from "../../../../lib/html/sanitize";
import { jsonError, readJson } from "../../../../lib/http";
import { validateWorkInput } from "../../../../lib/validate/work";

export const POST: APIRoute = async ({ request }) => {
  const result = validateWorkInput(await readJson(request));
  if (!result.ok) return jsonError(400, result.errors);
  const draft = { ...result.value, descriptionHtml: await sanitizeHtml(result.value.descriptionHtml) };
  const saved = await createWork(env.DB, draft, new Date());
  if (!saved.ok) return jsonError(saved.status, saved.errors);
  return Response.json({ id: saved.work.id, slug: saved.work.slug }, { status: 201 });
};
