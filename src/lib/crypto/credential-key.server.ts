// Server-only accessor for the managed encryption secret. Call only inside a
// server function / server route handler. Never log or return the value.
export function getCredentialKey(): string | undefined {
  return process.env["CREDENTIALS_ENCRYPTION_KEY"];
}
