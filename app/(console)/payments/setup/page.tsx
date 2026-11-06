"use client";

import { Suspense } from "react";
import { ApexPageLoader } from "@/components/apex/ApexPageLoader";
import { ApexPaymentsQueue } from "@/components/apex/payments/ApexPaymentsQueue";

export default function SetupPaymentsPage() {
  return (
    <Suspense fallback={<ApexPageLoader label="Loading setup payments…" />}>
      <ApexPaymentsQueue kind="setup" />
    </Suspense>
  );
}
