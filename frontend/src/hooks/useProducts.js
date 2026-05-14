// =============================================================================
// src/hooks/useProducts.js — Custom hook for fetching the product list
// =============================================================================
//
// SUMMARY
// -------
// A reusable React hook that fetches product data from the Flask API once,
// caches it at the module level, and exposes a refresh() function to force
// a fresh network request on demand.
//
// USAGE
//   const { products, isLoading, error, lastUpdated, refresh } = useProducts();
//
// RETURNED VALUES
//   products     – Array of product objects from the API ([] while loading)
//   isLoading    – true while a network request is in-flight
//   error        – string message if the fetch failed, otherwise null
//   lastUpdated  – Date object recording when the data last arrived from the API
//   refresh()    – clears the cache and re-fetches from the network immediately
//
// =============================================================================

import { useState, useEffect } from 'react';

const API_URL = `${import.meta.env.VITE_API_URL}/api/products`;

// ─── Module-level cache ───────────────────────────────────────────────────────
//
// WHY it lives here (outside the hook function):
//   Variables inside a hook are LOCAL to each component instance and are
//   destroyed when the component unmounts. A module-level variable lives in
//   the JavaScript module's own scope — it is created once when the module is
//   first imported and stays alive for the entire browser session.
//
// WHAT it stores:
//   null                              → no data fetched yet
//   { products: Array,
//     lastUpdated: Date }             → data is ready; skip the network
//
// HOW it is shared:
//   Every component that calls useProducts() imports THIS module file and
//   therefore shares the same `cache` variable. The first caller populates it;
//   every subsequent caller reads from it without touching the network.
//
// TRADEOFFS
//   ✅ Eliminates redundant network requests when navigating between pages
//   ✅ Instant data on re-mount — no flash of empty state / loading spinner
//   ✅ Simple pattern — no external state library needed
//   ⚠️  Data can become stale if the server's products change during the session
//       (use refresh() or add a max-age check if you need auto-invalidation)
//   ⚠️  Cache is lost on a full page reload — that's expected browser behaviour
//   ⚠️  All hook callers share the same cache, so calling refresh() in one
//       component will cause the next mount of any other component to see fresh
//       data too (usually desirable, but be aware of it)
//
// ─────────────────────────────────────────────────────────────────────────────
let cache = null;
// ─────────────────────────────────────────────────────────────────────────────

export function useProducts() {

  // ── Initial state ──────────────────────────────────────────────────────────
  // If the cache is already populated (e.g. this component unmounted and
  // remounted), we pre-fill state with cached values so there is zero delay.
  const [products,    setProducts]    = useState(cache ? cache.products    : []);
  const [isLoading,   setIsLoading]   = useState(cache === null); // false when cache hit
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(cache ? cache.lastUpdated : null);

  // ── Internal fetch helper ──────────────────────────────────────────────────
  //
  // force = false  →  CACHE-FIRST:  return cached data immediately if available
  // force = true   →  NETWORK-FIRST: always hit the API (used by refresh())
  //
  const fetchProducts = (force = false) => {

    // ── Cache hit (normal navigation back to this page) ─────────────────────
    // The module-level `cache` is not null, and the caller did not set force,
    // so we simply sync React state with what we already have in memory and
    // return without making any network request.
    if (cache && !force) {
      setProducts(cache.products);
      setLastUpdated(cache.lastUpdated);
      setIsLoading(false);
      return; // ← exits here; no fetch() call made
    }

    // ── Cache miss OR forced refresh ─────────────────────────────────────────
    // Show the loading indicator and clear any previous error before fetching.
    setIsLoading(true);
    setError(null);

    fetch(API_URL)
      .then((res) => {
        // Treat non-2xx HTTP responses (e.g. 500) as errors
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const now = new Date();

        // ── Write to module-level cache ────────────────────────────────────
        // Any future call to fetchProducts(false) — whether from this or any
        // other component — will now receive this data without a network round
        // trip. The cache stays valid until refresh() is called or the tab
        // is reloaded.
        cache = { products: data, lastUpdated: now };

        // Sync React component state
        setProducts(data);
        setLastUpdated(now);
        setIsLoading(false);
      })
      .catch(() => {
        // Network failure or JSON parse error
        setError('Could not load products. Is the Flask server running?');
        setIsLoading(false);
        // NOTE: we do NOT wipe the cache here. If a previous successful fetch
        // cached data, other components can still use it even if this refresh
        // happened to fail.
      });
  };

  // ── Mount effect ───────────────────────────────────────────────────────────
  // Runs once when the component first renders.
  // If the cache is populated, fetchProducts() returns immediately (cache hit).
  // If the cache is empty, it starts a network request (cache miss).
  useEffect(() => {
    fetchProducts(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── refresh() ─────────────────────────────────────────────────────────────
  // Called by the UI "Refresh products" button.
  //   Step 1 – Invalidate the cache by resetting it to null.
  //            Any component mounting after this point will also see a stale
  //            cache and refetch automatically.
  //   Step 2 – Call fetchProducts(true) to bypass the now-null cache check
  //            and immediately start a network request.
  const refresh = () => {
    cache = null;         // ← invalidate; forces next mount to fetch too
    fetchProducts(true);  // ← always goes to the network
  };

  return { products, isLoading, error, lastUpdated, refresh };
}
