import { createApiClient } from "@tradegx/api-client";

// Instanța web a clientului partajat: same-origin + cookie httpOnly (NextAuth).
// Mobile va crea o instanță proprie cu baseUrl + Bearer token din secure-store.
// Aceeași definiție a apelurilor (packages/api-client) pe ambele platforme.
export const api = createApiClient({ baseUrl: "", credentials: "include" });
