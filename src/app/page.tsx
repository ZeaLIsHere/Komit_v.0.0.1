import Link from "next/link";
import { auth } from "@/lib/auth";
import { Hero } from "./_components/hero";
import { HowItWorks } from "./_components/how-it-works";
import { Features } from "./_components/features";
import { FAQ } from "./_components/faq";
import { Footer } from "./_components/footer";
import { ConsentBanner } from "@/components/layout/consent-banner";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      {/* Top Navbar */}
      <header className="h-16 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50 px-4 md:px-8">
        <div className="max-w-5xl mx-auto h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-container text-white font-bold text-sm shadow-xs">
              <span className="font-mono text-xs">TI</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="leading-tight font-display text-sm font-bold text-primary">
                  USU CS Project Pulse
                </span>
                <span className="text-[9px] font-mono bg-secondary-fixed text-on-secondary-fixed px-1 rounded font-bold">
                  v2.4
                </span>
              </div>
              <span className="text-[10px] text-on-surface-variant font-normal">
                Fakultas Ilmu Komputer & TI USU
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button asChild size="sm" className="bg-primary-container hover:bg-primary text-white text-xs font-semibold shadow-xs">
                <Link href="/courses">Buka Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="bg-primary-container hover:bg-primary text-white text-xs font-semibold shadow-xs">
                <Link href="/login">Masuk dengan GitHub</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Sections */}
      <main className="flex-1">
        <Hero isAuthenticated={isAuthenticated} />
        <HowItWorks />
        <Features />

        {/* In-page Consent Banner Preview */}
        <section className="py-12 border-b">
          <div className="max-w-5xl mx-auto px-4">
            <ConsentBanner />
          </div>
        </section>

        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
