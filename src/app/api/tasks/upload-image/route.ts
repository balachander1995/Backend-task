import { NextRequest, NextResponse } from "next/server";
import { uploadImageToStorage } from "@/lib/storage";
import { validateRequest } from "@/server/auth/validateRequest";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const taskId = formData.get("taskId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Upload image to Supabase Storage
    const result = await uploadImageToStorage(file, taskId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
    });
  } catch (err) {
    console.error("Image upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
