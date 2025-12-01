import { expect, afterEach, vi, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// Mock localStorage with typed storage
const storage: Record<string, string> = {};
const localStorageMock: Storage = {
  getItem: (key: string): string | null => storage[key] || null,
  setItem: (key: string, value: string): void => { storage[key] = value; },
  removeItem: (key: string): void => { delete storage[key]; },
  clear: (): void => { Object.keys(storage).forEach(key => delete storage[key]); },
  get length(): number { return Object.keys(storage).length; },
  key: (index: number): string | null => Object.keys(storage)[index] || null,
};
global.localStorage = localStorageMock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Element pointer capture methods for Radix UI
Element.prototype.hasPointerCapture = vi.fn();
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();

// Mock fetch - default to throwing unless explicitly mocked per test
global.fetch = vi.fn().mockImplementation(() => {
  throw new Error('Unmocked fetch call detected. Mock fetch in your test.');
});
