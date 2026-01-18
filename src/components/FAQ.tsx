"use client";

import { faq, ctaBanner } from "@/content/copy";
import { useState } from "react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <>
      {/* FAQ Section */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Content */}
            <div>
              <span className="inline-block px-3 py-1 border border-neutral-200 text-neutral-600 text-xs font-medium rounded mb-4">
                {faq.badge}
              </span>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
                {faq.title}
              </h2>
              <p className="text-neutral-600">{faq.description}</p>
            </div>

            {/* Right - Accordion */}
            <div className="divide-y divide-neutral-200">
              {faq.items.map((item, index) => (
                <div key={index} className="py-4">
                  <button
                    className="w-full flex items-center justify-between text-left"
                    onClick={() =>
                      setOpenIndex(openIndex === index ? null : index)
                    }
                  >
                    <span className="font-medium text-neutral-900">
                      {item.question}
                    </span>
                    <svg
                      className={`w-5 h-5 text-neutral-500 transition-transform ${
                        openIndex === index ? "rotate-45" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                  {openIndex === index && (
                    <div className="mt-3 text-neutral-600 text-sm leading-relaxed">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 md:py-24 bg-neutral-900">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
                {ctaBanner.title}
              </h2>
              <p className="text-neutral-400">{ctaBanner.description}</p>
            </div>
            <a
              href="#"
              className="whitespace-nowrap inline-flex items-center gap-2 bg-white text-neutral-900 px-6 py-3 rounded-full text-sm font-medium hover:bg-neutral-100 transition-colors"
            >
              {ctaBanner.cta}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
