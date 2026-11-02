import { getCollection, type CollectionEntry } from 'astro:content';
import { getEntryUpdatedDate } from './contentDates';

export type LearnEntry = CollectionEntry<'learn'>;
export type GuideEntry = CollectionEntry<'guides'>;

export type LearnFeedItem = {
  href: string;
  title: string;
  description: string;
  /** Learn-index category key (how-to, primers, guides, …). */
  category: string;
  /** ISO date used for sorting and the card byline. */
  date: string;
  featuredImage?: string;
};

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

/** Learn posts plus guides, shown together on /learn/ with Guides as its own category. */
export async function getLearnFeedItems(): Promise<LearnFeedItem[]> {
  const [posts, guides] = await Promise.all([
    getPublishedLearnPosts(),
    getCollection('guides'),
  ]);

  const learnItems: LearnFeedItem[] = posts.map((post) => ({
    href: `/learn/${post.data.slug}/`,
    title: post.data.title,
    description: post.data.description,
    category: post.data.category,
    date: post.data.publishedOn,
    featuredImage: post.data.featuredImage,
  }));

  const guideItems: LearnFeedItem[] = guides.map((guide) => ({
    href: `/learn/${guide.data.slug}/`,
    title: guide.data.title,
    description: guide.data.description,
    category: 'guides',
    date: getEntryUpdatedDate(guide),
    featuredImage: guide.data.featuredImage,
  }));

  return [...learnItems, ...guideItems].sort((a, b) => b.date.localeCompare(a.date));
}
