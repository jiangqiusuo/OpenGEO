const packageNames = ['@opengeo/client', '@opengeo/cli'] as const;

export type RegistryCheck = { name: string; status: number; result: 'unpublished' | 'published' | 'unknown' };

export function classifyRegistryStatus(name: string, status: number): RegistryCheck {
  return { name, status, result: status === 404 ? 'unpublished' : status === 200 ? 'published' : 'unknown' };
}

export async function checkRegistry(fetcher: typeof fetch = fetch): Promise<RegistryCheck[]> {
  const checks = await Promise.all(packageNames.map(async name => {
    const response = await fetcher(`https://registry.npmjs.org/${encodeURIComponent(name)}`, { headers: { accept: 'application/json' } });
    return classifyRegistryStatus(name, response.status);
  }));
  return checks;
}

const main = async (): Promise<void> => {
  const checks = await checkRegistry();
  for (const check of checks) console.log(`${check.name}: HTTP ${check.status} (${check.result})`);
  if (checks.some(check => check.result === 'published')) throw new Error('one or more package names are already published');
  if (checks.some(check => check.result === 'unknown')) throw new Error('registry availability could not be determined');
  console.log('Registry preflight passed: package names are not publicly published. Confirm scope ownership with an authenticated npm account before release.');
};

if (process.argv[1] && new URL(`file://${process.argv[1].replace(/\\/g, '/')}`).pathname.endsWith('/release-preflight.ts')) {
  main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
