// 스펙 5.2: 이미지는 브라우저에서 긴 변 2000px(표시용)과 600px(썸네일) WebP로 줄인다. 작으면 키우지 않는다. gif는 그대로.
export const DISPLAY_MAX = 2000;
export const THUMB_MAX = 600;

export interface ProcessedImage {
  main: Blob;
  thumb: Blob | null;
  contentType: string;
  name: string;
}

function resize(bitmap: ImageBitmap, maxSide: number): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("이미지를 줄이지 못했어요."))), "image/webp", 0.85),
  );
}

export async function processImage(file: File): Promise<ProcessedImage> {
  if (file.type === "image/gif") return { main: file, thumb: null, contentType: "image/gif", name: file.name };
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const main = await resize(bitmap, DISPLAY_MAX);
    const thumb = await resize(bitmap, THUMB_MAX);
    // WebP를 못 만드는 브라우저는 PNG를 돌려준다. 실제 형식으로 이름과 종류를 맞춘다.
    const extension = main.type === "image/webp" ? "webp" : "png";
    return { main, thumb, contentType: main.type, name: `${file.name.replace(/\.[^.]+$/, "")}.${extension}` };
  } finally {
    bitmap.close();
  }
}
