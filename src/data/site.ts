/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SINGLE SOURCE OF TRUTH FOR BUSINESS DETAILS
 *  Taken from the client's printed menu (Sept 2026). The nav, footer, map,
 *  CTAs and menu page all read from here; the JSON-LD in the two HTML entry
 *  points repeats the same values for search engines.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const SITE = {
  name: 'Mr. Chaiwala',
  tagline: 'Ek Chai Ho Jaye',
  city: 'Adelaide',
  street: '164 Port Road',
  suburb: 'Hindmarsh',
  postcode: '5007',
  address: '164 Port Road, Hindmarsh SA 5007',
  phone: '0422 372 222',
  phoneHref: 'tel:+61422372222',
  instagram: '@mr.chaiwala_adelaide',
  instagramHref: 'https://www.instagram.com/mr.chaiwala_adelaide',
  facebookHref: 'https://www.facebook.com/profile.php?id=100091952810140',
  reviewHref: 'https://share.google/JeVPMA4YbNnGw6ykh',
  mapQuery: 'Mr Chaiwala, 164 Port Road, Hindmarsh SA 5007, Australia',
  hours: {
    open: '6:00 PM',
    close: '5:00 AM',
    /** 24h, Adelaide local time. The close is on the following calendar day. */
    openHour: 18,
    closeHour: 5,
    days: 'Every night',
  },
} as const

/** Paths work from both pages: on the home page the anchors smooth-scroll. */
export const NAV = [
  { label: 'Menu', href: '/menu/' },
  { label: 'Story', href: '/#story' },
  { label: 'Experience', href: '/#experience' },
  { label: 'Visit', href: '/#visit' },
] as const

/* ── Crafted Fresh ─────────────────────────────────────────────────────────── */

export const INGREDIENTS = [
  { name: 'Cardamom', hindi: 'इलायची', note: 'Green pods cracked by hand. The first thing you smell.' },
  { name: 'Ginger', hindi: 'अदरक', note: 'Pounded fresh for every pot. The heat that carries a conversation.' },
  { name: 'Clove', hindi: 'लौंग', note: 'Two per pot. Never three. The bitterness stays a rumour.' },
  { name: 'Cinnamon', hindi: 'दालचीनी', note: 'A single quill, steeped slow, until the street smells like it.' },
  { name: 'Fennel', hindi: 'सौंफ', note: 'Added at the end, off the flame, for the sweetness underneath.' },
  { name: 'Black Pepper', hindi: 'काली मिर्च', note: 'Cracked coarse. You should find it a second after you swallow.' },
] as const

/* ── Always Fresh. Always Ready. — the shape of a night ─────────────────────── */

export const DAYPARTS = [
  {
    time: '18:00',
    label: 'Sunset',
    title: 'First pour',
    body: 'Doors open, the kettle is already on, and the first cutting chai of the night goes out before the street lights do.',
  },
  {
    time: '21:00',
    label: 'Dinner',
    title: 'The full table',
    body: 'Pav bhaji in butter, vada pav off the pass, chaat assembled the moment it is ordered.',
  },
  {
    time: '00:00',
    label: 'Midnight',
    title: 'Second round',
    body: 'Shakes two at a time, Maggi for the table, and nobody looking at the clock.',
  },
  {
    time: '03:00',
    label: 'Late',
    title: 'Still pouring',
    body: 'The last shift, the long drive home, the conversation that did not want to end. The chai tastes the same at three.',
  },
] as const

/* ── The Café Experience ─────────────────────────────────────────────────────
 * PLACEHOLDER COPY. These are illustrative, not real customer reviews. Replace
 * them with genuine Google reviews (with permission) before launch.
 * -------------------------------------------------------------------------- */

export const TESTIMONIALS = [
  {
    quote: 'I came in for one cup at eleven and left at two. Nobody rushed me once.',
    name: 'Aarav M.',
    meta: 'Adelaide',
    depth: 0.45,
  },
  {
    quote: 'The vada pav tastes exactly like the stall outside my college in Dadar. I did not expect to find that here.',
    name: 'Priya S.',
    meta: 'Regular',
    depth: 0.9,
  },
  {
    quote: 'Finish a late shift and there is still a kettle on and a hot plate of pav bhaji waiting.',
    name: 'Daniel K.',
    meta: 'Night shift',
    depth: 1,
  },
  {
    quote: 'It does not feel like a café. It feels like somebody left their kitchen open for the whole city.',
    name: 'Meera J.',
    meta: 'Hindmarsh',
    depth: 0.62,
  },
] as const
