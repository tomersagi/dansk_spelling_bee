/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PROD: boolean
  readonly DEV: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.jpg';
declare module '*.jpeg';
declare module '*.png';
declare module '*.svg'; 