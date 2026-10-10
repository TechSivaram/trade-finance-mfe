/** Dispatch a typed-by-contract event on the current browser page. */
export function emitMfEvent(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}
