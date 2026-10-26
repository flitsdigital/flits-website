// Which content goes where: rules the pages used to keep in their frontmatter. Astro-free, so tested.

/** Projects of `type` first, then the newest others (input is newest first): always `n` cards. */
export function projectsFor<T extends { data: { types: readonly string[] } }>(projects: T[], type?: string, n = 4): T[] {
  const matches = (p: T) => Number(!!type && p.data.types.includes(type));
  return [...projects].sort((a, b) => matches(b) - matches(a)).slice(0, n);
}

/** A FAQ shows on every service page, unless it lists `services`: then only on those. */
export const faqsFor = <T extends { data: { services?: readonly string[] } }>(faqs: T[], serviceId: string) =>
  faqs.filter((f) => !f.data.services?.length || f.data.services.includes(serviceId));
