/** Project rules that pages share. Pure, so they are tested without Astro. */
type Project = { id: string; data: { date: Date; types: readonly string[] } };

/** The cards a teaser shows: projects of `type` first, newest first within each group, never `exclude`. */
export const featured = <T extends Project>(projects: T[], { type, exclude, count = 4 }: { type?: string; exclude?: string; count?: number } = {}) =>
  projects
    .filter((p) => p.id !== exclude)
    .sort((a, b) => Number(b.data.types.includes(type ?? '')) - Number(a.data.types.includes(type ?? '')) || b.data.date.valueOf() - a.data.date.valueOf())
    .slice(0, count);

/**
 * "Nieuw!" for projects of the last 60 days.
 * shortcut: decided at build, so a site that is not redeployed keeps the badge; fine while we deploy weekly.
 */
export const isNew = (date: Date, today = new Date(), days = 60) => today.valueOf() - date.valueOf() < days * 86_400_000;

/** The year pill. Front-matter dates are UTC midnight, so read the UTC year (not the build machine's zone). */
export const yearOf = (date: Date) => String(date.getUTCFullYear());
