# 작품 분류와 관련 파일 보기 구현 계획

> **이 프로젝트의 실행 방식:** 협업 규칙(`C:/Users/user/.codex-collab/RULES.md`)에 따라 Codex가 이 계획을 그대로 실행한다. 계획이 틀렸거나 같은 오류에 두 번 막히면 그 자리에서 멈추고 `collab/HANDOFF.md`에 적는다. 사용자는 2026-11-03에 A안과 배지 이름 "AI 협업"을 고르고 이 작업의 진행을 승인했다.

**Goal:** 작품을 직접 코딩과 AI 협업으로 구분해 보여 주고, 대표작은 수상작을 먼저 내며, PDF와 이미지 첨부파일을 브라우저에서 바로 볼 수 있게 한다.

**Spec:** `docs/superpowers/specs/2026-11-03-work-classification-design.md`

**코드:** 전체 변경은 같은 폴더의 `2026-11-03-work-classification.patch`에 있다. Claude가 복제본에서 만들어 검증한 것이다. 내용을 고치지 말고 그대로 적용한다.

## 실행 계약

- **기준:** `main` 브랜치에서 이 계획 파일을 커밋한 지점.
- **잠금 파일:** `.codex-collab.lock`은 Claude가 이 Codex 실행을 위해 잡아 둔 잠금이다. 있는 것이 정상이고, 독점 상태라 읽을 수 없는 것도 정상이다. 다른 작성자는 없으니 잠금을 이유로 멈추지 말고, 읽거나 건드리지도 말고 진행한다.
- **완료 기준(Codex 실행분):**
  1. `npx playwright test --list`: `Total: 20 tests in 4 files`
  2. `npm test`: `Test Files  24 passed (24)`, `Tests  145 passed (145)`
  3. `npm run check`: `0 errors`, `0 warnings`, `0 hints`
  4. `npm run build`: `Complete!`
  5. `collab/HANDOFF.md` 작성
- **완료 기준(Claude 리뷰분):** `npm run smoke`의 `smoke: 59 passed, 0 failed`, `npm run e2e`의 `20 passed`, 복제본과 파일 대조, 커밋.
- **바꿔도 되는 파일:** 패치에 든 파일과 `collab/HANDOFF.md`만. 이 목록 밖은 건드리지 않는다.
- **하지 않는 것:** 패치 수정, `git add`, `git commit`, `git push`, `npm install`, `npm run dev`, `npm run preview`, `npm run smoke`, `npm run e2e`, `wrangler login`, `wrangler deploy`, `--remote`. 시험이 실패해도 코드를 고치지 말고 멈춘다.
- 저장소 밖 기본 경로에 쓸 수 없으면, 그 명령에서만 `npm_config_cache`와 `WRANGLER_LOG_PATH`를 임시 폴더로 지정한다.

## Task 1: 패치를 적용하고 검증한다

**Files:** 패치에 든 29개 파일(새 파일 `migrations/0002_dev_method.sql`, `src/components/DevMethodBadge.astro`, `e2e/classify.spec.ts` 포함), `collab/HANDOFF.md`

- [ ] **Step 1: 패치를 적용한다**

```powershell
git apply --ignore-whitespace --whitespace=nowarn docs/superpowers/plans/2026-11-03-work-classification.patch
git status --short
```

기대 결과: 첫 명령은 출력 없이 종료 코드 0이다. 두 번째 명령에 패치의 파일들이 나온다.

- [ ] **Step 2: 검증한다**

```powershell
npx playwright test --list
npm test
npm run check
npm run build
```

기대 결과는 실행 계약의 완료 기준과 같다. 자동 테스트의 `.text()` 경고는 이전부터 있던 것이라 그대로 둔다.

- [ ] **Step 3: 인계를 쓴다**

`collab/HANDOFF.md`를 처음부터 다시 쓴다. 실행한 계획, 바뀐 파일 수, 명령별 종료 코드와 결과, 계획과 다른 점, 미실행 항목을 짧게 적는다. 커밋은 하지 않는다.
