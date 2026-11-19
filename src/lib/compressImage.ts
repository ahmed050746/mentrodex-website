const DEFAULT_MAX_EDGE = 1600;
const DEFAULT_QUALITY = 0.82;
const TARGET_MAX_BYTES = 900 * 1024;

export type CompressResult = {
  file: File;
  originalBytes: number;
  compressedBytes: number;
};

function scaleDimensions(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / width, maxEdge / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function canvasToJpegBlob(
  source: CanvasImageSource,
  width: number,
  height: number,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not compress image.");
  ctx.drawImage(source, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
  if (!blob) throw new Error("Could not compress image.");
  return blob;
}

export async function compressImageFile(file: File): Promise<CompressResult> {
  const originalBytes = file.size;
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Invalid image file."));
      el.src = objectUrl;
    });

    const { width, height } = scaleDimensions(
      img.naturalWidth,
      img.naturalHeight,
      DEFAULT_MAX_EDGE,
    );

    let quality = DEFAULT_QUALITY;
    let blob = await canvasToJpegBlob(img, width, height, quality);

    while (blob.size > TARGET_MAX_BYTES && quality > 0.45) {
      quality -= 0.08;
      blob = await canvasToJpegBlob(img, width, height, quality);
    }

    const base = file.name.replace(/\.[^.]+$/i, "") || "payment";
    const outFile = new File([blob], `${base}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });

    return {
      file: outFile,
      originalBytes,
      compressedBytes: outFile.size,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}