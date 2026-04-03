import { generateKeyPair, signMessage, verifySignature } from "../crypto";

describe("crypto", () => {
  describe("generateKeyPair", () => {
    it("returns hex strings of correct length", async () => {
      const keyPair = await generateKeyPair();

      // Ed25519 public key is 32 bytes = 64 hex chars
      expect(keyPair.publicKey).toHaveLength(64);
      // Ed25519 private key is 32 bytes = 64 hex chars
      expect(keyPair.privateKey).toHaveLength(64);
    });

    it("generates unique keypairs", async () => {
      const kp1 = await generateKeyPair();
      const kp2 = await generateKeyPair();

      expect(kp1.publicKey).not.toBe(kp2.publicKey);
      expect(kp1.privateKey).not.toBe(kp2.privateKey);
    });

    it("produces valid hex strings", async () => {
      const keyPair = await generateKeyPair();

      expect(keyPair.publicKey).toMatch(/^[0-9a-f]+$/);
      expect(keyPair.privateKey).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe("signMessage and verifySignature", () => {
    it("round-trips: sign then verify succeeds", async () => {
      const keyPair = await generateKeyPair();
      const message = "v3:ios:mobile:nonce123:1000";

      const signature = await signMessage(message, keyPair.privateKey);
      const valid = await verifySignature(
        message,
        signature,
        keyPair.publicKey
      );

      expect(valid).toBe(true);
    });

    it("returns false for tampered message", async () => {
      const keyPair = await generateKeyPair();
      const message = "original message";

      const signature = await signMessage(message, keyPair.privateKey);
      const valid = await verifySignature(
        "tampered message",
        signature,
        keyPair.publicKey
      );

      expect(valid).toBe(false);
    });

    it("returns false for wrong public key", async () => {
      const kp1 = await generateKeyPair();
      const kp2 = await generateKeyPair();
      const message = "test message";

      const signature = await signMessage(message, kp1.privateKey);
      const valid = await verifySignature(message, signature, kp2.publicKey);

      expect(valid).toBe(false);
    });

    it("produces a deterministic signature for same input", async () => {
      const keyPair = await generateKeyPair();
      const message = "deterministic test";

      const sig1 = await signMessage(message, keyPair.privateKey);
      const sig2 = await signMessage(message, keyPair.privateKey);

      // Ed25519 signatures are deterministic
      expect(sig1).toBe(sig2);
    });

    it("produces a signature of correct length", async () => {
      const keyPair = await generateKeyPair();
      const signature = await signMessage("test", keyPair.privateKey);

      // Ed25519 signature is 64 bytes = 128 hex chars
      expect(signature).toHaveLength(128);
      expect(signature).toMatch(/^[0-9a-f]+$/);
    });
  });
});
