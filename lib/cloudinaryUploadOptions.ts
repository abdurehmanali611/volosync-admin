import type { CloudinaryUploadWidgetOptions } from "next-cloudinary";

export const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME ?? "";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

export function isCloudinaryUploadConfigured(): boolean {
  return Boolean(CLOUDINARY_UPLOAD_PRESET && CLOUDINARY_CLOUD_NAME);
}

export const SIGNUP_LOGO_UPLOAD_OPTIONS: CloudinaryUploadWidgetOptions = {
  sources: ["local", "url", "camera"],
  multiple: false,
  maxFiles: 1,
  clientAllowedFormats: ["png", "jpeg", "jpg", "webp", "jfif"],
};

/** Direct upload — works inside Radix sheets/dialogs (Cloudinary widget modal does not). */
export async function uploadImageFileToCloudinary(
  file: File,
  opts?: { folder?: string },
): Promise<string> {
  if (!isCloudinaryUploadConfigured()) {
    throw new Error(
      "Image upload is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_PRESET_NAME in .env.local.",
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  if (opts?.folder) {
    formData.append("folder", opts.folder);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData },
  );

  const data = (await response.json()) as {
    secure_url?: string;
    error?: { message?: string };
  };

  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message || "Image upload failed.");
  }

  return data.secure_url;
}

export const SIGNUP_LOGO_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp,image/jfif";
