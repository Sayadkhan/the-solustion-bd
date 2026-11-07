"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, HelpCircle, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Truck } from "lucide-react";
import { ApiSiteSettings, storefrontApi } from "@/lib/api";

const PROMISES = [
  { icon: ShieldCheck, title: "Official warranty", text: "Tracked by box serial number" },
  { icon: Truck, title: "Nationwide delivery", text: "Courier to all 64 districts" },
  { icon: CreditCard, title: "Pay your way", text: "Cash on delivery or bKash" },
  { icon: HelpCircle, title: "Expert advice", text: "Talk to us before you buy" },
];

const LINKS = [
  {
    title: "Shop",
    items: [
      { label: "All products", href: "/products" },
      { label: "Offers", href: "/products?deals=true" },
      { label: "Compare products", href: "/compare" },
    ],
  },
  {
    title: "Tools",
    items: [
      { label: "3D PC Builder", href: "/pc-builder" },
      { label: "Track your order", href: "/track-order" },
      { label: "Tech blog", href: "/blogs" },
    ],
  },
];

export function MainFooter() {
  const [settings, setSettings] = useState<ApiSiteSettings | null>(null);

  useEffect(() => {
    storefrontApi.getSettings().then(setSettings);
  }, []);

  const hotline = settings?.hotlineNumber || "01711-319090";
  const whatsapp = settings?.whatsappNumber || "01922-730343";
  const email = settings?.contactEmail || "thesolutionsbd@gmail.com";
  const offices = [
    { name: "Gulshan office", address: settings?.gulshanAddress },
    { name: "IDB office", address: settings?.idbAddress },
  ].filter((office) => office.address);

  return (
    <footer className="border-t border-border bg-card text-sm print:hidden">
      <div className="spectrum-line h-px opacity-70" />

      <div className="max-w-[1600px] mx-auto px-4 py-8 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6 border-b border-border">
        {PROMISES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-3">
            <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground text-sm">{title}</h3>
              <p className="text-muted-foreground text-xs mt-0.5">{text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-10 grid grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.4fr] gap-8">
        <div className="col-span-2 lg:col-span-1 space-y-4">
          <div className="inline-block rounded-lg bg-white p-2">
            <img src="/logo.png" alt="The Solutions BD" className="h-10 w-auto" />
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-xs">
            Genuine computer parts and complete PC builds, with official warranty, for customers across Bangladesh.
          </p>
        </div>

        {LINKS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h3 className="eyebrow mb-3">{group.title}</h3>
            <ul className="space-y-2">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-foreground/80 hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="col-span-2 lg:col-span-1">
          <h3 className="eyebrow mb-3">Contact</h3>
          <ul className="space-y-2.5 text-foreground/80">
            <li>
              <a href={`tel:${hotline}`} className="inline-flex items-center gap-2 hover:text-primary font-semibold text-foreground tabular-nums">
                <Phone className="w-4 h-4 text-muted-foreground" />
                {hotline}
              </a>
            </li>
            <li>
              <a
                href={`https://wa.me/88${whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:text-primary tabular-nums"
              >
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                WhatsApp {whatsapp}
              </a>
            </li>
            <li>
              <a href={`mailto:${email}`} className="inline-flex items-center gap-2 hover:text-primary break-all">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                {email}
              </a>
            </li>
            {offices.map((office) => (
              <li key={office.name} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>
                  <span className="text-foreground font-medium">{office.name}:</span> {office.address}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-[1600px] mx-auto px-4 py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} The Solutions BD. An Incomparable IT Solution Provider.
        </div>
      </div>
    </footer>
  );
}
