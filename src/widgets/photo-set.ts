import { getImage } from 'astro:assets';

type Files = Record<string, { default: ImageMetadata }>;

/**
 * A widget's photo set from an `import.meta.glob(..., { eager: true })` of its folder, keyed by file name
 * ("herfst-ochtend-regen", "dag-06"): the key is the contract between file names, logic.ts and init.ts.
 */
export const photosByKey = (files: Files) => Object.fromEntries(Object.entries(files).map(([path, m]) => [path.split('/').pop()!.replace(/\.\w+$/, ''), m.default]));

/** The same set as optimized URLs, for the widget's script to swap in (`data-*` JSON). */
export const photoUrls = async (files: Files, width: number) =>
  Object.fromEntries(await Promise.all(Object.entries(photosByKey(files)).map(async ([key, src]) => [key, (await getImage({ src, width })).src])));
