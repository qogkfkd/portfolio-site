// 칸을 고치면 그 칸(과 links.0 같은 하위 칸)의 오류를 지운다.
export function withoutError(errors: Record<string, string>, key: string): Record<string, string> {
  const next = Object.fromEntries(Object.entries(errors).filter(([name]) => name !== key && !name.startsWith(`${key}.`)));
  return Object.keys(next).length === Object.keys(errors).length ? errors : next;
}
