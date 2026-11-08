import { useStudioStore } from "@/lib/store";

export type RouteNavigationRequest = { href: string; label: string; commit: () => void };
type NavigationOwner = (request: RouteNavigationRequest) => boolean;
let owner: NavigationOwner | null = null;

/** One shell owner, never a timeout attached to a link that may unmount. */
export function registerRouteNavigation(handler: NavigationOwner) {
  owner = handler;
  return () => { if (owner === handler) owner = null; };
}

export function navigateStudioRoute(href: string, router: { push: (href: string) => void }, label = "page"): boolean {
  const state = useStudioStore.getState();
  const request = { href, label, commit: () => router.push(href) };
  if (typeof window !== "undefined" && new URL(href, location.href).pathname === location.pathname) {
    state.setMenuOpen(false);
    request.commit(); // query/hash changes do not produce a pathname commit signal
    return true;
  }
  if (owner) return owner(request);
  // Hydration/isolated component fallback must never strand a link behind a curtain.
  state.setMenuOpen(false);
  request.commit();
  return true;
}

/** Keep modified clicks, downloads, new tabs, protocols and fragments native. */
export function shouldTransitionAnchor(event: {
  defaultPrevented: boolean; button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean;
}, anchor: HTMLAnchorElement): boolean {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
    anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return false;
  const raw = anchor.getAttribute("href") || "";
  if (!raw || raw.startsWith("#")) return false;
  const url = new URL(anchor.href, location.href);
  return url.origin === location.origin && ["http:", "https:"].includes(url.protocol);
}
