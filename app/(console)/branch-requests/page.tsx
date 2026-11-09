import { Suspense } from "react";
import { ApexPageLoader } from "@/components/apex/ApexPageLoader";
import { ApexBranchRequestsQueue } from "@/components/apex/branches/ApexBranchRequestsQueue";

export default function BranchRequestsPage() {
  return (
    <Suspense fallback={<ApexPageLoader label="Loading branch requests…" />}>
      <ApexBranchRequestsQueue />
    </Suspense>
  );
}
