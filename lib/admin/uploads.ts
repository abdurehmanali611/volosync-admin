import { ApiError } from "./core";

/** Accepted formats for every image the console uploads (tenant logos, etc.). */
export const IMAGE_ACCEPT =
  "image/png,image/jpeg,image/jpg,image/webp,image/jfif";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set(IMAGE_ACCEPT.split(","));

/** Client-side guard — rejects the wrong file type/size before uploading. */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_MIME.has(file.type.toLowerCase())) {
    return "Use a PNG, JPG, WEBP or JFIF image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Images must be 5 MB or smaller.";
  }
  return null;
}

/**
 * Upload an image straight to Cloudinary and return its secure URL.
 *
 * Uses the unsigned upload preset from `.env.local`:
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   NEXT_PUBLIC_CLOUDINARY_PRESET_NAME
 */
export async function uploadImage(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const presetName = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME;

  if (!cloudName || !presetName) {
    throw new ApiError(
      "Image upload is not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_PRESET_NAME to .env.local.",
    );
  }

  const invalid = validateImageFile(file);
  if (invalid) throw new ApiError(invalid);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", presetName);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData },
  );
  const data = (await response.json().catch(() => ({}))) as {
    secure_url?: string;
    error?: { message?: string };
  };

  if (!response.ok || !data.secure_url) {
    throw new ApiError(data.error?.message || "Image upload failed.");
  }

  return data.secure_url;
}
