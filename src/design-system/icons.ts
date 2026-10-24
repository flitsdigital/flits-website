// One list of icon names: the Icon atom's type and the /components showcase both derive from it.
export const iconNames = [
  'arrow-up-right',
  'bolt',
  'bolt-white',
  'brush',
  'checklist-search',
  'chevron-bottom',
  'chevron-small',
  'facebook',
  'google',
  'hand-left',
  'hand-right',
  'home',
  'instagram',
  'linkedin',
  'quote',
  'tiktok',
  'whatsapp',
] as const;

export type IconName = (typeof iconNames)[number];
