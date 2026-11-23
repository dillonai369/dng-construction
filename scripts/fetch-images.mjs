// Downloads the site photos and writes web-sized copies into public/img.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const base = 'https://d8j0ntlcm91z4.cloudfront.net/user_3DbBqBJSTphBlonPIPBadV3Q1Q8/';
const photos = [
  ['hero', 'hf_20261123_182514_9ac9eb6b-26f8-430f-9861-bbd8792372f3.png', 2000, 1125],
  ['home', 'hf_20261123_182514_4257b75d-c740-4906-9049-a3dd5b58c0a4.png', 1400, 1050],
  ['commercial', 'hf_20261123_182513_50f9933f-3e30-4657-ba52-ded2c2c2b1fa.png', 1400, 1050],
  ['crew', 'hf_20261123_182512_5374a486-d1a6-48f7-9ff3-9fad0848ed82.png', 2000, 1125],
  ['kitchen', 'hf_20261121_213218_270ca85c-c754-4e96-a02c-f6289c12ab90.png', 1000, 750],
  ['bath', 'hf_20261121_213218_592c7d68-ba36-4038-92de-ca2ecb3de5d5.png', 1000, 750],
  ['office', 'hf_20261121_213218_de0c031b-b811-4b30-bd92-60e32eefa974.png', 1000, 750],
  ['basement', 'hf_20261121_213219_62f2c6f5-465e-44f8-bbb8-2ac93fa6ef0a.png', 1000, 750],
];

await mkdir('public/img', { recursive: true });

for (const [name, file, w, h] of photos) {
  const res = await fetch(base + file);
  if (!res.ok) throw new Error(`Could not download ${name}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf).resize(w, h, { fit: 'cover' }).jpeg({ quality: 78, mozjpeg: true }).toFile(`public/img/${name}.jpg`);
  console.log(`wrote public/img/${name}.jpg`);
}
