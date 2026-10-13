/**
 * Portable credential encryption (AES-256-GCM via Web Crypto).
 * Pure functions: the caller passes key material, so this module never reads
 * environment variables and works in Workers, Node, and a future desktop shell.
 * Never log inputs or outputs of these functions.
 */

export class MissingEncryptionKeyError extends Error {
  constructor() {
    super("Credential encryption is not configured.");
    this.name = "MissingEncryptionKeyError";
  }
}

export class DecryptionError extends Error {
  constructor() {
    super("Stored credential could not be decrypted.");
    this.name = "DecryptionError";
  }
}

export interface EncryptedSecret {
  ciphertext: string; // base64
  iv: string; // base64
  keyVersion: number;
}

export const CURRENT_KEY_VERSION = 1;
const MIN_KEY_LENGTH = 32;

function toB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function fromB64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(keyMaterial: string | undefined | null): Promise<CryptoKey> {
  if (!keyMaterial || keyMaterial.length < MIN_KEY_LENGTH) throw new MissingEncryptionKeyError();
  const raw = await crypto.subtle.importKey("raw", new TextEncoder().encode(keyMaterial), "HKDF", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new TextEncoder().encode("hearth.credentials.v1"),
      info: new TextEncoder().encode("provider-api-key"),
    },
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** `aad` binds ciphertext to its owner (e.g. `${userId}:${configId}`) so rows can't be swapped. */
export async function encryptSecret(
  plaintext: string,
  keyMaterial: string | undefined | null,
  aad: string,
): Promise<EncryptedSecret> {
  if (!plaintext) throw new Error("Nothing to encrypt.");
  const key = await deriveKey(keyMaterial);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(aad) },
    key,
    new TextEncoder().encode(plaintext),
  );
  return { ciphertext: toB64(new Uint8Array(ct)), iv: toB64(iv), keyVersion: CURRENT_KEY_VERSION };
}

export async function decryptSecret(
  secret: EncryptedSecret,
  keyMaterial: string | undefined | null,
  aad: string,
): Promise<string> {
  const key = await deriveKey(keyMaterial);
  try {
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromB64(secret.iv), additionalData: new TextEncoder().encode(aad) },
      key,
      fromB64(secret.ciphertext),
    );
    return new TextDecoder().decode(pt);
  } catch {
    throw new DecryptionError();
  }
}

/** Display-safe hint, e.g. "sk-…a91f". Never returns more than 4 trailing chars. */
export function keyHint(plaintext: string): string {
  const tail = plaintext.slice(-4);
  const head = plaintext.length > 12 ? plaintext.slice(0, 3) : "";
  return `${head}…${tail}`;
}
