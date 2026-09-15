/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE MENU — transcribed from "MR.CHAIWALA MENU update.pdf" (text layer, then
 *  checked against the rendered pages).
 *
 *  Prices are AUD and exactly as printed. Item names keep the client's spelling
 *  except for three unambiguous typos: "CHEESSE" → Cheese, "AL00" (zeros) →
 *  Aloo, "LODED" → Loaded (the same menu spells "Loaded Fries" correctly).
 *
 *  Omitted: "Redbull $4.50" exists in the PDF's text layer but is hidden on the
 *  printed page, so it is treated as removed. Add it back here if it is sold.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface MenuItem {
  name: string
  price: number
  description?: string
  /** e.g. "7 pieces" */
  note?: string
}

export interface MenuGroup {
  title?: string
  items: MenuItem[]
}

export interface MenuCategory {
  id: string
  title: string
  /** One line of house voice, shown under the category title. */
  lede: string
  groups: MenuGroup[]
  /** Hero-plate media for categories that have footage. */
  media?: import('@/lib/media').MediaKey
}

const i = (name: string, price: number, description?: string, note?: string): MenuItem => ({
  name,
  price,
  description,
  note,
})

export const MENU: MenuCategory[] = [
  {
    id: 'hot-drinks',
    title: 'Hot Drinks',
    lede: 'Where every night here begins.',
    media: 'signature-chai',
    groups: [
      {
        items: [
          i('Chai Cutting', 3.5, 'Strong, hot Indian tea brewed with fresh milk and aromatic tea leaves, served in a perfect half glass.'),
          i('Chai Full', 5.5, 'A full glass of classic Indian chai brewed with fresh milk and strong tea leaves.'),
          i('Coffee', 5.5, 'A classic hot coffee brewed from quality beans — rich aroma, smooth and satisfying.'),
          i('Bournvita (Hot / Cold)', 5.5, 'A warm, comforting chocolate drink blended with rich milk and classic Bournvita.'),
          i('Green Tea', 5.5, 'Light and soothing, brewed from carefully selected green tea leaves.'),
          i('Black Tea', 5.5, 'Strong premium tea without milk — bold, clean and naturally aromatic.'),
        ],
      },
    ],
  },
  {
    id: 'cold-drinks',
    title: 'Cold Drinks',
    lede: 'Chilled, poured to order.',
    groups: [
      {
        items: [
          i('Sweet Lassi', 6, 'Creamy, velvety yogurt with a touch of sweetness, served ice-cold.'),
          i('Salted Lassi', 6, 'Smooth yogurt whipped with a pinch of salt and subtle spices.'),
          i('Iced Tea', 7, 'Freshly brewed tea, chilled and lightly sweetened.'),
          i('Cold Coffee', 7, 'Rich coffee blended with cold milk and ice — creamy and frothy.'),
        ],
      },
      {
        title: 'Soft Drinks',
        items: [i('Coke', 4), i('Coke No Sugar', 4), i('Fanta', 4), i('Sprite', 4)],
      },
    ],
  },
  {
    id: 'soda',
    title: 'Soda',
    lede: 'Fizz, spice and a squeeze of lemon.',
    groups: [
      {
        items: [
          i('Lemon', 5.5, 'Chilled lemon-flavoured soda, bubbly and refreshing.'),
          i('Jal Jeera', 5.5, 'Chilled jal jeera with a hint of mint and sparkling soda — tangy and fizzy.'),
          i('Lemon Jal Jeera', 6.5, 'Zesty lemon and spiced jal jeera over sparkling soda, with a minty touch.'),
          i('Masala Soda', 6.5, 'Sparkling soda with traditional spices and mint.'),
        ],
      },
    ],
  },
  {
    id: 'shakes',
    title: 'Shakes',
    lede: 'Blended thick. Served cold.',
    media: 'kitkat-shake',
    groups: [
      {
        items: [
          i('Oreo Shake', 9, 'Crushed Oreo cookies blended with creamy milk and ice cream.'),
          i('KitKat Shake', 9, 'Crispy KitKat blended with creamy milk and ice cream.'),
          i('Ferrero Rocher', 10, 'Ferrero Rocher chocolate and premium ice cream — a luxurious treat.'),
        ],
      },
    ],
  },
  {
    id: 'sandwich',
    title: 'Sandwich',
    lede: 'From simple buttered toast to the grill.',
    groups: [
      {
        title: 'Non Grill',
        items: [
          i('Bread Butter', 4.5, 'Golden toasted bread with rich, creamy butter.'),
          i('Bread Jam', 4.5, 'Golden toasted bread spread with rich, fruity jam.'),
          i('Chocolate Sandwich', 5.5, 'Toasted sandwich generously stuffed with smooth chocolate.'),
          i('Cheese Bread', 5.5, 'Golden toasted bread loaded with creamy melted cheese.'),
        ],
      },
      {
        title: 'Regular Grill',
        items: [
          i('Cheese Grill', 8.5, 'Grilled with layers of creamy melted cheese.'),
          i('Cheese Chilli', 9.5, 'Creamy cheese and zesty green chillies, grilled.'),
          i('Cheese Garlic', 9.5, 'Melted cheese with a hint of garlic.'),
          i('Cheese Vegetable', 9.5, 'Creamy melted cheese with a colourful mix of fresh vegetables.'),
          i('Schezwan Sandwich', 9.5, 'Zesty Schezwan sauce, fresh veggies and melted cheese.'),
        ],
      },
    ],
  },
  {
    id: 'premium-sandwich',
    title: 'Premium Sandwich',
    lede: 'Built tall, grilled golden.',
    media: 'paneer-sandwich',
    groups: [
      {
        items: [
          i('Paneer Tandoori', 15.5, 'Char-grilled paneer in rich tandoori masala with fresh veggies and toasted bread.'),
          i('Panjabi Touch', 15.5, 'Grilled with melted cheese and a Punjabi-style masala — full on swaad.'),
          i('Indian Exotic', 15.5, 'Aromatic masala, vegetables and cheese, layered for an elevated desi experience.'),
          i('Russian Touch', 15.5, 'Creamy Russian dressing and light Indian spices with veggies and cheese.'),
          i('American Touch', 15.5, 'Crunchy veggies with classic mayo and cheese, grilled till golden.'),
          i('Western Touch', 15.5, 'Garden vegetables with creamy mayo and mild herbs, grilled till golden.'),
        ],
      },
    ],
  },
  {
    id: 'newly-added',
    title: 'Newly Added',
    lede: 'The latest from the kitchen.',
    groups: [
      {
        items: [
          i('Avocado Toast', 9.5, 'Creamy avocado with fresh vegetables and light seasoning on toasted bread.'),
          i('Cheese Corn Toast', 9.5, 'Toasted bread topped with sweet corn, creamy cheese and mild seasoning.'),
          i('Aloo Toast', 9.5, 'Toasted bread with spiced mashed potatoes and mild herbs.'),
          i('Pizza Toast', 12.5, 'Tangy pizza sauce, vegetables and melted cheese on crispy toast.'),
          i('Samosa Sandwich', 12.5, 'Crushed samosa with chutneys, onions and spices between toasted bread.'),
          i('Bhakhari Pizza', 8, 'Crispy bhakhri base with pizza sauce, fresh vegetables and melted cheese.'),
        ],
      },
    ],
  },
  {
    id: 'between-the-buns',
    title: 'Between the Buns',
    lede: 'Mumbai, pressed into soft pav.',
    media: 'vada-pav',
    groups: [
      {
        title: 'Vada & Samosa Pav',
        items: [
          i('Dabeli', 7.5, 'Gujarat’s street classic: spicy-sweet potato in dabeli masala with peanuts, pomegranate, chutneys and crunchy sev.'),
          i('Classic Vadapav', 7.5, 'Spicy potato vada in gram-flour batter, in soft pav with green and dry garlic chutney.'),
          i('Cheese Vadapav', 8.5, 'Spicy potato vada with melted cheese, green chutney and dry garlic chutney.'),
          i('Bombay Style Vadapav', 7.5, 'Crispy vada with fiery dry garlic chutney, green chutney and a touch of butter.'),
          i('Schezwan Vadapav', 7.5, 'Crispy vada with fiery Schezwan sauce, green chutney and a hint of butter.'),
          i('Classic Samosa Pav', 7.5, 'Golden samosa in soft pav with green chutney and dry garlic chutney.'),
          i('Cheese Samosa Pav', 8.5, 'Golden samosa with melted cheese, green chutney and dry garlic chutney.'),
          i('Loaded Samosa Pav', 9.5, 'Samosa loaded with butter, melted cheese, chutneys, onions and crunchy toppings.'),
          i('Classic Masala Pav', 7.5, 'Soft pav tossed in buttery Bombay-style masala with onions and capsicum.'),
          i('Cheese Masala Pav', 8.5, 'Bombay-style masala pav finished with generous melted cheese.'),
        ],
      },
      {
        title: 'Katka & Grill',
        items: [
          i('Katka Pav', 7.5, 'Spicy mashed vegetables with garlic, onions and special masala, with soft pav.'),
          i('Cheese Katka Pav', 8.5, 'Katka-style vegetable mash topped with melted cheese, with soft pav.'),
          i('Cheese Grill Vadapav', 9.5, 'Vada layered with chutneys and melted cheese, grilled in soft pav.'),
          i('Grill Vadapav', 8.5, 'Potato vada with spicy chutneys, grilled in soft pav.'),
          i('Grill Samosa Pav', 8.5, 'Samosa grilled with butter and spices for a smoky twist.'),
          i('Grill Samosa Pav Loaded', 9.5, 'Grilled samosa topped with chutneys, onions and melted cheese.'),
        ],
      },
    ],
  },
  {
    id: 'bun-muska',
    title: 'Bun Muska',
    lede: 'Butter, pav and a hot tawa.',
    groups: [
      {
        items: [
          i('Butter Muska', 7.99, 'Fluffy bread with rich, creamy butter, lightly toasted.'),
          i('Jam Muska', 8.99, 'Fresh pav with generous butter and fruity jam, lightly toasted.'),
          i('Chocolate Muska', 8.99, 'Fresh pav with loads of butter and chocolate spread.'),
          i('Cheese Muska', 8.99, 'Soft pav with creamy butter and melted cheese.'),
          i('Garlic Bread', 8.99, 'Toasted bread with aromatic garlic butter and herbs.'),
          i('Cheese Garlic Bread', 9.99, 'Garlic bread topped with melted cheese and herbs.'),
        ],
      },
    ],
  },
  {
    id: 'roti',
    title: 'Roti',
    lede: 'Off the tawa, served warm.',
    media: 'stuffed-paratha',
    groups: [
      {
        items: [
          i('Thepla', 9.5, 'Soft Gujarati flatbread with whole wheat, spices and herbs.'),
          i('Plain Paratha', 8.5, 'Soft, flaky paratha cooked on a hot tawa until golden.'),
          i('Stuffed Paratha', 15.5, 'Flaky paratha with a spiced filling, cooked till golden.'),
        ],
      },
    ],
  },
  {
    id: 'dhabawala-special',
    title: 'Dhabawala Special',
    lede: 'Slow-cooked bhaji, buttered pav.',
    groups: [
      {
        items: [
          i('Pav Bhaji', 15.5, 'Rich, spicy vegetable bhaji slow-cooked in butter and special masala, with soft buttered pav.'),
          i('Butter Pav Bhaji', 16.5, 'Butter-loaded bhaji with special spices and pav toasted in butter.'),
          i('Cheese Pav Bhaji', 17.5, 'Mumbai-style bhaji topped with melted cheese, with soft buttered pav.'),
        ],
      },
    ],
  },
  {
    id: 'chole',
    title: 'Chole',
    lede: 'Spiced chickpeas, the North Indian way.',
    groups: [
      {
        items: [
          i('Chole Kulcha', 13.99, 'Soft, fluffy kulchas with spicy chickpea curry.'),
          i('Chole Plain Paratha', 13.99, 'Flaky plain parathas with spicy chickpea curry.'),
          i('Chole with Stuffed Paratha', 14.99, 'Stuffed parathas with spicy, aromatic chickpea curry.'),
        ],
      },
    ],
  },
  {
    id: 'maggi',
    title: 'Maggi',
    lede: 'Two minutes in theory.',
    media: 'masala-maggi',
    groups: [
      {
        items: [
          i('Kids Maggi', 8.5, 'Mild Maggi with light seasoning — kid-approved.'),
          i('Masala Maggi', 9.5, 'Maggi with desi masala, onions and spices.'),
          i('Veg Maggi', 9.5, 'Maggi with fresh vegetables and mild spices.'),
          i('Veg Cheese Maggi', 10.5, 'Vegetables and desi spices, finished with melted cheese.'),
          i('Schezwan Maggi', 9.5, 'Tossed in fiery Schezwan sauce with vegetables.'),
          i('Cheese Schezwan Maggi', 10.5, 'Schezwan Maggi with vegetables and melted cheese.'),
          i('Cheese Maggi', 10.5, 'Classic Maggi topped with melted cheese.'),
          i('Cheese Corn Maggi', 10.5, 'Sweet corn and desi spices, finished with melted cheese.'),
          i('Butter Maggi', 10.5, 'Cooked in rich butter with mild spices.'),
          i('Hakka Noodles', 14.99, 'Stir-fried noodles with vegetables, soy sauce and aromatic spices.'),
          i('Cheese Nachos', 13.5, 'Crispy nachos with warm melted cheese — made for sharing.'),
        ],
      },
    ],
  },
  {
    id: 'pasta',
    title: 'Pasta',
    lede: 'Italian in shape. Desi at heart.',
    media: 'pasta',
    groups: [
      {
        items: [
          i('Red Sauce', 15.5, 'Tangy tomato sauce with herbs and fresh vegetables.'),
          i('White Sauce', 15.5, 'Smooth, creamy white sauce with herbs and fresh vegetables.'),
          i('Pink Sauce', 16.5, 'Creamy white and tangy red sauce with herbs and vegetables.'),
        ],
      },
    ],
  },
  {
    id: 'fries',
    title: 'Fries',
    lede: 'Crisp, golden, seasoned five ways.',
    groups: [
      {
        items: [
          i('Salted', 7.99, 'Crispy golden fries, lightly salted.'),
          i('Peri Peri', 9.99, 'Tossed in spicy peri-peri seasoning.'),
          i('Salt and Pepper', 8.99, 'Seasoned with salt and cracked black pepper.'),
          i('Chataka Pataka', 9.99, 'Tangy, spicy desi masalas — chatakedar and teekha.'),
          i('Loaded Fries', 10.99, 'Loaded with melted cheese, sauces and toppings.'),
        ],
      },
    ],
  },
  {
    id: 'puff',
    title: 'Puff',
    lede: 'Flaky pastry, warm inside.',
    groups: [
      {
        items: [
          i('Veg Puff', 7.5, 'Golden pastry filled with spiced mixed vegetables.'),
          i('Paneer Puff', 8.5, 'Golden pastry filled with spiced paneer.'),
          i('Mayo Puff', 9.5, 'Crispy puff with creamy mayonnaise and fresh vegetables.'),
          i('Stuffed Puff', 10.5, 'Puff pastry stuffed with vegetables, cheese and savoury fillings.'),
        ],
      },
    ],
  },
  {
    id: 'chaat',
    title: 'Chaat',
    lede: 'Assembled the moment you order.',
    media: 'chaat',
    groups: [
      {
        items: [
          i('Pani Puri', 8, 'Hollow puris with spicy potato, chickpeas and tangy flavoured water.', '7 pieces'),
          i('Masala Puri', 8, 'Puris with tangy potato and chickpea, chutneys and fresh herbs.', '7 pieces'),
          i('Sev Puri', 8.5, 'Puris with chutneys, spiced potatoes, fresh vegetables and crunchy sev.', '6 pieces'),
          i('Dahi Puri', 9.5, 'Puris with spiced potatoes and chickpeas, creamy yogurt, chutneys and sev.', '6 pieces'),
          i('Papadi Chaat', 9.5, 'Crispy papadis with spiced potatoes, tangy chutneys, yogurt and sev.'),
          i('Samosa Chaat', 12.5, 'Broken samosa with spiced chickpeas, chutneys, yogurt and sev.'),
          i('Corn Chaat', 6, 'Sweet corn with tangy spices, fresh herbs and a hint of lemon.'),
          i('Bombay Bhel', 10.5, 'Puffed rice, sev, fresh vegetables and tangy chutneys.'),
        ],
      },
    ],
  },
  {
    id: 'timepass',
    title: 'Timepass',
    lede: 'Something small for the table.',
    groups: [
      {
        items: [
          i('Popcorn', 5, 'Light, fluffy and perfectly seasoned.'),
          i('Gulab Jamun', 5, 'Milk dumplings in cardamom sugar syrup.', '2 pieces'),
          i('Gulab Jamun with Ice Cream', 6, 'Served with vanilla ice cream.'),
        ],
      },
      {
        title: 'Snacks',
        items: [
          i('Parle G', 2.99),
          i('Monaco', 2.99),
          i('50-50', 2.99),
          i('Toast', 2.99),
          i('Kurkure', 3.49),
          i('Lays', 3.49),
          i('Khakhra', 3.49),
          i('Stuffed Khakhra', 4.49),
          i('Loaded Chips (Kurkure / Lays)', 5.99),
          i('Samosa', 6.99),
        ],
      },
    ],
  },
  {
    id: 'gujju',
    title: 'Gujju',
    lede: 'Comfort from Gujarat.',
    groups: [
      {
        items: [
          i('Choraafali', 10.5, 'Crunchy, flaky Gujarati snack of spiced gram-flour dough, lightly seasoned.'),
          i('Khichdi + Chaas + Papad', 15.5, 'Soft khichdi with refreshing chaas (buttermilk) and crispy papad.'),
        ],
      },
    ],
  },
  {
    id: 'ice-cream',
    title: 'Ice Cream',
    lede: 'To finish.',
    groups: [
      {
        items: [
          i('Casata', 6.5, 'Layered dessert with sponge cake, flavoured cream and fruits or nuts.'),
          i('American Dry Fruit', 6.5, 'Creamy ice cream loaded with almonds, cashews and pistachios.'),
          i('Kesar Pista', 6, 'Saffron ice cream loaded with crunchy pistachios.'),
        ],
      },
    ],
  },
  {
    id: 'kulfi',
    title: 'Kulfi',
    lede: 'Dense, slow-frozen, traditional.',
    groups: [
      {
        items: [
          i('Mava', 5, 'Rich, creamy mava (khoya) with subtle cardamom.'),
          i('Rose', 5, 'Creamy kulfi infused with delicate rose.'),
          i('Kesar Pista', 5, 'Saffron kulfi loaded with crunchy pistachios.'),
        ],
      },
    ],
  },
]

/* ── derived ─────────────────────────────────────────────────────────────────── */

export const allItems = (c: MenuCategory) => c.groups.flatMap((g) => g.items)

export const MENU_ITEM_COUNT = MENU.reduce((n, c) => n + allItems(c).length, 0)

/** Lowest price in a category, for "from $x" labels. */
export const fromPrice = (c: MenuCategory) => Math.min(...allItems(c).map((x) => x.price))

/** $3.50, $9.00, $14.99 — always two decimals, the way the printed menu reads. */
export const formatPrice = (n: number) => `$${n.toFixed(2)}`

/** Printed house rules, lightly corrected for grammar. */
export const HOUSE_RULES = {
  terms: [
    'Orders cannot be cancelled once placed.',
    'Right of admission is reserved by the management.',
    'We keep a respectful environment. Abusive language or disrespect towards staff will result in denial of service.',
    'Management takes no responsibility for customers’ belongings.',
  ],
  allergy:
    'Our menu items may contain or come into contact with allergens including, but not limited to, gluten, peanuts, tree nuts, dairy, eggs, soy and sesame. Despite our best efforts, cross-contamination may occur. If you have a food allergy, please speak to the manager on duty.',
  premises: [
    'Smoking is not permitted on the premises.',
    'Outside food, drinks and alcohol are not permitted.',
    'Prices may change without prior notice.',
  ],
} as const
