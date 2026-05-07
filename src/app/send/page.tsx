"use client";

import { useMemo, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/page-header";
import { ArrowRight, Check, Mail, RefreshCcw, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SendRow = {
  id: string;
  email: string;
  status: "pending" | "sent" | "invalid";
};

function normalizeEmails(value: string): SendRow[] {
  return Array.from(new Set(value.split(/\r?\n/).map((line) => line.trim())))
    .filter(Boolean)
    .map((email) => ({
      id: `${email}-${Math.random().toString(36).slice(2, 8)}`,
      email,
      status: emailRegex.test(email) ? "pending" : "invalid",
    }));
}

export default function SendEmailsPage() {
  const [bulkText, setBulkText] = useState("");
  const [rows, setRows] = useState<SendRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [autoSendEnabled, setAutoSendEnabled] = useLocalStorage<boolean>("send-auto-send-enabled", false);
  const [batchSize, setBatchSize] = useLocalStorage<number>("send-auto-send-batch-size", 100);
  const [currentBatchCount, setCurrentBatchCount] = useState(0);
  const [isAutoPaused, setIsAutoPaused] = useState(false);

  const stats = useMemo(() => {
    const total = rows.length;
    const sent = rows.filter((row) => row.status === "sent").length;
    const invalid = rows.filter((row) => row.status === "invalid").length;
    const pending = rows.filter((row) => row.status === "pending").length;
    return { total, sent, invalid, pending };
  }, [rows]);

  const currentRow = useMemo(
    () => rows.find((row) => row.id === activeId) ?? rows.find((row) => row.status === "pending") ?? null,
    [activeId, rows]
  );

  const updateRows = (value: string) => {
    const nextRows = normalizeEmails(value);
    setRows(nextRows);
    setBulkText(value);
    setActiveId(nextRows.find((row) => row.status === "pending")?.id ?? null);
    setCurrentBatchCount(0);
    setIsAutoPaused(false);
  };

  const getNextPending = (list: SendRow[]) => list.find((row) => row.status === "pending") ?? null;

  const openMailto = (email: string) => {
    window.location.href = `mailto:${encodeURIComponent(email)}`;
  };

  const handleOpenGmail = (rowId: string) => {
    const row = rows.find((row) => row.id === rowId);
    if (!row || row.status !== "pending") return;
    setActiveId(rowId);
    openMailto(row.email);
  };

  const handleMarkSent = (rowId: string) => {
    const row = rows.find((row) => row.id === rowId);
    if (!row || row.status !== "pending") return;

    const nextRows = rows.map((item) =>
      item.id === rowId ? { ...item, status: "sent" } : item
    );

    const nextPending = getNextPending(nextRows);
    const nextBatchCount = autoSendEnabled ? currentBatchCount + 1 : currentBatchCount;
    const batchComplete = autoSendEnabled && nextBatchCount >= batchSize;

    setRows(nextRows);
    setCurrentBatchCount(nextBatchCount);
    setIsAutoPaused(batchComplete);
    setActiveId(nextPending?.id ?? null);

    if (autoSendEnabled && !batchComplete && nextPending) {
      openMailto(nextPending.email);
    }
  };

  const handleStart = () => {
    if (!rows.length) return;
    const nextPending = getNextPending(rows);
    setActiveId(nextPending?.id ?? null);
    setCurrentBatchCount(0);
    setIsAutoPaused(false);
  };

  const handleResume = () => {
    const nextPending = getNextPending(rows);
    if (!nextPending) return;
    setIsAutoPaused(false);
    setCurrentBatchCount(0);
    setActiveId(nextPending.id);
    openMailto(nextPending.email);
  };

  const clearAll = () => {
    setBulkText("");
    setRows([]);
    setActiveId(null);
    setCurrentBatchCount(0);
    setIsAutoPaused(false);
  };

  return (
    <div className="container mx-auto py-8 sm:py-12 max-w-7xl px-4 sm:px-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between mb-8">
        <PageHeader
          title="Paste emails"
          description="One email per line. Valid addresses open Gmail, invalid addresses are skipped, and sent rows auto-advance."
          className="max-w-2xl"
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatusPill label="Total" value={stats.total.toString()} color="bg-slate-100 text-slate-900" />
          <StatusPill label="Pending" value={stats.pending.toString()} color="bg-sky-100 text-sky-700" />
          <StatusPill label="Invalid" value={stats.invalid.toString()} color="bg-rose-100 text-rose-700" />
          <StatusPill label="Sent" value={stats.sent.toString()} color="bg-emerald-100 text-emerald-700" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Paste your email list</CardTitle>
            <CardDescription>Use plain text with one email per line. Empty lines are ignored.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={bulkText}
              onChange={(event) => updateRows(event.target.value)}
              rows={18}
              className="w-full min-h-[420px] resize-none rounded-3xl border border-border bg-background px-4 py-4 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              placeholder="akhaleedusman@example.com\ncompany.contact@example.com\n..."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">How it works</p>
                <p>Valid rows become pending. Invalid rows are skipped and never open Gmail.</p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={clearAll}
                  disabled={rows.length === 0}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" /> Clear all
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStart}
                  disabled={stats.pending === 0}
                >
                  <Settings className="mr-2 h-4 w-4" /> Validate & Start
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="space-y-4 border border-border bg-background/80">
          <CardHeader>
            <CardTitle>Auto-send settings</CardTitle>
            <CardDescription>User-controlled batch size for mailto chaining.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-foreground">Batch size</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={batchSize}
                  onChange={(event) => setBatchSize(Math.max(1, Number(event.target.value) || 1))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                <p className="text-xs text-muted-foreground">After this many sent emails, auto-send pauses and waits for you to resume.</p>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-3xl border border-border bg-muted/50 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Auto-send</p>
                  <p className="text-xs text-muted-foreground">Automatically open the next mailto link after each sent message.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoSendEnabled}
                    onChange={(event) => {
                      setAutoSendEnabled(event.target.checked);
                      if (!event.target.checked) {
                        setIsAutoPaused(false);
                        setCurrentBatchCount(0);
                      }
                    }}
                    className="h-4 w-4 rounded border border-border text-primary focus:ring-primary"
                  />
                  ON
                </label>
              </div>

              <div className="rounded-3xl border border-border bg-background p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Batch progress</p>
                <p>
                  {autoSendEnabled
                    ? isAutoPaused
                      ? `Paused after ${currentBatchCount}/${batchSize}. Resume to continue.`
                      : `${currentBatchCount}/${batchSize} in current batch.`
                    : "Auto-send is disabled."}
                </p>
              </div>

              {isAutoPaused && stats.pending > 0 && (
                <Button className="w-full" onClick={handleResume}>
                  Resume auto-send
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="border border-border bg-background/80">
          <CardHeader>
            <CardTitle>Send queue</CardTitle>
            <CardDescription>Track each address status before opening Gmail.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rows.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-muted/50 p-8 text-center text-sm text-muted-foreground">
                Paste emails to review them here.
              </div>
            ) : (
              <div className="space-y-3">
                {rows.map((row) => {
                  const isActive = row.id === currentRow?.id;
                  return (
                    <div
                      key={row.id}
                      className={cn(
                        "rounded-3xl border p-4 transition",
                        isActive ? "border-primary/30 bg-primary/5" : "border-border bg-background"
                      )}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <StatusDot status={row.status} />
                            <span className="truncate">{row.email}</span>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {row.status === "invalid" && "Invalid email address format."}
                            {row.status === "sent" && "Marked sent."}
                            {row.status === "pending" && (isActive ? "🔵 Current" : "Ready to open Gmail.")}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenGmail(row.id)}
                            disabled={row.status !== "pending"}
                          >
                            <Mail className="mr-2 h-4 w-4" /> Open Gmail
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleMarkSent(row.id)}
                            disabled={row.status !== "pending"}
                          >
                            <Check className="mr-2 h-4 w-4" /> Sent
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="space-y-4 border border-border bg-background/80">
          <CardHeader>
            <CardTitle>Auto-send flow</CardTitle>
            <CardDescription>Manual send in Gmail, with optional mailto chaining.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="space-y-3 rounded-3xl border border-border bg-muted/50 p-4">
              <p className="font-semibold text-foreground">Current status</p>
              <p>{currentRow ? `Email ${rows.findIndex((row) => row.id === currentRow.id) + 1} of ${stats.total}` : "No active email."}</p>
              {currentRow && <p className="truncate font-medium text-foreground">📧 {currentRow.email}</p>}
              <p>
                Status:{' '}
                {currentRow ? (
                  currentRow.status === 'pending' ? '🔵 Current' : currentRow.status === 'sent' ? '🟢 Sent' : '🔴 Invalid'
                ) : '⚪ Pending'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span>Open Gmail with the current valid address.</span>
              </div>
              <div className="flex items-center gap-3">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span>Click Sent to advance to the next pending email.</span>
              </div>
              <div className="flex items-center gap-3">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span>Auto-send only chains mailto links; you still press Send in Gmail.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: SendRow["status"] }) {
  const label = status === "sent" ? "Sent" : status === "invalid" ? "Invalid" : "Pending";
  return (
    <span className={cn("flex h-2.5 w-2.5 rounded-full", {
      "bg-emerald-500": status === "sent",
      "bg-rose-500": status === "invalid",
      "bg-sky-500": status === "pending",
    })}>
      <span className="sr-only">{label}</span>
    </span>
  );
}

function StatusPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={cn("rounded-3xl border p-4 text-center", color)}>
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
