"use client";

import { useState } from "react";
import { validateImageFile } from "@/lib/storage";

interface ImageUploadProps {
  taskId: string;
  onUploadSuccess: (imageUrl: string) => void;
  onUploadError: (error: string) => void;
}

export function ImageUpload({
  taskId,
  onUploadSuccess,
  onUploadError,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      onUploadError(validationError);
      return;
    }

    // Upload file immediately
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("taskId", taskId);

      const response = await fetch("/api/tasks/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        success?: boolean;
        url?: string;
        error?: string;
      };

      if (!response.ok || !data.success) {
        const errorMsg =
          data.error || "Failed to upload image";
        onUploadError(errorMsg);
        return;
      }

      if (data.url) {
        onUploadSuccess(data.url);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      onUploadError(`Upload failed: ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Upload Image</label>

      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {uploading && <span className="text-sm text-gray-500">Uploading...</span>}
      </div>

      <p className="text-xs text-gray-500">
        Allowed formats: JPEG, PNG, WebP • Max size: 5MB
      </p>
    </div>
  );
}

