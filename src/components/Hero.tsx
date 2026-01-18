import { hero, stats } from "@/content/copy";

export default function Hero() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6 text-center">
        {/* Badge */}
        <span className="inline-block px-4 py-1.5 bg-neutral-100 text-neutral-600 text-sm font-medium rounded-full mb-6">
          {hero.badge}
        </span>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-4">
          {hero.title}
          <br />
          <span className="flex items-center justify-center gap-3">
            <span className="w-10 h-10 md:w-12 md:h-12 bg-neutral-900 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 md:w-7 md:h-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </span>
            {hero.titleHighlight}
          </span>
        </h1>

        {/* Description */}
        <p className="text-neutral-600 text-lg max-w-xl mx-auto mb-8">
          {hero.description}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <a
            href="#"
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            {hero.primaryCta}
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 border border-neutral-300 text-neutral-700 px-6 py-3 rounded-full text-sm font-medium hover:bg-neutral-50 transition-colors"
          >
            {hero.secondaryCta}
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
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </a>
        </div>

        {/* Trust text */}
        <p className="text-neutral-500 text-sm">{hero.trustText}</p>
      </div>

      {/* Stats Section */}
      <div className="mx-auto max-w-6xl px-6 mt-16 md:mt-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-left">
              <div className="text-4xl md:text-5xl font-semibold text-neutral-900 mb-3">
                {stat.value}
              </div>
              <p className="text-neutral-600 text-sm leading-relaxed">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
