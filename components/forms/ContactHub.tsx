"use client";

import { useEffect, useState } from "react";
import InquiryForm from "@/components/forms/InquiryForm";
import WaitlistForm from "@/components/forms/WaitlistForm";

export default function ContactHub() {
  const [activeTab, setActiveTab] = useState<"inquiry" | "waitlist">("inquiry");

  // Synchronize active tab with URL hash if present
  useEffect(() => {
    const handleHash = () => {
      if (typeof window !== "undefined") {
        if (window.location.hash === "#waitlist") {
          setActiveTab("waitlist");
        } else if (window.location.hash === "#inquiry") {
          setActiveTab("inquiry");
        }
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  return (
    <div className="space-y-10">
      {/* Tab Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-2xl border border-border/80 bg-surface-muted/80 p-1.5 shadow-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab("inquiry");
              window.history.replaceState(null, "", "#inquiry");
            }}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "inquiry"
                ? "bg-background text-foreground shadow-xs border border-border/60"
                : "text-foreground/70 hover:text-foreground hover:bg-surface-muted"
            }`}
            aria-selected={activeTab === "inquiry"}
            role="tab"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span>General Inquiry & Collaboration</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("waitlist");
              window.history.replaceState(null, "", "#waitlist");
            }}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "waitlist"
                ? "bg-background text-foreground shadow-xs border border-border/60"
                : "text-foreground/70 hover:text-foreground hover:bg-surface-muted"
            }`}
            aria-selected={activeTab === "waitlist"}
            role="tab"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Coaching Waitlist</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Contact Info + Active Form */}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] items-start">
        {/* Left Column: Direct channels and expectations */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border/80 bg-surface/50 p-6 sm:p-8 space-y-6 shadow-xs">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {activeTab === "inquiry"
                  ? "Let's connect & collaborate"
                  : "Join the coaching cohort"}
              </h2>
              <p className="mt-2 text-sm text-foreground/75 leading-relaxed">
                {activeTab === "inquiry"
                  ? "Have a question about an article, want to invite Dr. Simret to speak at your workshop, or propose a collaboration? Send a note here."
                  : "Dr. Simret accepts a limited number of 1-on-1 coaching clients per cohort to maintain depth and intentional focus. Join the waitlist to be notified when spots open."}
              </p>
            </div>

            <div className="space-y-4 pt-2 border-t border-border/70">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted border border-border/80 text-accent">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Response Expectations</p>
                  <p className="text-xs text-foreground/70 mt-0.5">
                    We personally review all submissions and typically reply within 24–48 business hours.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted border border-border/80 text-accent">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Strict Confidentiality</p>
                  <p className="text-xs text-foreground/70 mt-0.5">
                    Your personal disclosures, challenges, and contact details are kept strictly private.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Community Channels */}
            <div className="pt-2 border-t border-border/70 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                Direct Channels
              </p>
              <div className="space-y-2 text-xs">
                <a
                  href="https://t.me/DrSimaEsu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-background/60 hover:bg-background transition"
                >
                  <span className="font-medium text-foreground">Mela Space Telegram Community</span>
                  <span className="text-accent">@DrSimaEsu ↗</span>
                </a>

                <a
                  href="https://t.me/PageTurnersBookClubEthiopia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-background/60 hover:bg-background transition"
                >
                  <span className="font-medium text-foreground">Page Turners Book Club</span>
                  <span className="text-accent">Join Discussion ↗</span>
                </a>

                <a
                  href="https://www.instagram.com/sima_esu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-background/60 hover:bg-background transition"
                >
                  <span className="font-medium text-foreground">Instagram Reflections</span>
                  <span className="text-accent">@sima_esu ↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Form Container */}
        <div className="min-w-0">
          {activeTab === "inquiry" ? (
            <div id="inquiry" className="scroll-mt-32 animate-in fade-in-0 duration-300">
              <InquiryForm />
            </div>
          ) : (
            <div id="waitlist" className="scroll-mt-32 animate-in fade-in-0 duration-300">
              <WaitlistForm />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
