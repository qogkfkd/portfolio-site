import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";
import { isAdminPath, isSameOrigin } from "./lib/auth/request";
import { SESSION_COOKIE, verifySessionToken } from "./lib/auth/session";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  context.locals.isAdmin = await verifySessionToken(env.SESSION_SECRET, context.cookies.get(SESSION_COOKIE)?.value);

  if (!isAdminPath(pathname)) return next();

  if (!SAFE_METHODS.has(context.request.method) && !isSameOrigin(context.request)) {
    return new Response("Forbidden", { status: 403, headers: { "X-Robots-Tag": "noindex" } });
  }
  if (pathname !== "/admin/login" && !context.locals.isAdmin) {
    if (pathname.startsWith("/api/")) {
      return Response.json({ error: "로그인이 필요해요." }, { status: 401, headers: { "X-Robots-Tag": "noindex" } });
    }
    return context.redirect("/admin/login");
  }
  const response = await next();
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
});
