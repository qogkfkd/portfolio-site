import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { setWorkFlags } from "../../../../../lib/db/adminWorks";

// 관리자 목록의 공개·대표작 버튼(일반 HTML 폼)이 보낸다. 값은 "1" 또는 "0".
export const POST: APIRoute = async ({ params, request, redirect }) => {
  const form = await request.formData();
  const toFlag = (name: string) => {
    const value = form.get(name);
    return value === "1" ? true : value === "0" ? false : undefined;
  };
  await setWorkFlags(env.DB, params.id ?? "", { isPublic: toFlag("isPublic"), isFeatured: toFlag("isFeatured") }, new Date());
  return redirect("/admin", 303);
};
