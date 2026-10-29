import fs from "fs/promises";
import path from "path";

export type Product = {
  id: string;
  title: string;
  price: number;
  category: string;
  description: string;
  imageUrl: string;
  gallery: string[];
  sizes: string[];
  featured: boolean;
};

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "p-1",
    title: "Velvet Rose Satin Set",
    price: 180,
    category: "Dresses",
    description:
      "A statement satin set with soft drape, flattering silhouette, and a luxurious rose-toned finish designed for elegant evenings.",
    imageUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    featured: true,
  },
  {
    id: "p-2",
    title: "Gold Luxe Handbag",
    price: 240,
    category: "Accessories",
    description:
      "A polished gold-tone handbag with structured lines, ample storage, and a refined finish for elevated everyday styling.",
    imageUrl:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=80",
    ],
    sizes: ["One Size"],
    featured: true,
  },
  {
    id: "p-3",
    title: "Pearl Evening Heels",
    price: 210,
    category: "Shoes",
    description:
      "Sculpted heeled sandals adorned with pearl trim for luminous evening occasions and statement looks.",
    imageUrl:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=80",
    ],
    sizes: ["5", "6", "7", "8", "9"],
    featured: true,
  },
  {
    id: "p-4",
    title: "Ivory Silk Scarf",
    price: 95,
    category: "Accessories",
    description:
      "An airy silk scarf with a delicate sheen and timeless silhouette, perfect for layering and gifting.",
    imageUrl:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
    ],
    sizes: ["One Size"],
    featured: false,
  },
];

const DATA_PATH = path.join(process.cwd(), "data", "products.json");

async function ensureStoreFile() {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  try {
    await fs.access(DATA_PATH);
  } catch {
    await fs.writeFile(DATA_PATH, JSON.stringify(DEFAULT_PRODUCTS, null, 2), "utf-8");
  }
}

export async function getProducts(): Promise<Product[]> {
  await ensureStoreFile();

  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Product[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // ignore and fall back to defaults
  }

  await fs.writeFile(DATA_PATH, JSON.stringify(DEFAULT_PRODUCTS, null, 2), "utf-8");
  return DEFAULT_PRODUCTS;
}

export async function persistProducts(products: Product[]) {
  await ensureStoreFile();
  await fs.writeFile(DATA_PATH, JSON.stringify(products, null, 2), "utf-8");
}

export function makeProductId() {
  return `p-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}
