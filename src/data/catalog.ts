export interface Product {
  id: string;
  name: string;
  category: "men" | "women";
  type: string;
  description: string;
  prompt: string;
  image: string;
  keywords: string[];
}

export const catalog: Product[] = [
  // ─── POLOS ────────────────────────────────────────────────────
  {
    id: "m1",
    name: "Textured Knit Polo",
    category: "men",
    type: "polo",
    description: "Dark green textured knit polo with cream contrast collar and sleeve trim",
    prompt:
      "Substitute the current top with a dark green textured knit polo shirt with a cream contrast collar, open V-neck, cream sleeve cuffs, and ribbed hem, fitting perfectly on the person",
    image: "/products/men/polo-green-textured.jpg",
    keywords: ["polo", "green", "knit", "textured", "collar", "polo shirt", "contrast"],
  },
  {
    id: "m2",
    name: "Contrast Knit Polo",
    category: "men",
    type: "polo",
    description: "Dark brown relaxed fit knit polo with yellow contrast collar",
    prompt:
      "Substitute the current top with a dark chocolate brown relaxed fit knit polo shirt with a pale yellow contrast collar, three-button placket, and short sleeves, fitting perfectly on the person",
    image: "/products/men/polo-brown-contrast.jpg",
    keywords: ["polo", "brown", "chocolate", "knit", "contrast", "collar", "relaxed"],
  },
  {
    id: "m3",
    name: "Knit Textured Polo",
    category: "men",
    type: "polo",
    description: "Cream ecru textured knit polo with open collar and ribbed hem",
    prompt:
      "Substitute the current top with a cream ecru textured knit polo shirt with an open V-neck collar, short sleeves, and ribbed waistband, fitting perfectly on the person",
    image: "/products/men/polo-cream-knit.jpg",
    keywords: ["polo", "cream", "ecru", "knit", "textured", "white", "off-white", "beige"],
  },
  {
    id: "m4",
    name: "Printed Text Polo",
    category: "men",
    type: "polo",
    description: "Sage green relaxed fit polo with Quiet Ocean graphic print",
    prompt:
      "Substitute the current top with a sage green relaxed fit polo shirt with large white Quiet Ocean text graphic on the chest, open V-neck collar, and short sleeves, fitting perfectly on the person",
    image: "/products/men/polo-sage-printed.jpg",
    keywords: ["polo", "sage", "green", "olive", "printed", "graphic", "text", "ocean", "relaxed"],
  },

  // ─── SHIRTS ───────────────────────────────────────────────────
  {
    id: "m5",
    name: "Sky Blue Shirt",
    category: "men",
    type: "shirt",
    description: "Light sky blue long-sleeve button-down dress shirt",
    prompt:
      "Substitute the current top with a light sky blue long-sleeve button-down dress shirt with a pointed collar, white buttons, and clean tailored fit, fitting perfectly on the person",
    image: "/products/men/shirt-sky-blue.jpg",
    keywords: ["shirt", "blue", "sky blue", "light blue", "dress shirt", "button", "formal", "long sleeve"],
  },
  {
    id: "m6",
    name: "Plaid Corduroy Shirt",
    category: "men",
    type: "shirt",
    description: "Pink and grey plaid corduroy button-down shirt with long sleeves",
    prompt:
      "Substitute the current top with a pink and grey plaid corduroy button-down shirt with a pointed collar, dark buttons, and long sleeves, fitting perfectly on the person",
    image: "/products/men/shirt-plaid-corduroy.jpg",
    keywords: ["shirt", "plaid", "corduroy", "pink", "grey", "checkered", "flannel", "long sleeve"],
  },

  // ─── T-SHIRTS ─────────────────────────────────────────────────
  {
    id: "m7",
    name: "Heavyweight T-Shirt Black",
    category: "men",
    type: "tshirt",
    description: "Black heavyweight cotton crew neck t-shirt with relaxed fit",
    prompt:
      "Substitute the current top with a solid black heavyweight cotton crew neck t-shirt with a relaxed boxy fit and short sleeves, fitting perfectly on the person",
    image: "/products/men/tshirt-black-heavyweight.jpg",
    keywords: ["t-shirt", "tee", "black", "heavyweight", "basic", "crew neck", "casual"],
  },
  {
    id: "m8",
    name: "Basic T-Shirt White",
    category: "men",
    type: "tshirt",
    description: "White basic cotton crew neck t-shirt with relaxed fit",
    prompt:
      "Substitute the current top with a clean white basic cotton crew neck t-shirt with a relaxed fit and short sleeves, fitting perfectly on the person",
    image: "/products/men/tshirt-white-basic.jpg",
    keywords: ["t-shirt", "tee", "white", "basic", "crew neck", "casual", "essential"],
  },
];

export function findProducts(query: string): Product[] {
  const q = query.toLowerCase();
  const words = q.split(/\s+/);

  return catalog
    .map((product) => {
      let score = 0;

      for (const keyword of product.keywords) {
        if (q.includes(keyword)) score += 3;
      }

      for (const word of words) {
        if (word.length < 3) continue;
        if (product.name.toLowerCase().includes(word)) score += 2;
        if (product.type.toLowerCase().includes(word)) score += 2;
        if (product.description.toLowerCase().includes(word)) score += 1;
        if (product.category === word) score += 1;
      }

      return { product, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.product);
}
