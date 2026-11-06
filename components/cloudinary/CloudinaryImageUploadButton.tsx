"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  isCloudinaryUploadConfigured,
  SIGNUP_LOGO_ACCEPT,
  uploadImageFileToCloudinary,
} from "@/lib/cloudinaryUploadOptions";
import clsx from "clsx";

function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(url);
}

type Props = {
  previewUrl?: string | null;
  fileType?: "image" | "video" | null;
  inputClassName?: string;
  onSuccess: (result: {
    event: "success";
    info: { secure_url: string };
  }) => void;
};

export function CloudinaryImageUploadButton({
  previewUrl,
  fileType,
  inputClassName,
  onSuccess,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const openPicker = () => {
    if (uploading) return;
    if (!isCloudinaryUploadConfigured()) {
      toast.error(
        "Image upload is not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_PRESET_NAME to .env.local.",
      );
      return;
    }
    inputRef.current?.click();
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    setUploading(true);
    try {
      const secure_url = await uploadImageFileToCloudinary(file);
      onSuccess({ event: "success", info: { secure_url } });
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <input
        ref={inputRef}
        type="file"
        accept={SIGNUP_LOGO_ACCEPT}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => void onFileChange(e)}
      />
      <Button
        type="button"
        onClick={openPicker}
        variant="outline"
        disabled={uploading}
        className={clsx("flex cursor-pointer items-center gap-2", inputClassName)}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {uploading ? "Uploading…" : previewUrl ? "Change image" : "Browse image"}
      </Button>
      {previewUrl ? (
        <div className="relative flex flex-col items-center">
          <div className="w-fit rounded-lg border bg-gray-50 p-2">
            {fileType === "video" || isVideoUrl(previewUrl) ? (
              <video
                src={previewUrl}
                controls
                className="h-40 w-40 rounded-md object-cover"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <Image
                src={previewUrl}
                alt="Uploaded preview"
                width={100}
                height={100}
                unoptimized
                className="rounded-md object-cover"
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
