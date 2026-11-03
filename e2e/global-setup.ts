import { execSync } from "node:child_process";
import cleanup from "./cleanup";

export default function globalSetup(): void {
  execSync("npm run db:migrate:local", { stdio: "pipe" });
  execSync("npm run db:seed:local", { stdio: "pipe" });
  cleanup();
}
