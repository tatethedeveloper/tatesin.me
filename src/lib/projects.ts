import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;
export type Status = Project['data']['status'];

/** Display order and copy for each status group. */
export const statusGroups: { status: Status; heading: string; empty: string }[] = [
  { status: 'building', heading: 'Building now', empty: 'Nothing in progress right now.' },
  { status: 'planned', heading: 'Planned', empty: 'Nothing planned yet.' },
  { status: 'shipped', heading: 'Shipped', empty: 'Nothing shipped yet. The first one is at the top.' },
];

export const statusLabel: Record<Status, string> = {
  building: 'Building',
  planned: 'Planned',
  shipped: 'Shipped',
};

export async function getProjects(): Promise<Project[]> {
  const all = await getCollection('projects');
  // Newest first within a group; featured first among equals.
  return all.sort(
    (a, b) =>
      Number(b.data.featured) - Number(a.data.featured) || b.data.year - a.data.year,
  );
}
