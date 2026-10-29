// 로컬 개발 서버를 직접 띄워 방문자 화면을 점검하고 끈다.
// 먼저 `npm run db:migrate:local` 과 `npm run db:seed:local` 을 실행하고, .dev.vars를 준비해야 한다.
import { execFileSync, spawn } from "node:child_process";
import path from "node:path";

const port = Number(process.env.SMOKE_PORT ?? 4398);
const base = `http://localhost:${port}`;
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? "portfolio-dev-password";
const astroBin = path.resolve("node_modules/astro/bin/astro.mjs");
const server = spawn(process.execPath, [astroBin, "dev", "--port", String(port)], { stdio: "ignore" });

let passed = 0;
let failed = 0;

function check(name, ok, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`ok   ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function stopServer() {
  if (process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    } catch {
      // 이미 끝난 프로세스
    }
  } else {
    server.kill("SIGTERM");
  }
}

async function waitReady() {
  for (let i = 0; i < 90; i += 1) {
    try {
      await fetch(`${base}/`);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error("개발 서버가 90초 안에 뜨지 않았다");
}

async function get(pathname) {
  const res = await fetch(base + pathname);
  return { status: res.status, html: await res.text() };
}

function cards(html, list) {
  const slugs = [];
  for (const tag of html.match(/<article\b[^>]*>/g) ?? []) {
    const tagList = tag.match(/data-list="([^"]*)"/)?.[1];
    const slug = tag.match(/data-work="([^"]*)"/)?.[1];
    if (tagList === list && slug !== undefined) slugs.push(slug);
  }
  return slugs;
}

function metaContent(html, attr, value) {
  const tag = html.match(new RegExp(`<meta\\b[^>]*${attr}="${value}"[^>]*>`))?.[0];
  return tag?.match(/content="([^"]*)"/)?.[1] ?? null;
}

function h1(html) {
  return html.match(/<h1\b[^>]*>([^<]*)<\/h1>/)?.[1]?.trim() ?? null;
}

async function request(pathname, { method = "GET", cookie, origin = true, form, json } = {}) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (origin && method !== "GET") headers.Origin = base;
  let body;
  if (form) {
    body = new URLSearchParams(form).toString();
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }
  if (json !== undefined) {
    body = JSON.stringify(json);
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(base + pathname, { method, headers, body, redirect: "manual" });
  const html = await res.text();
  let data = null;
  try {
    data = JSON.parse(html);
  } catch {
    // HTML 응답
  }
  return { status: res.status, html, data, headers: res.headers };
}

const sessionCookie = (headers) => headers.getSetCookie().find((value) => value.startsWith("session=")) ?? "";

function workBody(title, extra = {}) {
  return {
    title,
    slug: "",
    summary: "",
    descriptionHtml: '<p>안녕<script>alert(1)</script><a href="javascript:alert(1)">링크</a></p>',
    fields: ["개발"],
    techs: [],
    links: [],
    competition: "",
    organizer: "",
    participatedOn: "",
    periodStart: "",
    periodEnd: "",
    award: "",
    teamType: "",
    teamSize: "",
    role: "",
    ...extra,
  };
}


const query = (params) => `/?${new URLSearchParams(params).toString()}`;
const workPath = (slug) => `/works/${encodeURIComponent(slug)}`;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const ALL = ["할-일-정리-앱", "캠퍼스-분실물-지도", "brand-identity", "졸업전시-포스터-시리즈", "지역-상권-데이터-분석", "메모-위젯"];

try {
  await waitReady();

  const home = await get("/");
  check("홈 200", home.status === 200, String(home.status));
  check("홈 이름", h1(home.html) === "홍길동", String(h1(home.html)));
  check("홈 og:title", metaContent(home.html, "property", "og:title") === "홍길동 | 포트폴리오");
  check(
    "대표작 순서",
    same(cards(home.html, "featured"), ["캠퍼스-분실물-지도", "지역-상권-데이터-분석"]),
    cards(home.html, "featured").join(","),
  );
  check("전체 작품 순서와 비공개 제외", same(cards(home.html, "all"), ALL), cards(home.html, "all").join(","));
  check("연도 선택지에 2023", home.html.includes('value="2023"'));

  const cases = [
    [{ field: "디자인" }, ["brand-identity", "졸업전시-포스터-시리즈"]],
    [{ year: "2024" }, ["졸업전시-포스터-시리즈", "지역-상권-데이터-분석"]],
    [{ award: "1" }, ["캠퍼스-분실물-지도", "brand-identity", "지역-상권-데이터-분석"]],
    [{ field: "기획", award: "1" }, ["캠퍼스-분실물-지도", "지역-상권-데이터-분석"]],
    [{ year: "abcd" }, ALL],
  ];
  for (const [params, want] of cases) {
    const page = await get(query(params));
    const got = cards(page.html, "all");
    check(`걸러 보기 ${JSON.stringify(params)}`, page.status === 200 && same(got, want), got.join(","));
  }

  const none = await get(query({ field: "없는분야" }));
  check("조건 불일치 안내", cards(none.html, "all").length === 0 && none.html.includes("조건에 맞는 작품이 없어요."));

  const campus = await get(workPath("캠퍼스-분실물-지도"));
  check(
    "상세 200 (한글 주소)",
    campus.status === 200 && h1(campus.html) === "캠퍼스 분실물 지도",
    `${campus.status} ${h1(campus.html)}`,
  );
  check("상세 og:title", metaContent(campus.html, "property", "og:title") === "캠퍼스 분실물 지도 | 홍길동");
  check(
    "상세 정보 항목",
    ["2025.08.23", "팀 (4명)", "대상", "2025 대학생 해커톤"].every((text) => campus.html.includes(text)),
  );
  check("유튜브 퍼가기", campus.html.includes("https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ"));

  const todo = await get(workPath("할-일-정리-앱"));
  check(
    "요약이 없으면 설명 앞부분",
    (metaContent(todo.html, "name", "description") ?? "").startsWith("매일 할 일을 세 가지만"),
  );

  const memo = await get(workPath("메모-위젯"));
  check(
    "빈 선택 항목은 표시하지 않음",
    memo.status === 200 && !memo.html.includes("<dt") && !memo.html.includes("<iframe"),
  );

  const hidden = await get(workPath("private-draft"));
  check("비공개 작품 404", hidden.status === 404, String(hidden.status));

  const missing = await get(workPath("없는-작품"));
  check(
    "없는 작품 404 안내",
    missing.status === 404 && h1(missing.html) === "페이지를 찾을 수 없어요",
    `${missing.status} ${h1(missing.html)}`,
  );

  // ---- 2단계: 로그인과 작품 관리 ----
  const guarded = await request("/admin");
  check(
    "관리자 화면은 로그인으로 보낸다",
    guarded.status === 302 && guarded.headers.get("location") === "/admin/login",
    `${guarded.status} ${guarded.headers.get("location")}`,
  );
  const loginPage = await request("/admin/login");
  check("로그인 화면 noindex", loginPage.status === 200 && loginPage.headers.get("x-robots-tag") === "noindex");
  const wrong = await request("/admin/login", { method: "POST", form: { password: "wrong-password" } });
  check("틀린 비밀번호 401", wrong.status === 401 && wrong.html.includes("비밀번호가 맞지 않아요."), String(wrong.status));
  const foreign = await request("/admin/login", { method: "POST", origin: false, form: { password: ADMIN_PASSWORD } });
  check("Origin 없는 로그인 403", foreign.status === 403, String(foreign.status));
  const login = await request("/admin/login", { method: "POST", form: { password: ADMIN_PASSWORD } });
  const setCookie = sessionCookie(login.headers);
  check(
    "맞는 비밀번호로 로그인",
    login.status === 303 &&
      login.headers.get("location") === "/admin" &&
      /HttpOnly/i.test(setCookie) &&
      /SameSite=Strict/i.test(setCookie),
    `${login.status} ${setCookie}`,
  );
  const cookie = setCookie.split(";")[0];

  const list = await request("/admin", { cookie });
  check(
    "목록에 비공개 작품도 보인다",
    list.status === 200 && list.html.includes("비공개 초안 작품") && list.headers.get("x-robots-tag") === "noindex",
  );
  check("API: 로그인 없으면 401", (await request("/api/admin/works", { method: "POST", json: workBody("x") })).status === 401);
  check(
    "API: Origin 없으면 403",
    (await request("/api/admin/works", { method: "POST", cookie, origin: false, json: workBody("x") })).status === 403,
  );
  const invalid = await request("/api/admin/works", { method: "POST", cookie, json: workBody("") });
  check(
    "API: 작품명 없으면 400",
    invalid.status === 400 && invalid.data?.errors?.title === "작품명을 입력해 주세요.",
    JSON.stringify(invalid.data),
  );

  const created = await request("/api/admin/works", { method: "POST", cookie, json: workBody("스모크 테스트 작품") });
  check(
    "작품 만들기 201과 한글 주소",
    created.status === 201 && created.data?.slug === "스모크-테스트-작품",
    JSON.stringify(created.data),
  );
  const firstId = created.data?.id;
  const smokePath = workPath("스모크-테스트-작품");
  check("새 작품은 방문자에게 404", (await request(smokePath)).status === 404);
  const preview = await request(smokePath, { cookie });
  check("관리자는 비공개 미리보기", preview.status === 200 && preview.html.includes("비공개 미리보기"));
  check("설명의 script와 javascript: 링크 제거", preview.html.includes("안녕") && !preview.html.includes("alert(1)"));
  const publish = await request(`/api/admin/works/${firstId}/flags`, { method: "POST", cookie, form: { isPublic: "1" } });
  check("공개 전환 후 목록으로", publish.status === 303 && publish.headers.get("location") === "/admin");
  const published = await request(smokePath);
  check("공개하면 방문자에게 보인다", published.status === 200 && !published.html.includes("비공개 미리보기"));

  const second = await request("/api/admin/works", { method: "POST", cookie, json: workBody("스모크 테스트 작품") });
  check(
    "같은 이름이면 주소에 -2",
    second.status === 201 && second.data?.slug === "스모크-테스트-작품-2",
    JSON.stringify(second.data),
  );
  const clash = await request(`/api/admin/works/${firstId}`, {
    method: "PUT",
    cookie,
    json: workBody("스모크 테스트 작품", { slug: "스모크-테스트-작품-2" }),
  });
  check(
    "다른 작품 주소로 바꾸면 400",
    clash.status === 400 && clash.data?.errors?.slug === "이미 쓰고 있는 주소예요.",
    JSON.stringify(clash.data),
  );
  const renamed = await request(`/api/admin/works/${firstId}`, {
    method: "PUT",
    cookie,
    json: workBody("스모크 수정 작품", { slug: "스모크-수정" }),
  });
  check("작품 수정 200", renamed.status === 200 && renamed.data?.slug === "스모크-수정", JSON.stringify(renamed.data));
  check("수정한 주소로 열린다", (await request(workPath("스모크-수정"))).status === 200);
  const pages = await Promise.all(
    ["/admin/works/new", "/admin/profile", `/admin/works/${firstId}/edit`].map((pathname) => request(pathname, { cookie })),
  );
  check(
    "관리자 페이지 열림(새 작품, 자기소개, 수정)",
    pages.every((page) => page.status === 200),
    pages.map((page) => page.status).join(","),
  );
  for (const workId of [firstId, second.data?.id]) {
    await request(`/api/admin/works/${workId}/delete`, { method: "POST", cookie });
  }
  check("삭제하면 404", (await request(workPath("스모크-수정"))).status === 404);

  const badProfile = await request("/api/admin/profile", {
    method: "PUT",
    cookie,
    json: { name: "", headline: "", bio: "", email: "", githubUrl: "", links: [] },
  });
  check("자기소개 이름 없으면 400", badProfile.status === 400 && badProfile.data?.errors?.name === "이름을 입력해 주세요.");
  const goodProfile = await request("/api/admin/profile", {
    method: "PUT",
    cookie,
    json: {
      name: "홍길동",
      headline: "만들고 기록하는 개발자이자 디자이너",
      bio: "대회와 프로젝트에서 만든 작업을 모았습니다. 새로운 문제를 함께 풀 팀을 찾고 있어요.",
      email: "hello@example.com",
      githubUrl: "https://github.com/example",
      links: [{ label: "블로그", url: "https://example.com" }],
    },
  });
  check("자기소개 저장 200", goodProfile.status === 200 && goodProfile.data?.name === "홍길동");

  const robots = await request("/robots.txt");
  check("robots.txt가 /admin을 막는다", robots.status === 200 && robots.html.includes("Disallow: /admin"));
  const logout = await request("/api/admin/logout", { method: "POST", cookie });
  const cleared = sessionCookie(logout.headers);
  check(
    "로그아웃하면 쿠키를 지운다",
    logout.status === 303 &&
      logout.headers.get("location") === "/admin/login" &&
      /(Max-Age=0|Expires=Thu, 01 Jan 1970)/i.test(cleared),
    cleared,
  );
} finally {
  stopServer();
}

console.log(`smoke: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
