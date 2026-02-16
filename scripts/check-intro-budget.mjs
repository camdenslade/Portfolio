import { gzipSync } from 'node:zlib';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const BUDGET_BYTES = 5 * 1024 * 1024;
const NEXT_DIR = path.join(process.cwd(), '.next');
const APP_MANIFEST_FILE = path.join(NEXT_DIR, 'app-build-manifest.json');
const BUILD_MANIFEST_FILE = path.join(NEXT_DIR, 'build-manifest.json');

async function readJson(file) {
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw);
}

function selectIntroFiles(appManifest, buildManifest) {
  const appFiles = appManifest?.pages?.['/page'] ?? [];

  const toFsPath = (file) => {
    const normalized = file
      .replace(/^\/_next\//, '')
      .replace(/^_next\//, '')
      .replace(/^\//, '');
    return path.join(NEXT_DIR, normalized);
  };

  const candidateFiles = [...appFiles]
    .filter((file) => typeof file === 'string')
    .filter((file) => file.endsWith('.js'))
    .map((file) => toFsPath(file));

  return [...new Set(candidateFiles)];
}

async function main() {
  try {
    await fs.access(APP_MANIFEST_FILE);
    await fs.access(BUILD_MANIFEST_FILE);
  } catch {
    console.error('Missing Next.js build manifests. Run `npm run build` first.');
    process.exit(1);
  }

  const appManifest = await readJson(APP_MANIFEST_FILE);
  const buildManifest = await readJson(BUILD_MANIFEST_FILE);
  const files = selectIntroFiles(appManifest, buildManifest);

  if (files.length === 0) {
    console.error('No intro route chunks found in build manifests.');
    process.exit(1);
  }

  let totalGzipBytes = 0;
  for (const file of files) {
    try {
      await fs.access(file);
    } catch {
      continue;
    }
    const content = await fs.readFile(file);
    totalGzipBytes += gzipSync(content).length;
  }

  const mb = (totalGzipBytes / (1024 * 1024)).toFixed(2);
  console.log(`Gzipped intro-route JS payload: ${mb}MB`);

  if (totalGzipBytes > BUDGET_BYTES) {
    console.error('Intro payload budget exceeded: expected <= 5.00MB');
    process.exit(1);
  }

  console.log('Intro payload budget check passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
