import { execSync } from "node:child_process";

// 시험 데이터만 지운다. 로컬 DB만 건드린다.
const SQL = [
  "DELETE FROM files WHERE work_id IN (SELECT id FROM works WHERE title LIKE 'E2E %')",
  "DELETE FROM works WHERE title LIKE 'E2E %'",
  "DELETE FROM login_attempts",
].join("; ");

export default function cleanup(): void {
  execSync(`npx wrangler d1 execute DB --local --command "${SQL}"`, { stdio: "pipe" });
}
