import { NextResponse } from "next/server";

import { getProducts, persistProducts, type Product } from "@/app/lib/store";

type ProductRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: ProductRouteContext) {
  const { id } = await context.params;
  const products = await getProducts();
  const product = products.find((item) => item.id === id);

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(request: Request, context: ProductRouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as Partial<Product>;
  const products = await getProducts();
  const index = products.findIndex((item) => item.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const updatedProduct: Product = {
    ...products[index],
    title: body.title?.trim() || products[index].title,
    price: Number(body.price ?? products[index].price),
    category: body.category?.trim() || products[index].category,
    description: body.description?.trim() || products[index].description,
    imageUrl:
      body.imageUrl && body.imageUrl.trim().length > 0
        ? body.imageUrl.trim()
        : products[index].imageUrl,
    gallery:
      body.gallery && body.gallery.length > 0
        ? body.gallery
        : products[index].gallery,
    sizes:
      body.sizes && body.sizes.length > 0
        ? body.sizes
        : products[index].sizes,
    featured: typeof body.featured === "boolean" ? body.featured : products[index].featured,
  };

  products[index] = updatedProduct;
  await persistProducts(products);

  return NextResponse.json(updatedProduct);
}

export async function DELETE(_request: Request, context: ProductRouteContext) {
  const { id } = await context.params;
  const products = await getProducts();
  const filtered = products.filter((item) => item.id !== id);

  if (filtered.length === products.length) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  await persistProducts(filtered);
  return NextResponse.json({ success: true });
}
