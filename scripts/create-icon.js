const fs = require('fs');
const path = require('path');

function createPlaceholderICO(outputPath) {
  const width = 256;
  const height = 256;
  const bitsPerPixel = 32;

  // BITMAPINFOHEADER (40 bytes)
  const bmpHeader = Buffer.alloc(40);
  bmpHeader.writeUInt32LE(40, 0);     // Size
  bmpHeader.writeInt32LE(width, 4);   // Width
  bmpHeader.writeInt32LE(height * 2, 8); // Height (doubled for XOR + AND)
  bmpHeader.writeUInt16LE(1, 12);    // Planes
  bmpHeader.writeUInt16LE(bitsPerPixel, 14); // Bits per pixel
  bmpHeader.writeUInt32LE(0, 16);    // Compression
  bmpHeader.writeUInt32LE(0, 20);    // Image size
  bmpHeader.writeInt32LE(0, 24);     // X pixels per meter
  bmpHeader.writeInt32LE(0, 28);     // Y pixels per meter
  bmpHeader.writeUInt32LE(0, 32);    // Colors used
  bmpHeader.writeUInt32LE(0, 36);    // Important colors

  // Pixel data (BGRA, bottom-up) - azul sólido
  const rowSize = width * 4;
  const pixelData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (height - 1 - y) * rowSize + x * 4;
      pixelData[offset] = 37;      // B (azul escuro)
      pixelData[offset + 1] = 99;   // G
      pixelData[offset + 2] = 235;  // R
      pixelData[offset + 3] = 255;  // A
    }
  }

  // AND mask (1bpp, bottom-up)
  const andMaskRowSize = Math.ceil(width / 8);
  const andMask = Buffer.alloc(andMaskRowSize * height);

  // ICO header (6 bytes)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);     // Reserved
  header.writeUInt16LE(1, 2);     // Type (1 = ICO)
  header.writeUInt16LE(1, 4);     // Count (1 image)

  // ICO directory entry (16 bytes)
  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(width >= 256 ? 0 : width, 0);   // Width
  dirEntry.writeUInt8(height >= 256 ? 0 : height, 1); // Height
  dirEntry.writeUInt8(0, 2);     // Color palette
  dirEntry.writeUInt8(0, 3);     // Reserved
  dirEntry.writeUInt16LE(1, 4);  // Color planes
  dirEntry.writeUInt16LE(bitsPerPixel, 6); // Bits per pixel
  dirEntry.writeUInt32LE(40 + pixelData.length + andMask.length, 8); // Size
  dirEntry.writeUInt32LE(6 + 16, 12); // Offset

  // Combine all parts
  const ico = Buffer.concat([header, dirEntry, bmpHeader, pixelData, andMask]);

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, ico);
  console.log('ICO created at:', outputPath);
  console.log('Size:', ico.length, 'bytes');
}

const outputPath = path.join(__dirname, '..', 'resources', 'icons', 'icon.ico');
createPlaceholderICO(outputPath);
