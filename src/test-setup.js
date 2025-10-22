// Test setup file for mocking Web APIs

// Setup global crypto object
Object.defineProperty(global, 'crypto', {
  value: require('crypto').webcrypto,
  writable: false,
});

// Setup TextEncoder and TextDecoder for jsdom environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Suppress styled-jsx errors in tests
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = String(args[0] || '');

  // Suppress styled-jsx React 19 compatibility warnings
  if (message.includes('jsx') || message.includes('non-boolean attribute')) {
    return;
  }

  originalConsoleError(...args);
};
