import { Suspense } from "react";
import VerifyEmailContent from "./VerifyEmailContent";

export const dynamic = "force-dynamic";

export default function EmailVerificationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
