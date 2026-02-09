import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";

// Initialize Supabase client
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const BUCKET_NAME = "task-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface UploadImageResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Validates image file before upload
 */
export function validateImageFile(file: File): string | null {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return `File size exceeds 5MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
  }

  // Check file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return "Only JPEG, PNG, and WebP formats are allowed";
  }

  return null;
}

/**
 * Uploads an image to Supabase Storage
 */
export async function uploadImageToStorage(
  file: File,
  taskId: string
): Promise<UploadImageResult> {
  try {
    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      return { success: false, error: validationError };
    }

    // Generate unique filename
    // Generate unique filename
    const fileExtension = file.name.split(".").pop() ?? "jpg";
    const fileName = `${taskId}-${Date.now()}.${fileExtension}`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`task-images/${fileName}`, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return {
        success: false,
        error: `Upload failed: ${error.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(`task-images/${fileName}`);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (err) {
    return {
      success: false,
      error: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Deletes an image from Supabase Storage
 */
export async function deleteImageFromStorage(
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split("/");
    const fileName = urlParts[urlParts.length - 1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([`task-images/${fileName}`]);

    if (error) {
      return {
        success: false,
        error: `Delete failed: ${error.message}`,
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
