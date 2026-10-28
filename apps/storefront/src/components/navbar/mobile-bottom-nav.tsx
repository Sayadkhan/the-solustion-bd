"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, Cpu, ShoppingCart, Truck } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";

export function MobileBottomNav() {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.getItemCount());

  // Hide the global bottom nav on product detail pages so the dedicated sticky buy bar has full focus
  const isProductDetailPage =
    pathname.startsWith("/products/") &&
    pathname !== "/products" &&
    !pathname.includes("category");

  if (isProductDetailPage) {
    return null;
  }

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "Products",
      href: "/products",
      icon: Layers,
      isActive: pathname.startsWith("/products"),
    },
    {
      label: "PC Builder",
      href: "/pc-builder",
      icon: Cpu,
      isSpecial: true,
      isActive: pathname === "/pc-builder",
    },
    {
      label: "Cart",
      href: "/cart",
      icon: ShoppingCart,
      badge: cartCount > 0 ? cartCount : undefined,
      isActive: pathname === "/cart",
    },
    {
      label: "Track Order",
      href: "/track-order",
      icon: Truck,
      isActive: pathname === "/track-order",
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.12)] px-2 py-1.5"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center -mt-5 group"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform group-active:scale-90 ${
                    item.isActive
                      ? "bg-blue-600 text-white ring-4 ring-background shadow-blue-500/30"
                      : "bg-[#1340b8] text-white ring-4 ring-background shadow-blue-600/30"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-bold mt-1 transition-colors ${
                    item.isActive ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors relative min-w-[56px] ${
                item.isActive
                  ? "text-blue-600 dark:text-blue-400 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${item.isActive ? "scale-110" : ""}`} />
                {typeof item.badge === "number" && (
                  <span className="absolute -top-1.5 -right-2 bg-blue-600 text-white text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
