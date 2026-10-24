import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-24 bg-surface/40 backdrop-blur-xs">
      <div className="mx-auto max-w-6xl px-6 py-14">
        
        {/* Top */}
        <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-4">
          
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="group inline-flex items-center gap-1.5 transition-opacity hover:opacity-85">
              <div className="relative flex h-7 w-7 items-center justify-center text-foreground transition-transform duration-300 group-hover:scale-105">
                <svg viewBox="0 0 32 32" fill="none" className="h-[23px] w-[23px]" aria-hidden="true">
                  <path d="M16 26V13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  <path
                    d="M16 19C11.5 19 8 15.5 8 11C12.5 11 16 14.5 16 19Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                    opacity="0.5"
                  />
                  <path
                    d="M16 16C20.5 16 24 12.5 24 8C19.5 8 16 11.5 16 16Z"
                    stroke="hsl(var(--accent))"
                    strokeWidth="1.75"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-semibold tracking-tight text-foreground">
                  Mela Space
                </span>
                <span className="text-[10px] font-amharic text-accent/70 font-medium select-none">
                  መላ
                </span>
              </div>
            </Link>

            <p className="text-sm text-foreground/75 leading-relaxed">
              A calm space for reflection, clarity, and growth where science, emotional insight, and real life meet.
            </p>

            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-foreground/75">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Space for mindful progress</span>
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
              Explore
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-foreground/75">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About the Space
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="hover:text-foreground transition-colors">
                  Blog & Articles
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-foreground transition-colors">
                  Resource Hub
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-foreground transition-colors">
                  Services & Coaching
                </Link>
              </li>
            </ul>
          </div>

          {/* Work with Us */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
              Get Started
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-foreground/75">
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/contact#inquiry" className="hover:text-foreground transition-colors">
                  Send Inquiry
                </Link>
              </li>
              <li>
                <Link href="/contact#waitlist" className="hover:text-foreground transition-colors">
                  Coaching Waitlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Community & Connect */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
              Community & Social
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-foreground/75">
              <li>
                <a
                  href="https://t.me/DrSimaEsu"
                  className="hover:text-foreground transition-colors flex items-center gap-1.5"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>Telegram Community</span>
                  <span className="text-[10px] text-foreground/45">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/PageTurnersBookClubEthiopia"
                  className="hover:text-foreground transition-colors flex items-center gap-1.5"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>Page Turners Book Club</span>
                  <span className="text-[10px] text-foreground/45">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/sima_esu"
                  className="hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/@simretesubalew"
                  className="hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  YouTube
                </a>
              </li>
              <li>
                <a
                  href="https://www.tiktok.com/@simretesubalew"
                  className="hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  TikTok
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/80 pt-6 text-xs text-foreground/60">
          <p>© {new Date().getFullYear()} Mela Space. All rights reserved.</p>

          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Use
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}