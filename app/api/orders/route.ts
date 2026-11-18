import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { getStaff } from "@/lib/session";
import { pageMeta, parsePaging } from "@/lib/pagination";

// GET: Fetch orders for the Dashboard, paginated: /api/orders?page=1&limit=10
export async function GET(request: Request) {
  try {
    if (!(await getStaff())) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }
    await dbConnect();
    const { page: requestedPage, limit } = parsePaging(request.url, { defaultLimit: 10, maxLimit: 100 });
    const total = await Order.countDocuments({});
    const meta = pageMeta(total, requestedPage, limit);
    const orders = await Order.find({}).sort({ createdAt: -1, _id: -1 }).skip(meta.skip).limit(limit);
    return NextResponse.json(
      { success: true, data: orders, pagination: { page: meta.page, limit: meta.limit, total: meta.total, totalPages: meta.totalPages } },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST: Create a new order when customer chooses a plan
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    const newOrder = await Order.create(body);
    return NextResponse.json({ success: true, data: newOrder }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}