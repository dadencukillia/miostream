import sharp from "sharp";

const AVATAR_WIDTH = 256;
const AVATAR_HEIGHT = 256;
const WEBP_QUALITY = 80;

export async function processImage(imageData: Buffer): Promise<Buffer> {
  return await sharp(imageData)
    .resize(AVATAR_WIDTH, AVATAR_HEIGHT, { fit: "cover" })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}
