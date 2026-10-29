export interface ApiResult {
  ok: boolean;
  status: number;
  data: { id?: string; slug?: string; errors?: Record<string, string> } | null;
}

export async function sendJson(method: "POST" | "PUT", url: string, body: unknown): Promise<ApiResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
    const data = (await response.json().catch(() => null)) as ApiResult["data"];
    return { ok: response.ok, status: response.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

export function failureMessage(result: ApiResult): string {
  if (result.status === 400) return "입력 내용을 확인해 주세요.";
  if (result.status === 401) return "로그인이 풀렸어요. 새 창에서 다시 로그인한 뒤 저장해 주세요.";
  if (result.status === 404) return "작품을 찾을 수 없어요. 목록에서 다시 열어 주세요.";
  return "저장하지 못했어요. 잠시 후 다시 시도해 주세요.";
}
