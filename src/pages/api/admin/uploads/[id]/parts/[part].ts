import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { uploadPart } from "../../../../../../lib/files/uploads";
import { jsonError } from "../../../../../../lib/http";

export const PUT: APIRoute = async ({ params, request }) => {
  const result = await uploadPart(env.DB, env.FILES, params.id ?? "", Number(params.part), await request.arrayBuffer());
  if (!result.ok) return jsonError(result.status, result.errors);
  return Response.json(result.value);
};
