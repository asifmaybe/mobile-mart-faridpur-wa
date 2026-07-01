import { useEffect, useState } from "react";

// Re-renders the calling component whenever any storage helper fires the
// "repairshop:change" event so list views reflect the latest localStorage state.
export function useStorageRefresh() {
  const [, setN] = useState(0);
  useEffect(() => {
    const h = () => setN((n) => n + 1);
    window.addEventListener("repairshop:change", h);
    return () => window.removeEventListener("repairshop:change", h);
  }, []);
}
