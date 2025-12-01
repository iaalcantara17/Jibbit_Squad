import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// --- localStorage (typed, no `any`) ---
class LocalStorageMock implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) ?? null) : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

Object.defineProperty(globalThis, "localStorage", {
  value: new LocalStorageMock(),
  configurable: true,
});

// --- matchMedia ---
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string): MediaQueryList => {
    const mql: MediaQueryList = {
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated but used by some libs
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
    return mql;
  }),
});

// --- fetch (give it a sane default, tests can override per-test) ---
const fetchMock = vi.fn<(...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>>(
  () => Promise.reject(new Error("fetch was called but not mocked in this test"))
);
vi.stubGlobal("fetch", fetchMock);

// --- ResizeObserver (fixes Recharts crash) ---
if (!("ResizeObserver" in globalThis)) {
  class ResizeObserverMock {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
}

// --- Pointer capture (fixes Radix Select crash: hasPointerCapture not a function) ---
declare global {
  interface HTMLElement {
    setPointerCapture?(pointerId: number): void;
    releasePointerCapture?(pointerId: number): void;
    hasPointerCapture?(pointerId: number): boolean;
  }
}

if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = () => false;
}
if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = () => {};
}
if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = () => {};
}

// Some libraries expect PointerEvent to exist
if (!("PointerEvent" in globalThis)) {
  vi.stubGlobal("PointerEvent", window.MouseEvent);
}

// --- Blob.text() (fixes blob.text is not a function) ---
if (typeof Blob !== "undefined" && !Blob.prototype.text) {
  // eslint-disable-next-line no-extend-native
  Blob.prototype.text = function (): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}

// --- URL.createObjectURL safety (often missing in jsdom) ---
if (!globalThis.URL.createObjectURL) {
  globalThis.URL.createObjectURL = (() => "blob:vitest-mock") as typeof URL.createObjectURL;
}
if (!globalThis.URL.revokeObjectURL) {
  globalThis.URL.revokeObjectURL = (() => {}) as typeof URL.revokeObjectURL;
}
