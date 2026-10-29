// 사용법: npm run hash-password -- "비밀번호"
// 결과를 .dev.vars 또는 `wrangler secret put ADMIN_PASSWORD_HASH`에 넣는다.
import { hashPassword } from "../src/lib/auth/password.ts";

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('8자 이상의 비밀번호를 넣어 주세요. 예: npm run hash-password -- "비밀번호"');
  process.exit(1);
}
console.log(await hashPassword(password));
