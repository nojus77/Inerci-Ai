import { pricing, socialProof, logoCloud } from "@/content/copy";

export default function Pricing() {
  return (
    <>
      {/* Pricing Section */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-neutral-100 text-neutral-600 text-sm font-medium rounded-full mb-4">
              {pricing.badge}
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              {pricing.title}
            </h2>
            <p className="text-neutral-600">{pricing.description}</p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricing.plans.map((plan, index) => (
              <div
                key={index}
                className="border border-neutral-200 rounded-2xl p-6 hover:border-neutral-300 transition-colors"
              >
                <div className="mb-6">
                  <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {plan.name}
                  </span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-semibold">{plan.price}</span>
                    <span className="text-neutral-500">{plan.period}</span>
                  </div>
                  <p className="text-neutral-600 text-sm mt-2">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          feature.included
                            ? "bg-neutral-900"
                            : "bg-neutral-200"
                        }`}
                      >
                        <svg
                          className={`w-3 h-3 ${
                            feature.included ? "text-white" : "text-neutral-400"
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <span
                        className={`text-sm ${
                          feature.included
                            ? "text-neutral-700"
                            : "text-neutral-400"
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <button className="w-full bg-neutral-900 text-white py-3 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors">
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 md:py-24 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 text-center">
          {/* Stars */}
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className="w-6 h-6 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>

          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3 italic">
            {socialProof.title}
          </h2>
          <p className="text-neutral-600 mb-8">{socialProof.description}</p>

          {/* Logos */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 mb-8">
            {logoCloud.logos.map((logo) => (
              <div
                key={logo.name}
                className="flex items-center gap-2 text-neutral-400"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <span className="text-sm font-medium">{logo.name}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <a
            href="#"
            className="inline-flex items-center gap-2 border border-neutral-300 text-neutral-700 px-6 py-3 rounded-full text-sm font-medium hover:bg-white transition-colors"
          >
            {socialProof.cta}
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      </section>
    </>
  );
}
