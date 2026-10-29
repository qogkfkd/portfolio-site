declare namespace App {
  interface Locals {
    isAdmin: boolean;
  }
}

declare namespace Cloudflare {
  interface Env {
    ADMIN_PASSWORD_HASH: string;
    SESSION_SECRET: string;
  }
}
