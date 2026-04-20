import { ECIES } from './ECIES';

describe('ECIES', () => {
  it('generates a key pair on construction', () => {
    const instance = new ECIES();
    const { private: privateKey, public: publicKey } = instance.getKeyInfo();

    expect(typeof privateKey).toBe('string');
    expect(privateKey.length).toBeGreaterThan(0);
    expect(typeof publicKey).toBe('string');
    expect(publicKey.length).toBeGreaterThan(0);
  });

  it('can be initialized from an existing private key hex', () => {
    const original = new ECIES();
    const { private: pkey, public: publicKey } = original.getKeyInfo();

    const restored = new ECIES({ pkey });
    expect(restored.getKeyInfo().private).toBe(pkey);
    expect(restored.getPublicKey()).toBe(publicKey);
  });

  it('generateECIES rotates the underlying key pair', () => {
    const instance = new ECIES();
    const before = instance.getPublicKey();
    instance.generateECIES();
    const after = instance.getPublicKey();

    expect(after).not.toBe(before);
  });

  it('encrypts a message that the recipient can decrypt', () => {
    const alice = new ECIES();
    const bob = new ECIES();

    const plaintext = 'hello bob';
    const encrypted = alice.encrypt(plaintext, bob.getPublicKey());

    expect(encrypted).not.toBe(plaintext);
    expect(bob.decrypt(encrypted)).toBe(plaintext);
  });

  it('throws when decrypting garbage data', () => {
    const instance = new ECIES();
    expect(() => instance.decrypt('not-really-encrypted')).toThrow();
  });

  it('throws when encrypting to an invalid public key', () => {
    const instance = new ECIES();
    expect(() => instance.encrypt('data', 'not-a-key')).toThrow();
  });

  it('toString logs key info without returning a value', () => {
    const instance = new ECIES();
    // toString is a debug helper that returns void
    expect(instance.toString()).toBeUndefined();
  });
});
