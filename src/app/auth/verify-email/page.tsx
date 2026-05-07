export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export default function EmailVerificationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-muted/40 px-4" />}>
      <VerifyEmailClient />
    </Suspense>
  );
}
