import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.crypto for tests running in jsdom (lacks crypto.getRandomValues)
Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256)
      return arr
    },
    randomUUID: () => '00000000-0000-4000-8000-000000000000',
  },
})

// Mock window.plausible (analytics stub)
Object.defineProperty(window, 'plausible', {
  value: vi.fn(),
  writable: true,
})

// jsdom does not implement scrollIntoView — stub it so components that call it don't crash
Element.prototype.scrollIntoView = vi.fn()

// Suppress React act() warnings in tests
globalThis.IS_REACT_ACT_ENVIRONMENT = true
