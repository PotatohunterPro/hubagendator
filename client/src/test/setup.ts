import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom não implementa matchMedia/scrollTo — usados pelo layout e navegação.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}
window.scrollTo = vi.fn();

afterEach(() => {
  cleanup();
});
