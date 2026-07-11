import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportAppError } from "../lib/error-reporting";
import { I18nProvider } from "../lib/i18n";
import { ToastHost } from "../lib/ui";
import { seedDemoData } from "../lib/storage";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass p-8 max-w-md text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="mt-3 text-sm text-text-secondary">This page doesn't exist.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportAppError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass p-8 max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-text-secondary">Try again or go home.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="btn-primary">Try again</button>
          <a href="/" className="btn-glass">Go home</a>
        </div>
      </div>
    </div>
  );
}

// Supabase URL for resource hints
const SUPABASE_HOST = import.meta.env.VITE_SUPABASE_URL
  ? new URL(import.meta.env.VITE_SUPABASE_URL).origin
  : "";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
      { name: "theme-color", content: "#FFFFFF" },
      { title: "Faridpur Mobile Mart | Authentic Used Phone Shop, Faridpur" },
      { name: "description", content: "Expert mobile shop in Faridpur: buy, sell, exchange smartphones and accessories. Best prices and trusted service." },
      { property: "og:title", content: "Faridpur Mobile Mart | Authentic Mobile Phone Shop" },
      { property: "og:description", content: "Fast, trusted mobile phone shop. Buy, sell, exchange, and genuine accessories." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // Preconnect to font origins
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://fonts.gstatic.com" },
      // Non-render-blocking font load — use media trick so it doesn't block paint
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&display=optional",
        media: "print",
        // @ts-ignore — onload swaps to 'all' once font CSS is fetched
        onload: "this.media='all'",
      },
      // Preconnect to Supabase for faster first DB query
      ...(SUPABASE_HOST ? [
        { rel: "preconnect", href: SUPABASE_HOST },
        { rel: "dns-prefetch", href: SUPABASE_HOST },
      ] : []),
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => { seedDemoData(); }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <Outlet />
        <ToastHost />
      </I18nProvider>
    </QueryClientProvider>
  );
}
