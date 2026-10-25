import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Los tests SIEMPRE corren en modo mock, aunque exista un .env.local con claves reales.
    env: {
      TEXT_PROVIDER: "mock",
      IMAGE_PROVIDER: "mock",
      GEMINI_API_KEY: "",
      OPENAI_COMPAT_API_KEY: "",
      OPENAI_COMPAT_IMAGE_API_KEY: "",
      APP_ACCESS_TOKEN: "",
      RATE_LIMIT_PER_HOUR: "",
    },
  },
});
