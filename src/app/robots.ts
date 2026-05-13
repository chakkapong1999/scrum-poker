import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://scrum-poker.devonly.dev';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/room/', '/join/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
