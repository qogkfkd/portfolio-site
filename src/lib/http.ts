export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function jsonError(status: number, errors: Record<string, string>): Response {
  return Response.json({ errors }, { status });
}

export const SERVER_ERROR_MESSAGE = "저장하지 못했어요. 잠시 후 다시 시도해 주세요.";
