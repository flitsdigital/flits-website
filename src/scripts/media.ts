/** Media queries the scripts check at the moment they are called (the CSS keeps its own @media rules). */
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
/** A mouse or trackpad: there is something to hover with. */
export const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
/** The navbar's mobile panel (max-width: 991px in its CSS); a MediaQueryList, so changes can be listened to. */
export const mobileNav = () => matchMedia('(max-width: 991px)');
