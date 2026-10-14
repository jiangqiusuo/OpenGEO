const covers: Record<string, string> = {
  'geo-visibility-and-evidence': 'landscape-lake',
  'cli-local-quickstart': 'landscape-forest',
  'partial-results-and-retries': 'landscape-dunes',
  'mock-to-job-quickstart': 'landscape-lake',
};

export function journalImage(slug: string, className: string): string {
  const name = covers[slug] ?? 'landscape-lake';
  return `<img class="${className}" src="/journal/${name}-480.webp" srcset="/journal/${name}-480.webp 480w, /journal/${name}-960.webp 960w" sizes="(max-width:700px) calc(100vw - 40px), (max-width:1000px) 45vw, 480px" width="960" height="640" loading="lazy" decoding="async" alt="">`;
}
