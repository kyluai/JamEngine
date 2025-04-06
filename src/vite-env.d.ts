/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_APPLE_MUSIC_DEVELOPER_TOKEN: string;
  VITE_APPLE_MUSIC_TEAM_ID: string;
  VITE_APPLE_MUSIC_KEY_ID: string;
  VITE_APPLE_MUSIC_PRIVATE_KEY: string;
  VITE_SPOTIFY_CLIENT_ID: string;
  VITE_SPOTIFY_CLIENT_SECRET: string;
  VITE_SPOTIFY_REDIRECT_URI: string;
  VITE_SOUNDCLOUD_CLIENT_ID: string;
  VITE_SOUNDCLOUD_CLIENT_SECRET: string;
  VITE_SOUNDCLOUD_REDIRECT_URI: string;
}

interface ImportMeta {
  env: ImportMetaEnv;
}
