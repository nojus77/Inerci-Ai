import PillNavbar from "@/components/PillNavbar";
import Hero from "@/components/socio/Hero";
import Features from "@/components/socio/Features";
import HowItWorks from "@/components/socio/HowItWorks";
import Testimonials from "@/components/socio/Testimonials";
import CTA from "@/components/socio/CTA";
import Footer from "@/components/socio/Footer";

export default function Home() {
  return (
    <main className="min-h-screen text-foreground">
      {/* Background is on body/html - particles show through transparent main */}
      <PillNavbar />
      <Hero />
      <HowItWorks />
      <Features />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}
