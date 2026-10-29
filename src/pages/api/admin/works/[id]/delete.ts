import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { deleteWork } from "../../../../../lib/db/adminWorks";

// 3단계에서 R2 객체 삭제를 여기에 더한다.
export const POST: APIRoute = async ({ params, redirect }) => {
  await deleteWork(env.DB, params.id ?? "");
  return redirect("/admin?deleted=1", 303);
};
