/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MIMO_API_KEY: string
  readonly VITE_MIMO_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
