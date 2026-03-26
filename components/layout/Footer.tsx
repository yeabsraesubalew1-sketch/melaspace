import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="mx-auto max-w-6xl px-6 py-12">
        
        {/* Top */}
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
          
          {/* Brand */}
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              Mela Space
            </h3>
            <p className="mt-3 text-sm text-foreground/70 leading-relaxed max-w-xs">
              A calm space for reflection, clarity, and growth where you’re
              allowed to take your time.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-sm font-medium">Navigation</p>
            <ul className="mt-3 space-y-2 text-sm text-foreground/70">
              <li>
                <Link href="/about" className="hover:text-foreground transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="hover:text-foreground transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-foreground transition">
                  Resources
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-foreground transition">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/contact#inquiry" className="hover:text-foreground transition">
                  Inquiry Form
                </Link>
              </li>
              <li>
                <Link href="/contact#waitlist" className="hover:text-foreground transition">
                  Coaching Waitlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact / Social */}
          <div>
            <p className="text-sm font-medium">Connect</p>
            <ul className="mt-3 space-y-2 text-sm text-foreground/70">
              <li>
                <a
                  href="mailto:hello@melaspace.com"
                  className="hover:text-foreground transition"
                >
                  hello@melaspace.com
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition">
                  YouTube
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition">
                  TikTok
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6 text-sm text-foreground/60">
          
          <p>© {new Date().getFullYear()} Mela Space. All rights reserved.</p>

          {/* <div className="flex gap-4">
            <Link href="#" className="hover:text-foreground transition">
              Terms
            </Link>
            <Link href="#" className="hover:text-foreground transition">
              Privacy
            </Link>
          </div> */}

        </div>
      </div>
    </footer>
  );
}