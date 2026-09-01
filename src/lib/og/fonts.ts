import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function readFontFile(packageName: string, fileName: string): ArrayBuffer {
  const packageJsonPath = require.resolve(`${packageName}/package.json`);
  const fontPath = path.join(path.dirname(packageJsonPath), 'files', fileName);
  const buffer = fs.readFileSync(fontPath);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

let fontsPromise: Promise<
  Array<{ name: string; data: ArrayBuffer; weight: 500 | 700; style: 'normal' }>
> | null = null;

export function loadOgFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.resolve([
      {
        name: 'Plus Jakarta Sans',
        data: readFontFile(
          '@fontsource/plus-jakarta-sans',
          'plus-jakarta-sans-latin-700-normal.woff',
        ),
        weight: 700,
        style: 'normal' as const,
      },
      {
        name: 'Inter',
        data: readFontFile('@fontsource/inter', 'inter-latin-500-normal.woff'),
        weight: 500,
        style: 'normal' as const,
      },
    ]);
  }

  return fontsPromise;
}
