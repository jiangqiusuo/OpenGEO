import { readFile } from 'node:fs/promises';

type Manifest = {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const dependencySections = ['dependencies', 'optionalDependencies', 'peerDependencies', 'devDependencies'] as const;

export function assertPackagedManifest(manifest: Manifest, source = 'package.json'): void {
  for (const section of dependencySections) {
    for (const [name, range] of Object.entries(manifest[section] ?? {})) {
      if (range.startsWith('workspace:')) throw new Error(`${source} contains an unconverted workspace dependency: ${name}=${range}`);
    }
  }
}

const main = async (): Promise<void> => {
  const paths = process.argv.slice(2);
  if (paths.length === 0) throw new Error('at least one packaged package.json path is required');
  for (const path of paths) {
    const manifest = JSON.parse(await readFile(path, 'utf8')) as Manifest;
    assertPackagedManifest(manifest, path);
    console.log(`${manifest.name ?? path}@${manifest.version ?? 'unknown'} packaged manifest passed`);
  }
};

if (process.argv[1] && new URL(`file://${process.argv[1].replace(/\\/g, '/')}`).pathname.endsWith('/verify-packaged-manifests.ts')) {
  main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
