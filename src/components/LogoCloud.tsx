import { logoCloud } from "@/content/copy";

const iconMap: Record<string, React.ReactNode> = {
  shapes: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  atoms: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
  cubes: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  stars: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
    </svg>
  ),
  flags: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  ),
};

export default function LogoCloud() {
  return (
    <section className="py-12 border-y border-neutral-100">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {logoCloud.logos.map((logo) => (
            <div
              key={logo.name}
              className="flex items-center gap-2 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              {iconMap[logo.icon]}
              <span className="text-sm font-medium">{logo.name}</span>
            </div>
          ))}
        </div>

        {/* Get Pro Version button */}
        <div className="flex justify-end mt-6">
          <a
            href="#"
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-full text-xs font-medium hover:bg-neutral-800 transition-colors"
          >
            Get Pro Version
          </a>
        </div>

        {/* Banner */}
        <div className="mt-8 flex items-center justify-center gap-3 py-3 px-4 bg-neutral-50 rounded-full">
          <span className="px-2 py-0.5 bg-neutral-200 text-neutral-700 text-xs font-medium rounded">
            New
          </span>
          <span className="text-sm text-neutral-600">
            Our new Framer template is now available for sale!
          </span>
          <a href="#" className="text-sm font-medium text-neutral-900 hover:underline">
            Purchase Now &rarr;
          </a>
        </div>
      </div>
    </section>
  );
}
