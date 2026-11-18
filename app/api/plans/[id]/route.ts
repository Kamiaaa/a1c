import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Plan from "@/models/Plan";
import { getStaff } from "@/lib/session";
import { uploadImage, deleteImage } from "@/lib/cloudinary";
import { checkImageFile, deleteImageByUrl } from "@/lib/imageUrl";

const bad = (error: string, status = 400) => NextResponse.json({ success: false, error }, { status });

// PUT (multipart/form-data): name, price, features (comma separated), image (file, optional - omit to keep current)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await getStaff(['admin']))) return bad("Unauthorized", 403);

    const form = await request.formData().catch(() => null);
    if (!form) return bad("Invalid form data");
    const { id: planId } = await params;

    const name = String(form.get("name") ?? "").trim();
    const price = Number(form.get("price"));
    const features = String(form.get("features") ?? "").split(",").map((f) => f.trim()).filter(Boolean);
    const file = form.get("image");

    if (name.length < 2) return bad("Plan name is required");
    if (!Number.isFinite(price) || price < 0) return bad("Enter a valid price");
    if (features.length === 0) return bad("Add at least one feature");

    await dbConnect();
    const plan = await Plan.findOne({ id: planId });
    if (!plan) return bad("Plan not found", 404);

    let uploadedPublicId: string | null = null;
    let oldImage: string | null = null;
    if (file instanceof File && file.size > 0) {
      const fileProblem = checkImageFile(file);
      if (fileProblem) return bad(fileProblem);
      const up = await uploadImage(file, "a1c/plans");
      uploadedPublicId = up.publicId;
      oldImage = plan.image;
      plan.image = up.url;
    }

    plan.name = name;
    plan.price = price;
    plan.features = features;
    try {
      await plan.save();
    } catch (err) {
      await deleteImage(uploadedPublicId); // roll back the new upload
      throw err;
    }
    await deleteImageByUrl(oldImage); // only after the plan points at the new image

    return NextResponse.json({ success: true, data: plan }, { status: 200 });
  } catch (error) {
    return bad((error as Error).message);
  }
}

// DELETE: Remove a plan by its unique id/slug (and its Cloudinary image)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await getStaff(['admin']))) return bad("Unauthorized", 403);
    await dbConnect();
    const { id: planId } = await params;

    const deletedPlan = await Plan.findOneAndDelete({ id: planId });
    if (!deletedPlan) return bad("Plan not found", 404);
    await deleteImageByUrl(deletedPlan.image);

    return NextResponse.json({ success: true, message: "Plan deleted successfully" }, { status: 200 });
  } catch (error) {
    return bad((error as Error).message, 500);
  }
}
