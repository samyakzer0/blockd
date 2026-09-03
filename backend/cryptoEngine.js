/**
 * BlockD Cryptographic Engine (JavaScript / Node.js)
 * Implements AES-256-GCM authenticated encryption/decryption,
 * secure key generation, and SHA-256 evidence integrity hashing.
 */

const crypto = require("crypto");

class CryptoEngine {
  /**
   * Generates a cryptographically secure 256-bit (32-byte) AES key in hex.
   * @returns {string} 64-character hex string
   */
  static generateAesKeyHex() {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Computes SHA-256 checksum of raw payload.
   * @param {Buffer|string} data
   * @returns {string} 64-character lowercase hex string
   */
  static computeSha256(data) {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Computes bytes32 formatted SHA-256 hash for Solidity smart contract verification.
   * @param {Buffer|string} data
   * @returns {string} 0x-prefixed 32-byte hex string
   */
  static computeSha256Bytes32(data) {
    return "0x" + crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Encrypts raw data using AES-256-GCM.
   * @param {Buffer|string} data - Raw payload
   * @param {string} keyHex - 64-char hex key
   * @returns {Object} { nonceB64, ciphertextB64, authTagB64, sha256Checksum, keyHex }
   */
  static encrypt(data, keyHex) {
    const rawBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, "utf-8");
    const key = Buffer.from(keyHex, "hex");
    const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM

    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(rawBuffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const checksum = this.computeSha256(rawBuffer);

    return {
      nonceB64: iv.toString("base64"),
      ciphertextB64: encrypted.toString("base64"),
      authTagB64: authTag.toString("base64"),
      sha256Checksum: checksum,
      keyHex: keyHex,
    };
  }

  /**
   * Decrypts an AES-256-GCM package and cryptographically verifies SHA-256 integrity.
   * @param {Object} encryptedPackage - Output from encrypt()
   * @param {string} keyHex - 64-char hex key
   * @returns {Buffer} Decrypted raw bytes
   */
  static decrypt(encryptedPackage, keyHex) {
    const key = Buffer.from(keyHex, "hex");
    const iv = Buffer.from(encryptedPackage.nonceB64, "base64");
    const ciphertext = Buffer.from(encryptedPackage.ciphertextB64, "base64");
    const authTag = Buffer.from(encryptedPackage.authTagB64, "base64");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    // Validate data integrity
    const computedChecksum = this.computeSha256(decrypted);
    if (
      encryptedPackage.sha256Checksum &&
      computedChecksum.toLowerCase() !== encryptedPackage.sha256Checksum.toLowerCase()
    ) {
      throw new Error(
        `Data integrity violation! Expected ${encryptedPackage.sha256Checksum}, got ${computedChecksum}`
      );
    }

    return decrypted;
  }
}

module.exports = { CryptoEngine };
