import { useSyncExternalStore } from "react";

const KEY = "soq-compare";
const MAX = 4;
let state: string[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    state = JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    state = [];
  }
}
function set(next: string[]) {
  state = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}
const EMPTY: string[] = [];

export function useCompare() {
  const list = useSyncExternalStore(
    (l) => {
      load();
      listeners.add(l);
      l();
      return () => listeners.delete(l);
    },
    () => (loaded ? state : EMPTY),
    () => EMPTY,
  );
  return {
    list,
    max: MAX,
    has: (slug: string) => list.includes(slug),
    toggle: (slug: string) =>
      set(list.includes(slug) ? list.filter((s) => s !== slug) : list.length >= MAX ? list : [...list, slug]),
    clear: () => set([]),
  };
}
