import { defineConfig } from "vitest/config";

// Extensia `.mts`, nu `.ts`: pachetul e CommonJS, iar un fișier de configurare cu
// sintaxă ESM încărcat ca CommonJS produce un avertisment la fiecare rulare.
//
// Aliasurile `@/` se rezolvă nativ din tsconfig — `vite-tsconfig-paths` nu mai e
// necesar de la Vite 7.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    // Tot ce testăm aici e logică pură: prețuri, cote, formatare, invarianți de
    // arhitectură. Nimic nu randează componente, deci `jsdom` ar fi doar încetineală.
    environment: "node",
    // Testele sunt pure si nu-si impartasesc stare: un worker refolosit intre
    // fisiere e sigur aici si taie ~1s din fiecare rulare.
    isolate: false,
    include: ["tests/**/*.test.ts"],
  },
});
