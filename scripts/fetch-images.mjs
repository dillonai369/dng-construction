// Downloads the site photos and writes web-sized copies into public/img.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const base = 'https://d8j0ntlcm91z4.cloudfront.net/user_3DbBqBJSTphBlonPIPBadV3Q1Q8/';
const photos = [
  ['hero', 'hf_20261121_213219_cc362369-d2b8-4d7b-8607-e44d556474bc.png', 1600, 900],
  ['kitchen', 'hf_20261121_213218_270ca85c-c754-4e96-a02c-f6289c12ab90.png', 1000, 750],
  ['bath', 'hf_20261121_213218_592c7d68-ba36-4038-92de-ca2ecb3de5d5.png', 1000, 750],
  ['office', 'hf_20261121_213218_de0c031b-b811-4b30-bd92-60e32eefa974.png', 1000, 750],
  ['basement', 'hf_20261121_213219_62f2c6f5-465e-44f8-bbb8-2ac93fa6ef0a.png', 1000, 750],
  ['crew', 'hf_20261121_213217_6dc1e823-0533-4e13-b8a5-4bd0b0f6d462.png', 1000, 750],
];

await mkdir('public/img', { recursive: true });

for (const [name, file, w, h] of photos) {
  const res = await fetch(base + file);
  if (!res.ok) throw new Error(`Could not download ${name}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf).resize(w, h, { fit: 'cover' }).jpeg({ quality: 78, mozjpeg: true }).toFile(`public/img/${name}.jpg`);
  console.log(`wrote public/img/${name}.jpg`);
}

await sharp('scripts/logo-source.png').resize({ width: 640 }).png().toFile('public/img/logo.png');
await sharp('scripts/logo-source.png').extract({ left: 0, top: 60, width: 440, height: 440 }).resize(96, 96, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toFile('public/img/favicon.png');
console.log('wrote logo and favicon');
