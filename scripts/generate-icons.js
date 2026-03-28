const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#2E7D32" rx="${size / 6}"/>
      <text x="50%" y="55%" font-size="${size * 0.5}" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="Arial, sans-serif" font-weight="bold">K</text>
    </svg>
  `;

  const outputPath = path.join(__dirname, '..', 'public', `icon-${size}.png`);

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  console.log(`Generated ${outputPath}`);
}

async function main() {
  await generateIcon(192);
  await generateIcon(512);
  console.log('Icons generated successfully!');
}

main().catch(console.error);
