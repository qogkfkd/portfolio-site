# 홈 카드 대표 이미지 비율 수정 계획

> **이 프로젝트의 실행 방식:** 협업 규칙(`C:/Users/user/.codex-collab/RULES.md`)에 따라 Codex가 이 계획을 그대로 실행한다. 계획이 모호하거나 틀렸거나 같은 오류에 두 번 막히면 그 자리에서 멈추고 `collab/HANDOFF.md`에 적는다.

**Goal:** 세로로 긴 대표 이미지를 넣어도 홈의 작품 카드가 정해진 비율을 지키게 한다.

**문제:** `src/components/WorkCard.astro`의 `.cover`는 `aspect-ratio`만 있고 넘치는 부분을 자르지 않는다. 그래서 이미지가 세로로 길면 칸이 이미지 높이만큼 늘어난다. 1280px에서 칸 비율이 1.6이 아니라 0.59가 되고, 줄 높이가 411px에서 758px로 늘어나는 것을 쟀다.

**원인 확인:** 브라우저에서 `.cover { overflow: hidden }`을 임시로 넣으면 1280px와 375px 모두 비율이 1.6으로 돌아온다. 같은 구조의 `.gallery-item`은 이미 `overflow: hidden`이 있어서 문제가 없다.

## 실행 계약

- **기준:** `main` 브랜치에서 이 계획 파일을 커밋한 지점. 그 앞은 `0a1c05b`이다.
- **완료 기준(Codex 실행분):**
  1. `npm test`: `Test Files  24 passed (24)`, `Tests  134 passed (134)`
  2. `npm run check`: `0 errors`, `0 warnings`, `0 hints`
  3. `npm run build`: `Complete!`
  4. `collab/HANDOFF.md` 작성
- **완료 기준(Claude 리뷰분):** `npm run smoke`, 실제 브라우저에서 세로로 긴 대표 이미지의 카드 비율 측정, 커밋. Codex는 하지 않는다.
- **바꿔도 되는 파일:** `src/components/WorkCard.astro`, `collab/HANDOFF.md`. 이 목록 밖은 건드리지 않는다.
- **하지 않는 것:** `git add`, `git commit`, `git push`, `npm install`, `npm run dev`, `npm run smoke`, `wrangler login`, `wrangler deploy`, `--remote`. 다른 스타일이나 리팩터링도 하지 않는다.
- 저장소 밖 기본 경로에 쓸 수 없으면, 그 명령에서만 `npm_config_cache`와 `WRANGLER_LOG_PATH`를 임시 폴더로 지정한다.

## Task 1: `.cover`가 넘치는 부분을 자르게 한다

**Files:**
- Modify: `src/components/WorkCard.astro`
- Create: `collab/HANDOFF.md`(처음부터 다시 쓴다)

- [ ] **Step 1: 한 줄을 더한다**

`src/components/WorkCard.astro`의 `<style>` 안에서 이 블록을

```css
  .cover {
    aspect-ratio: 16 / 10;
    background: var(--surface);
  }
```

이렇게 바꾼다.

```css
  .cover {
    overflow: hidden;
    aspect-ratio: 16 / 10;
    background: var(--surface);
  }
```

`.card-large .cover`와 `.cover img`는 바꾸지 않는다.

- [ ] **Step 2: 검증한다**

```powershell
npm test
npm run check
npm run build
```

기대 결과는 실행 계약의 완료 기준과 같다. 자동 테스트의 `.text()` 경고 3건은 이전부터 있던 것이라 그대로 둔다.

- [ ] **Step 3: 인계를 쓴다**

`collab/HANDOFF.md`를 처음부터 다시 쓴다. 실행한 계획, 바꾼 파일, 명령별 종료 코드와 결과, 계획과 다른 점을 짧게 적는다. 커밋은 하지 않는다.
