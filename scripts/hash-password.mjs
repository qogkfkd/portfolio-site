// 사용법: npm run hash-password (물어보는 칸에 비밀번호를 넣는다. 명령 기록에 비밀번호가 남지 않는다.)
// 결과를 .dev.vars 또는 `wrangler secret put ADMIN_PASSWORD_HASH`에 넣는다.
import { createInterface } from "node:readline/promises";
import { hashPassword } from "../src/lib/auth/password.ts";

let password = process.argv[2];
if (!password) {
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  password = await prompt.question("새 비밀번호(8자 이상): ");
  prompt.close();
}
if (!password || password.length < 8) {
  console.error("8자 이상의 비밀번호를 넣어 주세요.");
  process.exit(1);
}
console.log(await hashPassword(password));
