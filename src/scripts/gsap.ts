import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** GSAP for every script: plugins registered once, plus the site's curve. */
gsap.registerPlugin(CustomEase, ScrollTrigger);

/** The site's motion curve (--ease-osmo in tokens.css) */
export const osmo = CustomEase.create('osmo', 'M0,0 C0.625,0.05 0,1 1,1');

export { gsap, CustomEase, ScrollTrigger };
