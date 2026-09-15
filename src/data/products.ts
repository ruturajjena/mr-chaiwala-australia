import type { MediaKey } from '@/lib/media'

/** Which bespoke handoff plays as this product leaves the stage. */
export type TransitionKind =
  | 'steam'    // chai    → shake
  | 'cocoa'    // shake   → vada
  | 'crumbs'   // vada    → sandwich
  | 'grill'    // sandwich→ pasta
  | 'cream'    // pasta   → maggi
  | 'ribbons'  // maggi   → paratha
  | 'butter'   // paratha → chaat
  | 'spice'    // chaat   → outro

/** Particle behaviour while the product is on stage. */
export type ParticleMode =
  | 'steam' | 'cocoa' | 'crumb' | 'smoke' | 'cream' | 'noodle' | 'flake' | 'masala'

export interface Product {
  id: string
  media: MediaKey
  /** Short label for the horizontal selector. */
  tab: string
  index: string
  name: string
  /** Second line of the name, set in italic display type. */
  nameAccent?: string
  kicker: string
  description: string
  detail: string
  price: string
  accent: string
  accentSoft: string
  /** Bloom intensity 0–1. Bright dishes need less help from the lights. */
  bloom: number
  /** Colour grade applied to the plate, per dish. Never repeated verbatim. */
  grade: string
  /** Position of the key light behind the plate, in % of the stage. */
  key: { x: number; y: number }
  particles: ParticleMode
  out: TransitionKind
}

export const PRODUCTS: Product[] = [
  {
    id: 'signature-chai',
    media: 'signature-chai',
    tab: 'Chai',
    index: '01',
    name: 'Signature',
    nameAccent: 'Chai',
    kicker: 'The Original',
    description:
      'Strong, hot Indian tea brewed with fresh milk and aromatic leaves. Poured as a cutting, or as a full glass.',
    detail: 'Full glass $5.50',
    price: '$3.50',
    accent: '#C89B3C',
    accentSoft: 'rgba(200, 155, 60, 0.42)',
    bloom: 0.62,
    grade: 'saturate(1.06) contrast(1.04) brightness(1.02)',
    key: { x: 50, y: 44 },
    particles: 'steam',
    out: 'steam',
  },
  {
    id: 'kitkat-shake',
    media: 'kitkat-shake',
    tab: 'Shake',
    index: '02',
    name: 'KitKat',
    nameAccent: 'Shake',
    kicker: 'Cold Counter',
    description:
      'Crispy KitKat blended with creamy milk and ice cream, poured thick and rich.',
    detail: 'Also Oreo · Ferrero Rocher',
    price: '$9.00',
    accent: '#A9683A',
    accentSoft: 'rgba(169, 104, 58, 0.4)',
    bloom: 0.48,
    grade: 'saturate(1.02) contrast(1.08) brightness(0.99)',
    key: { x: 46, y: 40 },
    particles: 'cocoa',
    out: 'cocoa',
  },
  {
    id: 'vada-pav',
    media: 'vada-pav',
    tab: 'Vadapav',
    index: '03',
    name: 'Classic',
    nameAccent: 'Vadapav',
    kicker: 'Bombay Street',
    description:
      'A spicy potato vada in crisp gram-flour batter, pressed into soft pav with green chutney, dry garlic chutney and butter.',
    detail: 'Cheese · Schezwan · Grilled',
    price: '$7.50',
    accent: '#C8873C',
    accentSoft: 'rgba(200, 135, 60, 0.44)',
    bloom: 0.58,
    grade: 'saturate(1.1) contrast(1.06) brightness(1.03)',
    key: { x: 54, y: 46 },
    particles: 'crumb',
    out: 'crumbs',
  },
  {
    id: 'paneer-sandwich',
    media: 'paneer-sandwich',
    tab: 'Sandwich',
    index: '04',
    name: 'Paneer Tandoori',
    nameAccent: 'Sandwich',
    kicker: 'Premium Sandwich',
    description:
      'Char-grilled paneer marinated in rich tandoori masala, with fresh veggies and toasted bread. Bold and indulgent.',
    detail: 'One of six premium sandwiches',
    price: '$15.50',
    accent: '#B8862F',
    accentSoft: 'rgba(184, 134, 47, 0.4)',
    bloom: 0.5,
    grade: 'saturate(1.04) contrast(1.1) brightness(1.01)',
    key: { x: 50, y: 50 },
    particles: 'smoke',
    out: 'grill',
  },
  {
    id: 'pasta',
    media: 'pasta',
    tab: 'Pasta',
    index: '05',
    name: 'White Sauce',
    nameAccent: 'Pasta',
    kicker: 'The Crossover',
    description:
      'Creamy pasta in a smooth white sauce with herbs and fresh vegetables. Italian in shape, desi at heart.',
    detail: 'Also red sauce · pink sauce',
    price: '$15.50',
    accent: '#E8D9BC',
    accentSoft: 'rgba(232, 217, 188, 0.3)',
    bloom: 0.4,
    grade: 'saturate(0.98) contrast(1.05) brightness(1.04)',
    key: { x: 48, y: 42 },
    particles: 'cream',
    out: 'cream',
  },
  {
    id: 'masala-maggi',
    media: 'masala-maggi',
    tab: 'Maggi',
    index: '06',
    name: 'Masala',
    nameAccent: 'Maggi',
    kicker: 'Hostel Nostalgia',
    description:
      'Classic Maggi cooked with desi masala, onions and spices — chatakedar, spicy and full of street-style flavour.',
    detail: 'Cheese · Schezwan · Butter',
    price: '$9.50',
    accent: '#D9B45C',
    accentSoft: 'rgba(217, 180, 92, 0.38)',
    bloom: 0.56,
    grade: 'saturate(1.12) contrast(1.04) brightness(1.02)',
    key: { x: 52, y: 44 },
    particles: 'noodle',
    out: 'ribbons',
  },
  {
    id: 'stuffed-paratha',
    media: 'stuffed-paratha',
    tab: 'Paratha',
    index: '07',
    name: 'Stuffed',
    nameAccent: 'Paratha',
    kicker: 'Off The Tawa',
    description:
      'Soft, flaky paratha with a spiced filling, cooked till golden. Wholesome, filling and warm.',
    detail: 'With chole $14.99',
    price: '$15.50',
    accent: '#B56B3B',
    accentSoft: 'rgba(181, 107, 59, 0.42)',
    bloom: 0.6,
    grade: 'saturate(1.08) contrast(1.07) brightness(1.03)',
    key: { x: 50, y: 47 },
    particles: 'flake',
    out: 'butter',
  },
  {
    id: 'chaat',
    media: 'chaat',
    tab: 'Chaat',
    index: '08',
    name: 'Papadi',
    nameAccent: 'Chaat',
    kicker: 'Street Chaat',
    description:
      'Crispy papadis with spiced potatoes, tangy chutneys, yoghurt and a sprinkle of sev. Assembled the moment you order.',
    detail: 'Eight chaats on the menu',
    price: '$9.50',
    accent: '#96A46A',
    accentSoft: 'rgba(150, 164, 106, 0.36)',
    bloom: 0.46,
    grade: 'saturate(1.1) contrast(1.05) brightness(1.02)',
    key: { x: 50, y: 45 },
    particles: 'masala',
    out: 'spice',
  },
]

export const COUNT = PRODUCTS.length
