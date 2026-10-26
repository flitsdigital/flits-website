import { getCollection, getEntry, render, type CollectionEntry } from 'astro:content';

// Sorted views on the collections, so ordering rules live in one place.

export const getProjects = async () =>
  (await getCollection('projects')).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

export const getServices = async () =>
  (await getCollection('services')).sort((a, b) => a.data.order - b.data.order);

export const getTeaserServices = async () =>
  (await getServices())
    .filter((s) => s.data.teaserOrder !== undefined && s.data.teaserImage)
    .sort((a, b) => a.data.teaserOrder! - b.data.teaserOrder!);

export const serviceHref = (id: string) => `/diensten/${id}`;
export const projectHref = (id: string) => `/projecten/${id}`;

/** The founders, in the order the design shows them together (team.json `order`). */
export const getFounders = async () => (await getCollection('team')).sort((a, b) => a.data.order - b.data.order);

/** Avatar props for Eyebrow / StatsPanel / CaseResults. */
export const avatarsOf = (members: CollectionEntry<'team'>[]) => members.map((m) => ({ src: m.data.avatar, alt: m.data.name }));

/** A project gets its own page only when its Markdown has a `caseStudy` block. */
export const hasCase = (project: CollectionEntry<'projects'>) => Boolean(project.data.caseStudy);

/** Slugs for /projecten/[slug]. */
export const getCaseSlugs = async () => (await getProjects()).filter(hasCase).map((p) => p.id);

/**
 * Everything a case page needs, checked: a missing caseStudy or an unknown review id fails the
 * build with a message that names the Markdown file, instead of a crash deep in a component.
 */
export async function getCase(id: string) {
  const project = await getEntry('projects', id);
  const caseStudy = project?.data.caseStudy;
  if (!project || !caseStudy) throw new Error(`Project "${id}" has no caseStudy block (src/content/projects/${id}.md)`);
  const reviewId = caseStudy.testimonial?.review;
  const review = reviewId ? await getEntry('reviews', reviewId) : undefined;
  if (reviewId && !review) {
    throw new Error(`Unknown review "${reviewId}" in src/content/projects/${id}.md (see src/content/reviews.json)`);
  }
  const { Content } = await render(project);
  const related = (await getProjects()).filter((p) => p.id !== id).slice(0, 4);
  return { project, caseStudy, review, Content, related, year: String(project.data.date.getFullYear()) };
}
