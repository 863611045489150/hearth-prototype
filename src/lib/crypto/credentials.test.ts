// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  encryptSecret,
  decryptSecret,
  keyHint,
  MissingEncryptionKeyError,
  DecryptionError,
} from "./credentials";

// Fake test-only keys. Never real credentials.
const KEY_A = "test-key-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const KEY_B = "test-key-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const FAKE_API_KEY = "sk-test-FAKE-0000000000000000000000a91f";
const AAD = "user-1:config-1";

describe("credential encryption", () => {
  it("round-trips a secret", async () => {
    const enc = await encryptSecret(FAKE_API_KEY, KEY_A, AAD);
    expect(enc.ciphertext).not.toContain("sk-test");
    expect(await decryptSecret(enc, KEY_A, AAD)).toBe(FAKE_API_KEY);
  });

  it("uses a fresh IV each time", async () => {
    const a = await encryptSecret(FAKE_API_KEY, KEY_A, AAD);
    const b = await encryptSecret(FAKE_API_KEY, KEY_A, AAD);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it("rejects the wrong key", async () => {
    const enc = await encryptSecret(FAKE_API_KEY, KEY_A, AAD);
    await expect(decryptSecret(enc, KEY_B, AAD)).rejects.toBeInstanceOf(DecryptionError);
  });

  it("rejects modified ciphertext", async () => {
    const enc = await encryptSecret(FAKE_API_KEY, KEY_A, AAD);
    const bytes = atob(enc.ciphertext).split("");
    bytes[0] = String.fromCharCode(bytes[0].charCodeAt(0) ^ 0xff);
    const tampered = { ...enc, ciphertext: btoa(bytes.join("")) };
    await expect(decryptSecret(tampered, KEY_A, AAD)).rejects.toBeInstanceOf(DecryptionError);
  });

  it("rejects ciphertext moved to another user/config", async () => {
    const enc = await encryptSecret(FAKE_API_KEY, KEY_A, AAD);
    await expect(decryptSecret(enc, KEY_A, "user-2:config-1")).rejects.toBeInstanceOf(DecryptionError);
  });

  it("fails clearly when the key is missing or too short", async () => {
    await expect(encryptSecret(FAKE_API_KEY, undefined, AAD)).rejects.toBeInstanceOf(MissingEncryptionKeyError);
    await expect(encryptSecret(FAKE_API_KEY, "", AAD)).rejects.toBeInstanceOf(MissingEncryptionKeyError);
    await expect(encryptSecret(FAKE_API_KEY, "short", AAD)).rejects.toBeInstanceOf(MissingEncryptionKeyError);
    const enc = await encryptSecret(FAKE_API_KEY, KEY_A, AAD);
    await expect(decryptSecret(enc, undefined, AAD)).rejects.toBeInstanceOf(MissingEncryptionKeyError);
  });

  it("error messages never contain the secret", async () => {
    const enc = await encryptSecret(FAKE_API_KEY, KEY_A, AAD);
    const err = await decryptSecret(enc, KEY_B, AAD).catch((e: Error) => e);
    expect(String((err as Error).message)).not.toContain(FAKE_API_KEY);
  });

  it("key hint shows at most the last 4 characters", () => {
    expect(keyHint(FAKE_API_KEY)).toBe("sk-…a91f");
  });
});
