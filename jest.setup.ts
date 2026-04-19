import '@testing-library/jest-dom'

// Polyfills for Radix UI components in jsdom (only applies when window is defined)
if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.hasPointerCapture = jest.fn()
  window.HTMLElement.prototype.releasePointerCapture = jest.fn()
  window.HTMLElement.prototype.setPointerCapture = jest.fn()
  window.HTMLElement.prototype.scrollIntoView = jest.fn()
}
