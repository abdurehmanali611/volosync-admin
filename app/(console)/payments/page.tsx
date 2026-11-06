"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApexPageLoader } from "@/components/apex/ApexPageLoader";

function PaymentsLegacyRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const kind = searchParams.get("kind");
    router.replace(
      kind === "yearly" ? "/payments/yearly" : "/payments/setup",
    );
  }, [router, searchParams]);

  return <ApexPageLoader label="Redirecting…" />;
}

/** Legacy /payments and /payments?kind= → dedicated setup or yearly routes */
export default function PaymentsIndexPage() {
  return (
    <Suspense fallback={<ApexPageLoader label="Redirecting…" />}>
      <PaymentsLegacyRedirect />
    </Suspense>
  );
}
