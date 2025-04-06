import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
vi.stubEnv('VITE_APPLE_MUSIC_DEVELOPER_TOKEN', 'test_token');
vi.stubEnv('VITE_APPLE_MUSIC_TEAM_ID', 'test_team_id');
vi.stubEnv('VITE_APPLE_MUSIC_KEY_ID', 'test_key_id');
vi.stubEnv('VITE_APPLE_MUSIC_PRIVATE_KEY', 'test_private_key');
vi.stubEnv('VITE_SOUNDCLOUD_CLIENT_ID', 'test_client_id');
vi.stubEnv('VITE_SOUNDCLOUD_CLIENT_SECRET', 'test_client_secret');
vi.stubEnv('VITE_SOUNDCLOUD_REDIRECT_URI', 'http://localhost:3000/callback');

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
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