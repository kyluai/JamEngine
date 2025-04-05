/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPLE_MUSIC_DEVELOPER_TOKEN: string;
  readonly VITE_APPLE_MUSIC_TEAM_ID: string;
  readonly VITE_APPLE_MUSIC_KEY_ID: string;
  readonly VITE_APPLE_MUSIC_PRIVATE_KEY: string;
  readonly VITE_SOUNDCLOUD_CLIENT_ID: string;
  readonly VITE_SOUNDCLOUD_CLIENT_SECRET: string;
  readonly VITE_SOUNDCLOUD_REDIRECT_URI: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 