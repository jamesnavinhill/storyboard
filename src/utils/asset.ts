export const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read blob as data URL"));
      }
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
};

export const loadImageDataFromUrl = async (
  source: string
): Promise<{ base64: string; mimeType: string }> => {
  if (source.startsWith("data:")) {
    const [meta, data] = source.split(",", 2);
    const mimeType = meta.match(/data:(.*?);/)?.[1] ?? "image/png";
    return { base64: data ?? "", mimeType };
  }
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Failed to load asset from ${source}`);
  }
  const blob = await response.blob();
  const dataUrl = await blobToDataUrl(blob);
  const [meta, data] = dataUrl.split(",", 2);
  const mimeType =
    meta?.match(/data:(.*?);/)?.[1] ?? (blob.type || "image/png");
  return { base64: data ?? "", mimeType };
};
