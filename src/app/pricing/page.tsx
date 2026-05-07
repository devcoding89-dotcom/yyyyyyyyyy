"use client";

import { useState } from "react";
import { Check, Loader2, Zap, Rocket, ShieldCheck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import PageHeader from "@/components/page-header";
import { useUser } from "@/lib/supabase/provider";
import { useDoc } from "@/hooks/use-supabase-doc";
import { useMemoSupabaseDoc } from "@/hooks/use-memo-supabase";
import { initializePaymentAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const STUDIO_PRICE_NAIRA = 500;

export default function PricingPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const userProfileQuery = useMemoSupabaseDoc({
    tableName: 'users',
    docId: user?.id || '',
  }, [user]);

  const { data: profile } = useDoc(userProfileQuery);

  const subscriptionExpiresAt = profile?.subscription_expires_at || profile?.subscriptionExpiresAt;
  const hasAccess =
    profile?.subscriptionTier === "elite" &&
    (!subscriptionExpiresAt || new Date(subscriptionExpiresAt) > new Date());
  const isExpired =
    profile?.subscriptionTier === "elite" &&
    subscriptionExpiresAt &&
    new Date(subscriptionExpiresAt) <= new Date();

  const handleUpgrade = async () => {
    if (!user || !profile) {
      toast({ title: "Please login first", description: "You need an account to pay." });
      return;
    }

    if (hasAccess) return;

    setLoading(true);
    try {
      const result = await initializePaymentAction(user.email!, STUDIO_PRICE_NAIRA, user.id);

      const authorizationUrl = result?.data?.authorization_url;
      if (!authorizationUrl) {
        throw new Error(result?.message || "Paystack authorization URL missing.");
      }

      window.location.href = authorizationUrl;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Payment Setup Failed",
        description:
          error instanceof Error ? error.message : "Could not connect to Paystack. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 sm:py-12 max-w-5xl px-4 sm:px-6">
      <div className="text-center mb-16 space-y-4">
        <PageHeader
          title="EmailCraft Studio"
          description="Pay ₦500 upfront for one month, then enter the app to use everything inside. No free tier, no trial."
        />
        <p className="text-muted-foreground text-lg">
          Unlimited campaigns, unlimited emails via Gmail, color tracking, auto-skip invalid recipients, and one month access per payment.
        </p>
      </div>

      <div className="max-w-3xl mx-auto grid gap-8 md:grid-cols-1">
        <Card
          className={cn(
            "flex flex-col relative overflow-hidden border-primary/50 shadow-2xl bg-background",
            hasAccess && "border-emerald-500 shadow-emerald-100"
          )}
        >
          <div className="absolute top-0 right-0 p-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 rounded-bl-lg">
            {hasAccess ? "Paid" : "Pay First"}
          </div>

          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">EmailCraft Studio</CardTitle>
              <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
            </div>
            <CardDescription>One plan. One entry fee. Unlimited access inside.</CardDescription>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold">₦{STUDIO_PRICE_NAIRA}</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            {isExpired && (
              <p className="mt-2 text-sm text-rose-500">
                Your previous payment has expired. Pay again to continue using the app.
              </p>
            )}
          </CardHeader>

          <CardContent className="flex-1 space-y-4">
            <div className="space-y-2">
              <FeatureItem text="Unlimited campaigns" highlight />
              <FeatureItem text="Unlimited emails via your Gmail" highlight />
              <FeatureItem text="Color status tracking" highlight />
              <FeatureItem text="Auto-skip invalid addresses" highlight />
              <FeatureItem text="One simple paid plan" highlight />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              className="w-full h-12 text-lg font-bold"
              onClick={handleUpgrade}
              disabled={loading || hasAccess}
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : hasAccess ? (
                <ShieldCheck className="mr-2 h-5 w-5" />
              ) : (
                <Rocket className="mr-2 h-5 w-5" />
              )}
              {hasAccess ? "Access Granted" : `Pay ₦${STUDIO_PRICE_NAIRA} →`}
            </Button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
              <CreditCard className="h-3 w-3" />
              Paystack Secure: Card, Transfer, USSD
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-3">
        <ValueCard
          icon={<ShieldCheck className="h-8 w-8 text-green-500" />}
          title="Nigerian Coverage"
          description="Designed for local payments and workflows."
        />
        <ValueCard
          icon={<Zap className="h-8 w-8 text-amber-500" />}
          title="Unlimited Access"
          description="Use the entire EmailCraft studio after payment."
        />
        <ValueCard
          icon={<CreditCard className="h-8 w-8 text-blue-500" />}
          title="Paystack Payments"
          description="Securely pay with Card, Transfer, or USSD."
        />
      </div>
    </div>
  );
}

function FeatureItem({
  text,
  highlight,
  inactive,
}: {
  text: string;
  highlight?: boolean;
  inactive?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2 text-sm", inactive && "opacity-40")}>
      <Check className={cn("h-4 w-4 shrink-0", highlight ? "text-primary" : "text-muted-foreground")} />
      <span className={highlight ? "font-semibold" : ""}>{text}</span>
    </div>
  );
}

function ValueCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border bg-card text-center space-y-3">
      <div className="flex justify-center">{icon}</div>
      <h3 className="font-bold">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
