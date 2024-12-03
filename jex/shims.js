import { Buffer } from 'buffer'

// Ensure Buffer is available globally
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer
}
