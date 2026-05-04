
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/paystack/verify
 * Handles Paystack callback and verifies transaction status.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!reference) {
    return NextResponse.redirect(new URL('/pricing?error=no_reference', request.url));
  }

  if (!PAYSTACK_SECRET_KEY) {
    return NextResponse.redirect(new URL('/dashboard?payment=success', request.url));
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (data.status && data.data.status === 'success') {
      const userId = data.data.metadata?.userId;
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      if (userId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          auth: { persistSession: false },
        });

        await supabaseAdmin
          .from('users')
          .update({
            subscription_tier: 'elite',
            subscription_expires_at: expiresAt.toISOString(),
          })
          .eq('id', userId);
      }

      return NextResponse.redirect(new URL('/dashboard?payment=success', request.url));
    } else {
      return NextResponse.redirect(new URL('/pricing?error=verification_failed', request.url));
    }
  } catch (error) {
    console.error("Paystack Verification Error:", error);
    return NextResponse.redirect(new URL('/pricing?error=server_error', request.url));
  }
}
