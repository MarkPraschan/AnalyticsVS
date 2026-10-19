import { getCollection, type CollectionEntry } from 'astro:content';

export type LearnEntry = CollectionEntry<'learn'>;

/** Calendar date in America/New_York as YYYY-MM-DD (Learn publish schedule). */
export function learnTodayEt(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function isPublishedLearnPost(entry: LearnEntry, todayEt = learnTodayEt()): boolean {
  return entry.data.status === 'published' && entry.data.publishedOn <= todayEt;
}

export async function getPublishedLearnPosts(): Promise<LearnEntry[]> {
  const todayEt = learnTodayEt();
  const posts = await getCollection('learn');
  return posts
    .filter((entry) => isPublishedLearnPost(entry, todayEt))
    .sort((a, b) => b.data.publishedOn.localeCompare(a.data.publishedOn));
}
