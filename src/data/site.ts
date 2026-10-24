// Site-wide settings that are not collections (they appear once per page shell).

export const nav = [
  { label: 'Over ons', href: '/over-ons' },
  { label: 'Projecten', href: '/projecten' },
];

export const contact = {
  email: 'info@flitsdigital.nl',
  phone: '06 57 33 66 23',
  whatsapp: 'https://wa.me/31657336623',
  address: ['De Bukakkers 20,', '7811KZ Emmen'],
  /** Short form for the map widget. */
  shortAddress: 'De Bukakkers 20, Emmen',
  city: 'Emmen',
  region: 'Drenthe',
};

/** Google rating shown above the reviews. */
export const rating = { score: '4.9', count: '30' };

export const socials = [
  { icon: 'instagram', label: 'Instagram', href: '#' },
  { icon: 'facebook', label: 'Facebook', href: '#' },
  { icon: 'tiktok', label: 'TikTok', href: '#' },
  { icon: 'linkedin', label: 'LinkedIn', href: '#' },
] as const;

export const legal = [
  { label: 'Algemene voorwaarden', href: '/algemene-voorwaarden' },
  { label: 'Privacybeleid', href: '/privacybeleid' },
];

export const serviceTicker = [
  'Websites',
  'Webshops',
  'Short form content',
  'Advertentievideo’s',
  'Recruitmentvideo’s',
  'Online marketing',
];
