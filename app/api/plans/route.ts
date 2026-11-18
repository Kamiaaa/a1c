import { NextResponse } from "next/server";
import dbConnect from "@/lib/db"; // Update path to match your DB connection utility
import Plan from "@/models/Plan";
import { getStaff } from "@/lib/session";
import { uploadImage, deleteImage } from "@/lib/cloudinary";
import { checkImageFile } from "@/lib/imageUrl";

// GET: Fetch all plans
export async function GET() {
  try {
    await dbConnect();
    const plans = await Plan.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: plans }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

const bad = (error: string, status = 400) => NextResponse.json({ success: false, error }, { status });

// POST (multipart/form-data): id, name, price, features (comma separated), image (file, required)
export async function POST(request: Request) {
  try {
    if (!(await getStaff(['admin']))) return bad("Unauthorized", 403);

    const form = await request.formData().catch(() => null);
    if (!form) return bad("Invalid form data");

    const id = String(form.get("id") ?? "").trim();
    const name = String(form.get("name") ?? "").trim();
    const price = Number(form.get("price"));
    const features = String(form.get("features") ?? "").split(",").map((f) => f.trim()).filter(Boolean);
    const file = form.get("image");

    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{1,59}$/.test(id)) return bad("Plan ID must be 2-60 characters: letters, numbers, - or _ (e.g. bijoy-25-mbps)");
    if (name.length < 2) return bad("Plan name is required");
    if (!Number.isFinite(price) || price < 0) return bad("Enter a valid price");
    if (features.length === 0) return bad("Add at least one feature");
    if (!(file instanceof File) || file.size === 0) return bad("Please choose an image");
    const fileProblem = checkImageFile(file);
    if (fileProblem) return bad(fileProblem);

    await dbConnect();
    if (await Plan.exists({ id })) return bad("A plan with this ID already exists", 409);

    const { url, publicId } = await uploadImage(file, "a1c/plans");
    try {
      const newPlan = await Plan.create({ id, name, price, image: url, features });
      return NextResponse.json({ success: true, data: newPlan }, { status: 201 });
    } catch (err) {
      await deleteImage(publicId); // do not leave an orphan upload behind
      throw err;
    }
  } catch (error) {
    return bad((error as Error).message);
  }
}
