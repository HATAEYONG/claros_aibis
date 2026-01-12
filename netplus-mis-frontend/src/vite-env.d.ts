/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_ENV: string;
  readonly VITE_OPENAI_API_KEY?: string;
  // 추가 환경변수들
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
