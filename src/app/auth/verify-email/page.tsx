"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-anon-key";

async function createSupabaseClient() {
  const { createBrowserClient } = await import("@supabase/ssr");
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export default function EmailVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const email = searchParams.get("email");

  useEffect(() => {
    // Check if user is already verified
    const checkAuth = async () => {
      const supabase = await createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        router.push("/dashboard");
      }
    };

    checkAuth();
  }, [router]);

  const handleResendEmail = async () => {
    if (!email) return;

    setIsResending(true);
    setResendMessage("");

    try {
      const supabase = await createSupabaseClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        setResendMessage("Failed to resend verification email. Please try again.");
      } else {
        setResendMessage("Verification email sent! Please check your inbox.");
      }
    } catch (error) {
      setResendMessage("An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription className="text-base">
            We've sent a verification link to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-4">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">What to do next:</p>
                <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>1. Open your email inbox</li>
                  <li>2. Look for an email from EmailCraft Studio</li>
                  <li>3. Click the "Verify Email" link</li>
                  <li>4. Return here and log in</li>
                </ol>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or{" "}
              <button
                onClick={handleResendEmail}
                disabled={isResending}
                className="font-medium text-primary hover:underline disabled:opacity-50"
              >
                {isResending ? "Sending..." : "resend it"}
              </button>
            </div>

            {resendMessage && (
              <div className={`text-center text-sm ${
                resendMessage.includes("Failed") || resendMessage.includes("error")
                  ? "text-destructive"
                  : "text-green-600"
              }`}>
                {resendMessage}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/login">
                <ArrowRight className="mr-2 h-4 w-4" />
                Continue to Login
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/signup">
                Use Different Email
              </Link>
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            Having trouble? Contact{" "}
            <a
              href="mailto:support@emailcraft.studio"
              className="font-medium text-primary hover:underline"
            >
              support@emailcraft.studio
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}