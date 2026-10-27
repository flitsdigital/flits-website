import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';
import { PROJECT_TYPES, SECTORS } from './lib/taxonomy';
import { iconNames } from './design-system/icons';
import { trackId } from './lib/spotify-ids';

// Single entry point for content. Pages and sections only use getCollection()/getEntry(),
// so swapping a loader (e.g. to Sanity) later does not touch components.

/** Case studies: one Markdown file per project. Add a new .md file to publish a case. */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) => {
    const statsBlock = z.object({
      title: z.string(),
      lead: z.string(),
      items: z.array(z.object({ label: z.string(), value: z.string() })).min(1).max(3),
    });
    /** Case board blocks: a white text block, the stats panel, or the dark results band (photo or Bunny video). */
    const text = z.object({ title: z.string(), body: z.array(z.string()) });
    /** Bunny Stream: HLS playlist + thumbnail; plays muted while in view. */
    const video = z.object({ src: z.string().url(), poster: z.string().url() });
    const results = z
      .object({ title: z.string(), body: z.array(z.string()), image: image().optional(), video: video.optional() })
      .refine((r) => r.image || r.video, 'results needs an image or a video');
    const half = z.union([image(), text]);
    return z.object({
      client: z.string(),
      title: z.string(),
      /** Sort order and the year pill (the year is taken from this date). */
      date: z.coerce.date(),
      tags: z.array(z.string()).default([]),
      badge: z.string().optional(),
      /** Filters on /projecten: what we made and for which sector. */
      types: z.array(z.enum(PROJECT_TYPES)).default([]),
      sector: z.enum(SECTORS).default('Overig'),
      cover: image(),
      /**
       * The case page (/projecten/[slug]). Optional: without it the project is only a card.
       * The Markdown body is the intro text under the big result title.
       */
      caseStudy: z
        .object({
          /** Draft: the page only builds in `astro dev`; in production the project stays a card. */
          draft: z.boolean().default(false),
          heroTitle: z.string(),
          hero: image(),
          /** Share (Open Graph) image; defaults to the hero. */
          share: image().optional(),
          /** Live site: the yellow "Website bekijken" strip links here. */
          website: z.string().url().optional(),
          intro: z.object({ title: z.string(), services: z.array(z.string()).default([]) }),
          /** Posters for the video fan; leave empty to skip the fan. */
          videos: z.array(image()).default([]),
          /** Landscape mockups shown full width under the intro; leave empty to skip. */
          wide: z.array(image()).default([]),
          /** Supporting design visuals after the gallery: one wide, two side by side; a { title, lead } entry is a text block in between. */
          visuals: z.array(z.union([image(), z.object({ title: z.string(), lead: z.string() })])).default([]),
          /**
           * Case board (Figma "Cases" file): the blocks after the intro, in order, in place of gallery, results,
           * stats and visuals. An image runs full width; a [left, right] pair sits side by side.
           */
          board: z.array(z.union([image(), text, z.object({ stats: statsBlock }), z.object({ results }), z.tuple([half, half])])).default([]),
          gallery: z.object({ title: z.string(), images: z.array(image()).min(2) }).optional(),
          results: z.object({ title: z.string(), body: z.array(z.string()), image: image() }).optional(),
          stats: statsBlock.optional(),
          /** Leave out until the client has given a quote; the section is then skipped. */
          testimonial: z
            .object({
              title: z.string(),
              lead: z.string(),
              image: image(),
              /** id in reviews.json. shortcut: plain id, because reference() inside this nested object made Astro 7.4 silently drop caseStudy. */
              review: z.string(),
            })
            .optional(),
        })
        .optional(),
    });
  },
});

const reviews = defineCollection({
  loader: file('./src/content/reviews.json'),
  schema: ({ image }) =>
    z.object({
      logo: image(),
      logoAlt: z.string(),
      /** Rendered logo height in px; logos have no common size. */
      logoHeight: z.number().default(24),
      quote: z.array(z.string()),
      author: z.string(),
      avatar: image(),
    }),
});

/** Client logo tiles for the brand strip. */
const clients = defineCollection({
  loader: file('./src/content/clients.json'),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      logo: image(),
      background: z.string().optional(),
      logoWidth: z.number(),
      logoHeight: z.number(),
    }),
});

/** Logo wall on /over-ons: each logo sits in a cell of the 4-column grid (empty cells are intentional). */
const logowall = defineCollection({
  loader: file('./src/content/logowall.json'),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      logo: image(),
      row: z.number().int().min(1),
      column: z.number().int().min(1).max(4),
    }),
});

/** Polaroids in the "Een kijkje achter de schermen" slider; order = slider order. */
const behindTheScenes = defineCollection({
  loader: file('./src/content/behind-the-scenes.json'),
  schema: ({ image }) =>
    z.object({
      image: image(),
      year: z.string(),
      caption: z.string(),
      /** Polaroid tilt in degrees. */
      tilt: z.number().default(0),
    }),
});

const team = defineCollection({
  loader: file('./src/content/team.json'),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      /** Founder order where the design shows them together (avatars: Jordi, then Joery). */
      order: z.number(),
      role: z.string(),
      photo: image(),
      avatar: image(),
    }),
});

/**
 * Services: one YAML file per service in src/content/services. Feeds the nav dropdown, footer,
 * home teaser and the page /diensten/<file name>. The page is a hero plus an ordered list of
 * blocks; each block type maps to one section component (see pages/diensten/[slug].astro).
 */
const services = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/services' }),
  schema: ({ image }) => {
    const action = z.object({ label: z.string(), href: z.string(), variant: z.enum(['primary', 'secondary']).default('primary') });
    const phone = z.object({
      screen: image(),
      device: z.enum(['right', 'left']).default('right'),
      /** Frame box inside the 696×824 media block, Figma px. */
      x: z.number(),
      y: z.number(),
      width: z.number(),
    });
    const block = z.discriminatedUnion('type', [
      z.object({
        type: z.literal('features'),
        title: z.string(),
        lead: z.string(),
        variant: z.enum(['pains', 'services']).default('pains'),
        items: z.array(z.object({ icon: z.enum(iconNames), title: z.string(), text: z.string() })).min(1),
      }),
      z.object({ type: z.literal('logoFan'), proof: z.string(), cta: action.omit({ variant: true }) }),
      z.object({ type: z.literal('behindTheScenes'), title: z.string() }),
      z.object({
        type: z.literal('split'),
        title: z.string(),
        body: z.array(z.string()),
        /** Text next to the founders' avatars above the title… */
        eyebrow: z.string().optional(),
        /** …or a logo badge instead (e.g. Shopify). */
        badge: z.object({ image: image(), alt: z.string() }).optional(),
        actions: z.array(action).default([]),
        mediaSide: z.enum(['right', 'left']).default('right'),
        phones: z.array(phone).min(1),
      }),
      z.object({
        type: z.literal('steps'),
        title: z.string(),
        lead: z.string(),
        items: z.array(z.object({ image: image(), title: z.string(), text: z.string() })).min(1),
      }),
      z.object({
        type: z.literal('projects'),
        title: z.string(),
        ticker: z.array(z.string()).optional(),
        /** Show projects of this type first (falls back to the newest). */
        projectType: z.enum(PROJECT_TYPES).optional(),
      }),
      /** Questions come from faqs.json (shared, or tagged with this service's id). */
      z.object({ type: z.literal('faq'), title: z.string(), lead: z.string() }),
      z.object({ type: z.literal('contact'), title: z.string(), lead: z.string() }),
    ]);
    return z.object({
      order: z.number(),
      label: z.string(),
      teaserLabel: z.string().optional(),
      teaserImage: image().optional(),
      /** Position in the home teaser (left → right); omit to leave it out. */
      teaserOrder: z.number().optional(),
      page: z.object({
        /** Last crumb: Home / Diensten / <breadcrumb> */
        breadcrumb: z.string(),
        title: z.string(),
        intro: z.array(z.string()),
        description: z.string(),
        /** Media straddling the hero's bottom edge. */
        heroMedia: z
          .discriminatedUnion('type', [
            z.object({ type: z.literal('videoFan'), posters: z.array(image()).min(1), overlap: z.number().default(24) }),
            z.object({ type: z.literal('photoPhone'), photo: image(), screen: image(), overlap: z.number().default(106) }),
          ])
          .optional(),
        blocks: z.array(block),
      }),
    });
  },
});

/** FAQ: shown on every service page, or only on the services listed. */
const faqs = defineCollection({
  loader: file('./src/content/faqs.json'),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    services: z.array(z.string()).optional(),
  }),
});

/** Legal pages (footer): Markdown, the file name is the URL. `draft` = noindex until the real text is in. */
const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({ title: z.string(), draft: z.boolean().default(false) }),
});

/**
 * Tracks for the Spotify widget, in play order. Add a track: paste its Spotify share link and the artist;
 * title and cover come from Spotify at build (stored ones are the fallback).
 */
const tracks = defineCollection({
  loader: file('./src/content/tracks.json'),
  schema: z.object({
    url: z.string().refine((u) => trackId(u) !== null, 'Not a Spotify track link (album and playlist links do not work)'),
    artist: z.string(),
    title: z.string().optional(),
    cover: z.string().url().optional(),
  }),
});

/** Office photos for the "Kijk binnen" widget; the newest is shown with its date. Add one per upload. */
const officePhotos = defineCollection({
  loader: file('./src/content/office-photos.json'),
  schema: ({ image }) => z.object({ image: image(), date: z.coerce.date() }),
});

/** Story-style posts with our own photos, in order. `label` sits under the ring (keep it short). */
const stories = defineCollection({
  loader: file('./src/content/stories.json'),
  schema: ({ image }) => z.object({ image: image(), label: z.string().max(18), caption: z.string().max(90), date: z.coerce.date().optional() }),
});

/**
 * "Bericht van de studio": Jordi sends a note (and maybe a photo) in chat, Claude adds it here, newest last.
 * Images go in src/assets/images/studio-posts/.
 */
const studioPosts = defineCollection({
  loader: file('./src/content/studio-posts.json'),
  schema: ({ image }) =>
    z.object({
      author: z.enum(['jordi', 'joery']),
      date: z.coerce.date(),
      text: z.string().max(140, 'Studio posts are at most 140 characters'),
      image: image().optional(),
    }),
});

export const collections = { projects, reviews, clients, logowall, behindTheScenes, team, services, faqs, legal, tracks, officePhotos, stories, studioPosts };
