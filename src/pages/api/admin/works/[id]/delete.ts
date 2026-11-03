import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { deleteWorkWithFiles } from "../../../../../lib/files/uploads";

export const POST: APIRoute = async ({ params, redirect }) => {
  await deleteWorkWithFiles(env.DB, env.FILES, params.id ?? "");
  return redirect("/admin?deleted=1", 303);
};
