import { features, workflow, premiumSection } from "@/content/copy";

const featureIcons: Record<string, React.ReactNode> = {
  secure: (
    <div className="text-2xl font-bold tracking-tight">|**</div>
  ),
  connected: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
    </svg>
  ),
  pixel: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  management: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
  online: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  easy: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function Features() {
  return (
    <>
      {/* Features Grid Section */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-neutral-100 text-neutral-600 text-sm font-medium rounded-full mb-4">
              {features.badge}
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              {features.title}
            </h2>
            <p className="text-neutral-600 max-w-xl mx-auto">
              {features.description}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.items.map((feature, index) => (
              <div
                key={index}
                className="p-6 border border-neutral-200 rounded-2xl hover:border-neutral-300 transition-colors"
              >
                <div className="text-neutral-700 mb-4">
                  {featureIcons[feature.icon]}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-16 md:py-24 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <span className="inline-block text-xs font-medium text-neutral-500 mb-4">
                {workflow.badge}
              </span>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
                {workflow.title}
              </h2>
              <p className="text-neutral-600 mb-6">{workflow.description}</p>
              <a
                href="#"
                className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                {workflow.cta}
              </a>
            </div>

            {/* Right Image Placeholder */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-neutral-100 rounded w-32 mx-auto"></div>
                  <div className="h-2 bg-neutral-100 rounded w-24 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Section */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Image Placeholder */}
            <div className="bg-neutral-100 rounded-2xl p-6 aspect-square flex items-center justify-center order-2 lg:order-1">
              <div className="bg-white rounded-xl shadow-sm p-4 w-48">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-teal-100 rounded"></div>
                  <div className="h-2 bg-neutral-200 rounded w-16"></div>
                </div>
                <div className="w-16 h-16 bg-teal-400 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="flex justify-center">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="order-1 lg:order-2">
              <span className="inline-block text-xs font-medium text-neutral-500 mb-4">
                {premiumSection.badge}
              </span>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
                {premiumSection.title}
              </h2>
              <p className="text-neutral-600 mb-6">{premiumSection.description}</p>
              <a
                href="#"
                className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                {premiumSection.cta}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
