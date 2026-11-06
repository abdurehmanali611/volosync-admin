import { Suspense } from "react";
import { ApexPageLoader } from "@/components/apex/ApexPageLoader";
import { ApexPaymentsQueue } from "@/components/apex/payments/ApexPaymentsQueue";

export default function YearlyPaymentsPage() {
  return (
    <Suspense fallback={<ApexPageLoader label="Loading yearly payments…" />}>
      <ApexPaymentsQueue kind="yearly" />
    </Suspense>
  );
}
