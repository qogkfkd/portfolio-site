import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { serveFile } from "../../../lib/files/serve";

// 스펙 5.4. 주소의 파일 이름은 보기용이고, 파일은 id로 찾는다.
export const GET: APIRoute = async ({ params, request, locals }) =>
  serveFile(env.DB, env.FILES, request, params.id ?? "", locals.isAdmin);
