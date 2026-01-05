import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    ttq: any;
  }
}

export const useTikTokPixel = () => {
  const [pixelId, setPixelId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadPixel = async () => {
      // Fetch pixel ID from settings
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "tiktok_pixel_id")
        .single();

      if (data?.value) {
        setPixelId(data.value);
        initTikTokPixel(data.value);
      }
    };

    loadPixel();
  }, []);

  const initTikTokPixel = (id: string) => {
    if (typeof window === "undefined" || window.ttq) return;

    // TikTok Pixel base code
    (function (w: any, d: Document, t: string) {
      w.TiktokAnalyticsObject = t;
      const ttq = (w[t] = w[t] || []);
      ttq.methods = [
        "page",
        "track",
        "identify",
        "instances",
        "debug",
        "on",
        "off",
        "once",
        "ready",
        "alias",
        "group",
        "enableCookie",
        "disableCookie",
      ];
      ttq.setAndDefer = function (t: any, e: any) {
        t[e] = function () {
          t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
        };
      };
      for (let i = 0; i < ttq.methods.length; i++) {
        ttq.setAndDefer(ttq, ttq.methods[i]);
      }
      ttq.instance = function (t: any) {
        const e = ttq._i[t] || [];
        for (let n = 0; n < ttq.methods.length; n++) {
          ttq.setAndDefer(e, ttq.methods[n]);
        }
        return e;
      };
      ttq.load = function (e: any, n?: any) {
        const i = "https://analytics.tiktok.com/i18n/pixel/events.js";
        ttq._i = ttq._i || {};
        ttq._i[e] = [];
        ttq._i[e]._u = i;
        ttq._t = ttq._t || {};
        ttq._t[e] = +new Date();
        ttq._o = ttq._o || {};
        ttq._o[e] = n || {};
        const o = d.createElement("script");
        o.type = "text/javascript";
        o.async = true;
        o.src = i + "?sdkid=" + e + "&lib=" + t;
        const a = d.getElementsByTagName("script")[0];
        a?.parentNode?.insertBefore(o, a);
      };

      ttq.load(id);
      ttq.page();
      setIsLoaded(true);
    })(window, document, "ttq");
  };

  const trackEvent = (event: string, data?: Record<string, any>) => {
    if (window.ttq && pixelId) {
      window.ttq.track(event, data);
    }
  };

  const trackPageView = () => {
    if (window.ttq && pixelId) {
      window.ttq.page();
    }
  };

  const trackInitiateCheckout = (data?: { content_id?: string; content_name?: string; value?: number; currency?: string }) => {
    trackEvent("InitiateCheckout", data);
  };

  const trackCompletePayment = (data?: { content_id?: string; content_name?: string; value?: number; currency?: string }) => {
    trackEvent("CompletePayment", data);
  };

  const trackAddToCart = (data?: { content_id?: string; content_name?: string; value?: number; currency?: string }) => {
    trackEvent("AddToCart", data);
  };

  return {
    pixelId,
    isLoaded,
    trackEvent,
    trackPageView,
    trackInitiateCheckout,
    trackCompletePayment,
    trackAddToCart,
  };
};
