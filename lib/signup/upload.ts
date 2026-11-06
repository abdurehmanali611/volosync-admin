/* eslint-disable @typescript-eslint/no-explicit-any */
import { UseFormReturn } from "react-hook-form";

type CloudinarySuccessResult = {
  event: "success";
  info: { secure_url: string };
};

export const handleUploadSuccess = (
  result: unknown,
  form: UseFormReturn<any>,
  setPreviewUrl: (url: string | null) => void,
  formField: string,
) => {
  if (
    typeof result == "object" &&
    result !== null &&
    "event" in result &&
    result.event == "success" &&
    "info" in result &&
    typeof result.info == "object" &&
    result.info !== null &&
    "secure_url" in result.info
  ) {
    const secured_url = (result as CloudinarySuccessResult).info.secure_url;

    form.setValue(formField, secured_url, { shouldValidate: true });
    setPreviewUrl(secured_url);
  } else {
    console.error(
      "Cloudinary Upload Failed or returned an unexpected structure.",
    );

    form.setValue(formField, "");
    setPreviewUrl(null);
  }
};

export function uploadSignupImage(
  result: unknown,
  form: UseFormReturn<any>,
  setPreviewUrl: (url: string | null) => void,
  formField: string,
) {
  handleUploadSuccess(result, form, setPreviewUrl, formField);
}
