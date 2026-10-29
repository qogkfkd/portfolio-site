// 로컬 개발 서버를 직접 띄워 방문자 화면을 점검하고 끈다.
// 먼저 `npm run db:migrate:local` 과 `npm run db:seed:local` 을 실행해야 한다.
import { execFileSync, spawn } from "node:child_process";
import path from "node:path";

const port = Number(process.env.SMOKE_PORT ?? 4398);
const base = `http://localhost:${port}`;
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
} finally {
  stopServer();
}

console.log(`smoke: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
