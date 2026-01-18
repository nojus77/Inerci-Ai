import { siteConfig, footer } from "@/content/copy";

export default function Footer() {
  return (
    <footer className="py-12 md:py-16 border-t border-neutral-100">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Logo & Description */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
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
              </div>
              <span className="text-lg font-semibold">{siteConfig.name}</span>
            </div>
            <p className="text-sm text-neutral-600 max-w-xs">
              {footer.tagline}
            </p>
          </div>

          {/* Overview Links */}
          <div>
            <h4 className="font-medium text-neutral-900 mb-4">Overview</h4>
            <ul className="space-y-3">
              {footer.links.overview.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-medium text-neutral-900 mb-4">Company</h4>
            <ul className="space-y-3">
              {footer.links.company.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-medium text-neutral-900 mb-4">Resources</h4>
            <ul className="space-y-3">
              {footer.links.resources.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="font-medium text-neutral-900 mb-4">Social</h4>
            <ul className="space-y-3">
              {footer.links.social.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-neutral-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-neutral-500">{footer.copyright}</p>
          <p className="text-sm text-neutral-500">{footer.madeWith}</p>
        </div>
      </div>
    </footer>
  );
}
