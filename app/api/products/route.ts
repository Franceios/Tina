import { NextResponse } from "next/server";

import { getProducts, makeProductId, persistProducts, type Product } from "@/app/lib/store";

export async function GET() {
  const products = await getProducts();
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<Product>;

    const title = (body.title ?? "").trim();
    const price = Number(body.price ?? 0);
    const category = (body.category ?? "Accessories").trim();
    const description = (body.description ?? "").trim();
    const imageUrl =
      body.imageUrl && body.imageUrl.trim().length > 0
        ? body.imageUrl.trim()
        : "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80";

    if (!title || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Title and valid price are required." }, { status: 400 });
    }

    const products = await getProducts();
    const newProduct: Product = {
      id: makeProductId(),
      title,
      price,
      category,
      description: description || "Luxury pieces curated for the modern wardrobe.",
      imageUrl,
      gallery: [imageUrl],
      sizes: body.sizes && body.sizes.length > 0 ? body.sizes : ["One Size"],
      featured: Boolean(body.featured),
    };

    const updated = [newProduct, ...products];
    await persistProducts(updated);

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Unable to create product." }, { status: 500 });
  }
}
