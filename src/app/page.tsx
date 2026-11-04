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
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              K
            </div>
            <span>Komit</span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button asChild size="sm">
                <Link href="/courses">Buka Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="sm">
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
