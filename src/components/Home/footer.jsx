import { Zap, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const footerLinks = {
  product: [
    { name: "Features", href: "#features" },
    { name: "Charging Stations", href: "#charging" },
    { name: "Mobile App", href: "#" },
    { name: "Route Planner", href: "#" }
  ],
  company: [
    { name: "About Us", href: "#about" },
    { name: "Careers", href: "#" },
    { name: "Press", href: "#" },
    { name: "Contact", href: "#" }
  ],
  support: [
    { name: "Help Center", href: "#" },
    { name: "Community", href: "#" },
    { name: "Safety", href: "#" },
    { name: "Status", href: "#" }
  ],
  legal: [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Cookie Policy", href: "#" },
    { name: "Accessibility", href: "#" }
  ]
};

export function Footer() {
  return (
    <footer className="text-gray-300 bg-gray-900">
      <div className="container px-4 py-16 mx-auto">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-8 h-8 text-green-500" />
              <span className="text-xl font-semibold text-white">EVHub</span>
            </div>
            <p className="max-w-sm mb-6 text-sm">
              Empowering the future of transportation with smart electric vehicle solutions and comprehensive charging networks.
            </p>
            <div className="flex gap-4">
              <a href="#" className="transition-colors hover:text-green-500">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="transition-colors hover:text-green-500">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="transition-colors hover:text-green-500">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="transition-colors hover:text-green-500">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm transition-colors hover:text-green-500">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm transition-colors hover:text-green-500">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm transition-colors hover:text-green-500">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm transition-colors hover:text-green-500">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between pt-8 mt-12 border-t border-gray-800 md:flex-row">
          <p className="text-sm">
            © 2024 EVHub. All rights reserved.
          </p>
          <p className="mt-4 text-sm text-gray-400 md:mt-0">
            Made with ❤️ for a sustainable future
          </p>
        </div>
      </div>
    </footer>
  );
}