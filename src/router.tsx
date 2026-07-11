import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    parseSearch: (str) => Object.fromEntries(new URLSearchParams(str).entries()),
    stringifySearch: (search) => {
      const p = new URLSearchParams();
      Object.entries(search as Record<string, unknown>).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          p.set(k, String(v));
        }
      });
      const str = p.toString();
      return str ? `?${str}` : "";
    },
  });

  return router;
};
