import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      status: z.enum(['shipped', 'building', 'planned']),
      role: z.string(),
      stack: z.array(z.string()),
      year: z.number().int(),
      repo: z.string().url().optional(),
      demo: z.string().url().optional(),
      cover: image().optional(),
      featured: z.boolean().default(false),
      /** Seed content, not real work. Renders a visible mark on the site. */
      placeholder: z.boolean().default(false),
      /** Real work, the one being built right now. Renders a mark saying so. */
      current: z.boolean().default(false),
    }),
});

export const collections = { projects };
