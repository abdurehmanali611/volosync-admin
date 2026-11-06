"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { ImagePlus, Loader2, MessageCircle, Send, X } from "lucide-react";
import { closeFeedbackThread, fetchFeedbackThread, sendApexFeedback } from "@/lib/apex/actions";
import {
  isCloudinaryUploadConfigured,
  uploadImageFileToCloudinary,
} from "@/lib/cloudinaryUploadOptions";
import { ApexFeedbackTenantContext } from "@/components/apex/feedback/ApexFeedbackTenantContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApexPageLoader } from "@/components/apex/ApexPageLoader";
import { ApexPageHeader } from "@/components/apex/layout/ApexPageHeader";
import { ApexPanel } from "@/components/apex/layout/ApexPanel";
import { ApexEmptyState } from "@/components/apex/layout/ApexEmptyState";
import { cn } from "@/lib/utils";

const CHAT_MAX_IMAGES = 5;
const CHAT_IMAGE_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp,image/jfif";

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function FeedbackThreadPage() {
  const params = useParams();
  const threadId = Number(params.id);
  const [thread, setThread] = useState<Awaited<ReturnType<typeof fetchFeedbackThread>> | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => fetchFeedbackThread(threadId).then(setThread);

  useEffect(() => {
    void load();
  }, [threadId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread?.messages.length]);

  let lastDate = "";
  const messagesWithDividers = (thread?.messages ?? []).map((msg) => {
    const dateLabel = formatDateLabel(msg.createdAt);
    const showDivider = dateLabel !== lastDate;
    lastDate = dateLabel;
    return { msg, showDivider, dateLabel };
  });

  const atImageLimit = pendingImages.length >= CHAT_MAX_IMAGES;
  const canSend = Boolean(draft.trim() || pendingImages.length) && !sending && !uploading;

  const removePendingImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    if (!isCloudinaryUploadConfigured()) {
      toast.error("Image upload is not configured.");
      return;
    }

    const slotsLeft = CHAT_MAX_IMAGES - pendingImages.length;
    if (slotsLeft <= 0) {
      toast.error(`Up to ${CHAT_MAX_IMAGES} images per message`);
      return;
    }
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (images.length !== files.length) {
      toast.error("Only image files can be attached");
    }
    if (images.length > slotsLeft) {
      toast.error(`Only ${slotsLeft} more image${slotsLeft === 1 ? "" : "s"} can be attached`);
    }
    const batch = images.slice(0, slotsLeft);
    if (!batch.length) return;

    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (let i = 0; i < batch.length; i += 1) {
        setUploadProgress(`Uploading ${i + 1}/${batch.length}…`);
        uploaded.push(
          await uploadImageFileToCloudinary(batch[i], { folder: "volosync-apex-chat" }),
        );
      }
      setPendingImages((prev) => [...prev, ...uploaded].slice(0, CHAT_MAX_IMAGES));
    } catch (e) {
      if (uploaded.length) {
        setPendingImages((prev) => [...prev, ...uploaded].slice(0, CHAT_MAX_IMAGES));
      }
      toast.error(e instanceof Error ? e.message : "Image upload failed");
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const handleSend = async () => {
    const text = draft.trim();
    const images = pendingImages;
    if ((!text && !images.length) || sending || uploading) return;
    setSending(true);
    try {
      if (images.length) {
        // One bubble per image; the caption rides on the first.
        for (let i = 0; i < images.length; i += 1) {
          await sendApexFeedback(threadId, i === 0 ? text : "", images[i]);
        }
      } else {
        await sendApexFeedback(threadId, text);
      }
      setDraft("");
      setPendingImages([]);
      await load();
      toast.success(images.length > 1 ? "Messages sent" : "Message sent");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  if (!thread) {
    return <ApexPageLoader label="Loading conversation…" />;
  }

  return (
    <div className="flex min-h-[calc(100svh-10rem)] flex-col gap-6">
      <ApexPageHeader
        title={thread.hotelDisplayName}
        description={thread.tinNumber}
        breadcrumbs={[
          { label: "Wholesaler chat", href: "/feedback" },
          { label: thread.hotelDisplayName },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="apex-row-action">
              <Link href={`/tenants/${encodeURIComponent(thread.tinNumber)}`}>View tenant</Link>
            </Button>
            {thread.status === "open" ? (
              <Button
                variant="destructive"
                size="sm"
                className="apex-row-action"
                onClick={async () => {
                  try {
                    await closeFeedbackThread(threadId);
                    await load();
                    toast.success("Thread closed");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Failed");
                  }
                }}
              >
                Close thread
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <ApexPanel className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            ref={scrollRef}
            className="flex max-h-[min(62vh,540px)] min-h-[300px] flex-1 flex-col gap-3 overflow-y-auto p-4 sm:p-6"
          >
            {thread.messages.length === 0 ? (
              <ApexEmptyState
                icon={MessageCircle}
                title="Start the conversation"
                description="Send the first message — the wholesaler team will see it in their VoloSync app."
              />
            ) : (
              messagesWithDividers.map(({ msg, showDivider, dateLabel }) => {
                const fromApex = msg.senderSide === "apex";
                return (
                  <div key={msg.id}>
                    {showDivider ? (
                      <div className="apex-chat-date-divider">{dateLabel}</div>
                    ) : null}
                    <div
                      className={cn(
                        "flex max-w-[min(85%,28rem)] flex-col gap-1.5",
                        fromApex ? "ml-auto items-end" : "items-start",
                      )}
                    >
                      <p className="px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {fromApex ? msg.apexDisplayName || "Apex" : msg.tenantUserName || "Tenant"}
                      </p>
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                          fromApex
                            ? "apex-chat-bubble-apex text-[oklch(0.94_0.01_85)]"
                            : "apex-chat-bubble-tenant border border-white/6 text-foreground",
                        )}
                      >
                        {msg.imageUrl ? (
                          <a
                            href={msg.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mb-2 block"
                          >
                            <Image
                              src={msg.imageUrl}
                              alt="Attachment"
                              width={280}
                              height={200}
                              className="max-h-48 rounded-lg object-contain"
                              unoptimized
                            />
                          </a>
                        ) : null}
                        {msg.body ? <p className="whitespace-pre-wrap">{msg.body}</p> : null}
                      </div>
                      <p className="px-1 text-[10px] tabular-nums text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="apex-chat-composer flex flex-col gap-3 p-4 sm:p-5">
            {pendingImages.length ? (
              <div className="flex flex-wrap items-center gap-2">
                {pendingImages.map((url, index) => (
                  <div key={url} className="relative">
                    <Image
                      src={url}
                      alt={`Attachment ${index + 1}`}
                      width={80}
                      height={80}
                      className="h-16 w-16 rounded-lg border border-white/10 object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      aria-label="Remove image"
                      disabled={sending}
                      onClick={() => removePendingImage(index)}
                      className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-destructive text-white shadow-md transition hover:scale-105 disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                  {pendingImages.length}/{CHAT_MAX_IMAGES}
                </span>
              </div>
            ) : null}

            <div className="flex gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept={CHAT_IMAGE_ACCEPT}
                multiple
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(event) => void handleImageFileChange(event)}
              />
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-auto shrink-0 border-white/10 px-3"
                disabled={sending || uploading || atImageLimit}
                title={
                  atImageLimit ? `Up to ${CHAT_MAX_IMAGES} images per message` : "Attach images"
                }
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
              </Button>
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message… (Enter to send, Shift+Enter for new line)"
                rows={2}
                disabled={sending}
                className="min-h-[48px] resize-none border-white/10 bg-background/80 focus-visible:ring-[oklch(0.65_0.05_85/0.25)]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
              />
              <Button
                variant="apex"
                size="lg"
                className="h-auto shrink-0 px-5"
                disabled={!canSend}
                onClick={() => void handleSend()}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground">
              {uploading
                ? uploadProgress
                : `Up to ${CHAT_MAX_IMAGES} images · Enter to send · Shift+Enter for new line`}
            </p>
          </div>
        </ApexPanel>
        <ApexFeedbackTenantContext tinNumber={thread.tinNumber} />
      </div>
    </div>
  );
}
