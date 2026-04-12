import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Scrum Poker',
    short_name: 'Scrum Poker',
    description:
      'Free real-time planning poker for agile teams. Estimate with Fibonacci or T-Shirt sizing — no sign-up required.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
