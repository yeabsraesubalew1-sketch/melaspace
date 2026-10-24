import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-24 bg-surface/40 backdrop-blur-xs">
      <div className="mx-auto max-w-6xl px-6 py-14">
        
        {/* Top */}
        <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-4">
          
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="group inline-flex items-baseline gap-1.5 transition-opacity hover:opacity-85">
              <span className="font-serif text-lg font-bold tracking-tight text-foreground">
                Mela
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/60">
                Space
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-accent/80 transition-transform duration-300 group-hover:scale-125" />
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