import '@testing-library/jest-dom';
import { webcrypto } from 'crypto';
import { TextEncoder, TextDecoder } from 'util';

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
Object.defineProperty(globalThis, 'TextEncoder', { value: TextEncoder, configurable: true });
Object.defineProperty(globalThis, 'TextDecoder', { value: TextDecoder, configurable: true });

if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = function scrollIntoView() {
    /* jsdom */
  };
}

