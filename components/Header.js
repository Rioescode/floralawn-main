"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ButtonSignin from "./ButtonSignin";
import config from "@/config";

const links = [
  {
    href: "/services",
    label: "Services",
  },
  {
    href: "/pricing",
    label: "Pricing",
  },
  {
    href: "/about",
    label: "About",
  },
  {
    href: "/contact",
    label: "Contact",
  }
];

// Changed CTA to be a direct estimate button
const cta = (
  <a 
    href="/contact" 
    className="btn btn-primary"
  >
    Get Free Estimate
  </a>
);

// A header with a logo on the left, links in the center (like Pricing, etc...), and a CTA (like Get Started or Login) on the right.
// The header is responsive, and on mobile, the links are hidden behind a burger button.
const Header = () => {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  // setIsOpen(false) when the route changes (i.e: when the user clicks on a link on mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [searchParams]);

  return (
    <header className="bg-white shadow-sm">
      <nav
        className="container flex items-center justify-between px-8 py-4 mx-auto"
        aria-label="Global"
      >
        {/* Logo/name on large screens */}
        <div className="flex lg:flex-1">
          <Link
            className="flex items-center gap-2 shrink-0"
            href="/"
            title="Flora Lawn & Landscaping homepage"
          >
            <Image
              src="/flora-logo-final.png"
              alt="Flora Lawn & Landscaping logo"
              className="h-12 w-auto"
              priority={true}
              width={200}
              height={60}
            />
          </Link>
        </div>

        {/* Burger menu for mobile */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setIsOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        </div>

        {/* Navigation links for desktop */}
        <div className="hidden lg:flex lg:justify-center lg:gap-12 lg:items-center">
          {links.map((link) => (
            <Link
              href={link.href}
              key={link.href}
              className="text-gray-700 hover:text-blue-600 transition-colors"
              title={link.label}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Phone number and CTA for desktop */}
        <div className="hidden lg:flex lg:items-center lg:gap-4">
          <a 
            href="tel:4013890913" 
            className="text-gray-700 hover:text-blue-600 font-medium"
          >
            (401) 389-0913
          </a>
          {cta}
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`relative z-50 ${isOpen ? "" : "hidden"}`}>
        <div className="fixed inset-y-0 right-0 z-10 w-full px-8 py-4 overflow-y-auto bg-white sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          {/* Mobile header */}
          <div className="flex items-center justify-between">
            <Link
              className="flex items-center gap-2 shrink-0"
              title="Flora Lawn & Landscaping homepage"
              href="/"
            >
              <Image
                src="/flora-logo-final.png"
                alt="Flora Lawn & Landscaping logo"
                className="h-10 w-auto"
                priority={true}
                width={160}
                height={50}
              />
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Mobile navigation links */}
          <div className="flow-root mt-6">
            <div className="py-4">
              <div className="flex flex-col gap-y-4 items-start">
                {links.map((link) => (
                  <Link
                    href={link.href}
                    key={link.href}
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                    title={link.label}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="divider"></div>
            {/* Phone number and CTA for mobile */}
            <div className="flex flex-col gap-4">
              <a 
                href="tel:4013890913" 
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                (401) 389-0913
              </a>
              {cta}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
