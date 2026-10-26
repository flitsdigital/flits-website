import type { WidgetMeta } from '../registry';
import { measureAtBuild } from './logic';

// Not offered in a slot until there is a real score (PSI_API_KEY + SITE_URL): never a "— meting volgt" card.
export const meta: WidgetMeta = { title: 'PageSpeed', size: 'square', available: async () => (await measureAtBuild()).mobile !== null };
