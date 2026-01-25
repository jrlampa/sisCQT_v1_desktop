/// <reference types="vite/client" />

declare global {
  interface Window {
    siscqtDesktop?: {
      version?: string;
      openExternal?: (url: string) => Promise<boolean>;
    };
  }
}

export {};

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

