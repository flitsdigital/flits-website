/** Radius of the circle on which neighbours `step` px apart are tilted `angleDeg` relative to each other. */
export const radiusFor = (step: number, angleDeg: number) => step / ((angleDeg * Math.PI) / 180);

/**
 * Position of an item `s` px along the arc from the top/bottom of the circle.
 * arch: circle centre below (∩, sides drop) · valley: centre above (∪, sides rise).
 */
export function arcPosition(s: number, radius: number, shape: 'arch' | 'valley') {
  // angle 0 → infinite radius: a straight row
  if (!Number.isFinite(radius)) return { x: s, y: 0, rotation: 0 };
  const theta = s / radius;
  const dir = shape === 'arch' ? 1 : -1;
  return {
    x: radius * Math.sin(theta),
    y: dir * radius * (1 - Math.cos(theta)),
    rotation: dir * ((theta * 180) / Math.PI),
  };
}

/** Wraps `v` into [-len/2, len/2) so items loop seamlessly around the visible centre. */
export const wrapCentered = (v: number, len: number) => ((((v + len / 2) % len) + len) % len) - len / 2;

/**
 * Distance between neighbour centres so the *visible* gap is `gap`, also when the neighbour is
 * tilted `angleDeg` (a tilted card's bounding box is wider than the card).
 */
/**
 * New offset and step target after the spacing changes from `prevStep` to `nextStep` (a resize),
 * so the same item stays in the centre.
 */
export function rescaleOffset(offset: number, prevStep: number, nextStep: number) {
  const scaled = (offset / prevStep) * nextStep;
  return { offset: scaled, target: Math.round(scaled / nextStep) * nextStep };
}

export function stepFor(width: number, height: number, gap: number, angleDeg: number) {
  const t = (Math.abs(angleDeg) * Math.PI) / 180;
  return width / 2 + (width * Math.cos(t) + height * Math.sin(t)) / 2 + gap;
}
