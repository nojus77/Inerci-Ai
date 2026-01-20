"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { footer } from "@/content/copy.lt";
import Logo from "@/components/Logo";
import { useCalModal } from "@/components/cal/CalContext";

// Wave SVG divider component
function WaveDivider() {
  return (
    <div className="absolute top-0 left-0 right-0 w-full overflow-hidden leading-none -translate-y-[99%]">
      <svg
        className="relative block w-full h-[60px] md:h-[80px]"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(8, 12, 24, 0.95)" />
          </linearGradient>
          <linearGradient id="waveStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(124, 58, 237, 0.1)" />
            <stop offset="50%" stopColor="rgba(59, 130, 246, 0.2)" />
            <stop offset="100%" stopColor="rgba(124, 58, 237, 0.1)" />
          </linearGradient>
        </defs>
        {/* Wave path */}
        <path
          d="M0,60 C150,100 350,20 600,60 C850,100 1050,20 1200,60 L1200,120 L0,120 Z"
          fill="url(#waveGradient)"
        />
        {/* Subtle stroke on top of wave */}
        <path
          d="M0,60 C150,100 350,20 600,60 C850,100 1050,20 1200,60"
          fill="none"
          stroke="url(#waveStroke)"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}

// Footer link component with hover effect
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <motion.a
      href={href}
      className="text-sm text-foreground/50 hover:text-foreground/90 transition-colors duration-200 block py-1"
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.a>
  );
}

export default function Footer() {
  const [isCtaHovered, setIsCtaHovered] = useState(false);
  const { openCalModal } = useCalModal();

  return (
    <footer className="relative mt-8 md:mt-12">
      {/* Wave divider */}
      <WaveDivider />

      {/* Footer background with glass effect */}
      <div
        className="relative pt-8 pb-8 md:pt-10 md:pb-10"
        style={{
          background: "linear-gradient(180deg, rgba(8, 12, 24, 0.95) 0%, rgba(6, 8, 18, 0.98) 100%)",
        }}
      >
        {/* Subtle noise texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Gradient glow accents */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Content container */}
        <div className="relative mx-auto max-w-6xl px-6">
          {/* Main footer content - glass card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="relative rounded-2xl p-6 md:p-10 overflow-hidden"
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
            }}
          >
            {/* Inner highlight */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 30%)",
              }}
            />

            {/* Compact mobile layout / 3-column desktop */}
            <div className="relative">
              {/* Mobile: Compact vertical layout */}
              <div className="md:hidden space-y-3">
                {/* Logo row with CTA */}
                <div className="flex items-center justify-between">
                  <motion.a
                    href="#"
                    className="inline-block"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Logo size="sm" animate={false} />
                  </motion.a>
                  {/* CTA Button - mobile */}
                  <motion.button
                    onClick={() => openCalModal()}
                    className="relative px-4 py-2 rounded-full text-xs font-semibold text-white overflow-hidden cursor-pointer"
                    whileTap={{ scale: 0.97 }}
                    style={{
                      background: "linear-gradient(135deg, #3B82F6 0%, #7C3AED 50%, #6366F1 100%)",
                      boxShadow: "0 4px 16px rgba(124, 58, 237, 0.15)",
                    }}
                  >
                    <span className="relative z-10 flex items-center gap-1.5">
                      {footer.contact.cta}
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </motion.button>
                </div>

                {/* Row 1: Sprendimai */}
                <a href="#features" className="block text-sm text-foreground/50 hover:text-foreground/80 transition-colors">
                  {footer.links.items[0].label}
                </a>

                {/* Row 2: Paslaugos */}
                <a href="#services" className="block text-sm text-foreground/50 hover:text-foreground/80 transition-colors">
                  {footer.links.items[1].label}
                </a>

                {/* Row 3: Email + Social icons */}
                <div className="flex items-center gap-4">
                  <a href={`mailto:${footer.contact.email}`} className="text-sm text-foreground/50 hover:text-foreground/80 transition-colors">
                    {footer.contact.email}
                  </a>
                  <a href="https://linkedin.com/company/inerci" target="_blank" rel="noopener noreferrer" className="text-foreground/40 hover:text-primary/70 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <a href="https://facebook.com/inerci" target="_blank" rel="noopener noreferrer" className="text-foreground/40 hover:text-primary/70 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Desktop: Original 3-column layout */}
              <div className="hidden md:grid md:grid-cols-3 gap-8">
                {/* Left column - Logo & description */}
                <div className="space-y-4">
                  <motion.a
                    href="#"
                    className="inline-block"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Logo size="md" animate={false} />
                  </motion.a>
                  <p className="text-sm text-foreground/50 leading-relaxed max-w-xs">
                    {footer.description}
                  </p>
                </div>

                {/* Middle column - Links */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/30">
                    {footer.links.title}
                  </h4>
                  <nav className="space-y-1">
                    {footer.links.items.map((link) => (
                      <FooterLink key={link.href} href={link.href}>
                        {link.label}
                      </FooterLink>
                    ))}
                  </nav>
                </div>

                {/* Right column - Contact & CTA */}
                <div className="space-y-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/30">
                    {footer.contact.title}
                  </h4>

                  {/* Email */}
                  <motion.a
                    href={`mailto:${footer.contact.email}`}
                    className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground/90 transition-colors group"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg
                      className="w-4 h-4 text-foreground/40 group-hover:text-primary/70 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                      />
                    </svg>
                    {footer.contact.email}
                  </motion.a>

                  {/* LinkedIn */}
                  <motion.a
                    href="https://linkedin.com/company/inerci"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground/90 transition-colors group"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg
                      className="w-4 h-4 text-foreground/40 group-hover:text-primary/70 transition-colors"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </motion.a>

                  {/* Facebook */}
                  <motion.a
                    href="https://facebook.com/inerci"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground/90 transition-colors group"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg
                      className="w-4 h-4 text-foreground/40 group-hover:text-primary/70 transition-colors"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </motion.a>

                  {/* CTA Button */}
                  <motion.button
                    onClick={() => openCalModal()}
                    className="relative mt-4 px-5 py-2.5 rounded-full text-sm font-semibold text-white overflow-hidden cursor-pointer"
                    onMouseEnter={() => setIsCtaHovered(true)}
                    onMouseLeave={() => setIsCtaHovered(false)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      boxShadow: isCtaHovered
                        ? "0 8px 24px rgba(124, 58, 237, 0.3), 0 4px 12px rgba(59, 130, 246, 0.2)"
                        : "0 4px 16px rgba(124, 58, 237, 0.15), 0 2px 8px rgba(59, 130, 246, 0.1)",
                    }}
                  >
                    {/* Gradient background */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "linear-gradient(135deg, #3B82F6 0%, #7C3AED 50%, #6366F1 100%)",
                        backgroundSize: "200% 200%",
                      }}
                      animate={{
                        backgroundPosition: isCtaHovered ? "100% 100%" : "0% 0%",
                      }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />

                    {/* Inner glow */}
                    <div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%)",
                      }}
                    />

                    {/* Text */}
                    <span className="relative z-10 flex items-center gap-2">
                      {footer.contact.cta}
                      <motion.svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        animate={{ x: isCtaHovered ? 4 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </motion.svg>
                    </span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bottom row - Copyright */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-center"
          >
            <p className="text-xs text-foreground/30">{footer.copyright}</p>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
