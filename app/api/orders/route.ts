import { NextResponse } from "next/server";

import { sendOrderEmail } from "@/app/lib/email";
import { getOrders, makeOrderId, saveOrder, type Order, type OrderItem } from "@/app/lib/orders";

export async function GET() {
  const orders = await getOrders();
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      customer?: {
        firstName?: string;
        lastName?: string;
        email?: string;
        address?: string;
        city?: string;
        country?: string;
      };
      items?: Array<{
        id?: string;
        title?: string;
        category?: string;
        quantity?: number;
        price?: number;
      }>;
      subtotal?: number;
      shipping?: number;
      total?: number;
      currency?: string;
    };

    const customer = {
      firstName: (body.customer?.firstName ?? "").trim(),
      lastName: (body.customer?.lastName ?? "").trim(),
      email: (body.customer?.email ?? "").trim(),
      address: (body.customer?.address ?? "").trim(),
      city: (body.customer?.city ?? "").trim(),
      country: (body.customer?.country ?? "").trim(),
    };

    const items: OrderItem[] = (body.items ?? []).map((item) => ({
      id: item.id ?? "unknown",
      title: item.title ?? "Product",
      category: item.category ?? "General",
      quantity: Number(item.quantity ?? 0),
      price: Number(item.price ?? 0),
    }));

    const subtotal = Number(body.subtotal ?? 0);
    const shipping = Number(body.shipping ?? 0);
    const total = Number(body.total ?? subtotal + shipping);
    const currency = (body.currency ?? "USD").toUpperCase();

    if (
      !customer.firstName ||
      !customer.lastName ||
      !customer.email ||
      !customer.address ||
      !customer.city ||
      !customer.country ||
      items.length === 0 ||
      !Number.isFinite(total) ||
      total <= 0
    ) {
      return NextResponse.json({ error: "Incomplete order details." }, { status: 400 });
    }

    const order: Order = {
      id: makeOrderId(),
      customer,
      items,
      subtotal,
      shipping,
      total,
      currency,
      createdAt: new Date().toISOString(),
      status: "Pending",
    };

    await saveOrder(order);

    try {
      await sendOrderEmail({
        id: order.id,
        customer: order.customer,
        items: order.items.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          price: item.price,
        })),
        total: order.total,
        currency: order.currency,
        createdAt: order.createdAt,
      });
    } catch (error) {
      console.error("Failed to send order email:", error);
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to process order." }, { status: 500 });
  }
}
