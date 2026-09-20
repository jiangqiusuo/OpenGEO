import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const packages = [
  { directory: 'packages/client', name: '@opengeo/client', required: ['dist/index.js', 'dist/index.d.ts', 'README.md'] },
  { directory: 'packages/cli', name: '@opengeo/cli', required: ['dist/index.js', 'dist/index.d.ts', 'dist/bin.js', 'README.md'] },
] as const;

type PackageManifest = { name?: string; version?: string; files?: string[]; main?: string; types?: string; bin?: Record<string, string>; publishConfig?: { access?: string } };
type PackEntry = { files?: Array<{ path?: string }> };

export async function validateReleaseMetadata(): Promise<void> {
  const rootManifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8')) as { version?: string };
  const changelog = await readFile(resolve(root, 'CHANGELOG.md'), 'utf8');
  for (const packageInfo of packages) {
    const manifest = JSON.parse(await readFile(resolve(root, packageInfo.directory, 'package.json'), 'utf8')) as PackageManifest;
    if (manifest.name !== packageInfo.name) throw new Error(`package name mismatch: ${packageInfo.directory}`);
    if (manifest.version !== rootManifest.version) throw new Error(`package version mismatch: ${packageInfo.name}`);
    if (manifest.publishConfig?.access !== 'public') throw new Error(`scoped package must declare public access: ${packageInfo.name}`);
    if (!manifest.files?.includes('dist') || !manifest.files.includes('README.md')) throw new Error(`package files are incomplete: ${packageInfo.name}`);
    if (!changelog.includes(`## ${manifest.version}`)) throw new Error(`CHANGELOG is missing ${manifest.version}: ${packageInfo.name}`);
  }
}

export async function runReleaseCheck(): Promise<void> {
  await validateReleaseMetadata();
  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  for (const packageInfo of packages) {
    const command = process.platform === 'win32' ? 'cmd.exe' : pnpm;
    const args = process.platform === 'win32' ? ['/d', '/s', '/c', `${pnpm} pack --dry-run --json`] : ['pack', '--dry-run', '--json'];
    const { stdout } = await execFileAsync(command, args, { cwd: resolve(root, packageInfo.directory), maxBuffer: 1024 * 1024 });
    const parsed = JSON.parse(stdout.trim()) as PackEntry | PackEntry[];
    const pack = Array.isArray(parsed) ? parsed[0] : parsed;
    const paths = new Set((pack?.files ?? []).map(file => file.path));
    for (const required of packageInfo.required) if (!paths.has(required)) throw new Error(`dry-run package is missing ${required}: ${packageInfo.name}`);
    for (const path of paths) if (/\.env|\.pem|\.key|node_modules|provider|upstream|secret|token/i.test(path ?? '')) throw new Error(`dry-run package contains a forbidden path: ${packageInfo.name}/${path}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  runReleaseCheck().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
