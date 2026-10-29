import fs from "fs/promises";
import path from "path";

export type OrderItem = {
  id: string;
  title: string;
  category: string;
  quantity: number;
  price: number;
};

export type OrderCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  country: string;
};

export type Order = {
  id: string;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  createdAt: string;
  status: "Pending" | "Processing" | "Completed";
};

const ORDERS_PATH = path.join(process.cwd(), "data", "orders.json");

async function ensureOrdersFile() {
  await fs.mkdir(path.dirname(ORDERS_PATH), { recursive: true });
  try {
    await fs.access(ORDERS_PATH);
  } catch {
    await fs.writeFile(ORDERS_PATH, JSON.stringify([], null, 2), "utf-8");
  }
}

export async function getOrders(): Promise<Order[]> {
  await ensureOrdersFile();

  try {
    const raw = await fs.readFile(ORDERS_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Order[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveOrder(order: Order) {
  await ensureOrdersFile();
  const orders = await getOrders();
  const next = [order, ...orders];
  await fs.writeFile(ORDERS_PATH, JSON.stringify(next, null, 2), "utf-8");
  return order;
}

export async function saveOrders(orders: Order[]) {
  await ensureOrdersFile();
  await fs.writeFile(ORDERS_PATH, JSON.stringify(orders, null, 2), "utf-8");
}

export function makeOrderId() {
  return `ord-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}
