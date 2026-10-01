/** Banner is stored as a compressed image (data URL) or an older https link. */
export const BANNER_W = 1500;
export const BANNER_H = 500;

export const bannerSrc = (b: string | null | undefined): string | null =>
  b && (/^https:\/\//i.test(b) || b.startsWith("data:image/")) ? b : null;

/** Crops the chosen photo to 3:1 and shrinks it so it saves quickly. */
export async function fileToBanner(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
    const ratio = BANNER_W / BANNER_H;
    let sw = img.width, sh = img.width / ratio;
    if (sh > img.height) { sh = img.height; sw = img.height * ratio; }
    const c = document.createElement("canvas"); c.width = BANNER_W; c.height = BANNER_H;
    c.getContext("2d")!.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, BANNER_W, BANNER_H);
    return c.toDataURL("image/jpeg", 0.8);
  } finally { URL.revokeObjectURL(url); }
}
