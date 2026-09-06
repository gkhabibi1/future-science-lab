import { MetadataRoute } from 'next';
import { SIMULATION_LIST } from '@/data/simulations';

export default function sitemap(): MetadataRoute.Sitemap {
  // Use environment variable if provided, fallback to standard production URL
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://labsains.id').replace(/\/$/, '');

  // Dynamic simulation routes
  const simulationUrls: MetadataRoute.Sitemap = SIMULATION_LIST.map((sim) => ({
    url: `${baseUrl}${sim.path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/3d-projectile-simulator/index.html`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...simulationUrls,
  ];
}
