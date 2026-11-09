import { Suspense } from "react";
import { ApexPageLoader } from "@/components/apex/ApexPageLoader";
import { ApexPaymentsQueue } from "@/components/apex/payments/ApexPaymentsQueue";
import { ApexBranchPaymentsPanel } from "@/components/apex/payments/ApexBranchPaymentsPanel";

export default function YearlyPaymentsPage() {
  return (
    <Suspense fallback={<ApexPageLoader label="Loading yearly payments…" />}>
      <div className="space-y-8">
        <ApexBranchPaymentsPanel />
        <ApexPaymentsQueue kind="yearly" />
      </div>
    </Suspense>
  );
}
