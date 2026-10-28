"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export function GtmAnalytics() {
  const [settings, setSettings] = useState<{
    gtmId?: string;
    gaMeasurementId?: string;
    googleSearchConsoleCode?: string;
    facebookPixelId?: string;
    customHeadScript?: string;
  } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
        const res = await fetch(`${apiUrl}/settings`);
        if (res.ok) {
          const json = await res.json();
          if (json?.data) {
            setSettings({
              gtmId: json.data.gtmId,
              gaMeasurementId: json.data.gaMeasurementId,
              googleSearchConsoleCode: json.data.googleSearchConsoleCode,
              facebookPixelId: json.data.facebookPixelId,
              customHeadScript: json.data.customHeadScript,
            });
          }
        }
      } catch {
        // Fallback or silent fail if backend offline
      }
    };

    fetchSettings();
  }, []);

  if (!settings) return null;

  return (
    <>
      {/* Google Search Console Meta Verification Tag */}
      {settings.googleSearchConsoleCode && (
        <meta
          name="google-site-verification"
          content={settings.googleSearchConsoleCode.replace(/^.*content=["']([^"']+)["'].*$/, "$1")}
        />
      )}

      {/* Google Tag Manager (GTM) Container */}
      {settings.gtmId && (
        <>
          <Script
            id="google-tag-manager"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${settings.gtmId}');`,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${settings.gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        </>
      )}

      {/* Google Analytics 4 (GA4) Direct Fallback */}
      {settings.gaMeasurementId && !settings.gtmId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${settings.gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script
            id="google-analytics-ga4"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${settings.gaMeasurementId}', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
        </>
      )}
    </>
  );
}
