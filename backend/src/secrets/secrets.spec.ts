import { NotFoundException } from '@nestjs/common';
import { SecretScope, SecretStatus, SecretType, type SecretRef } from '@prisma/client';
import { XorSecretCipher } from './cipher/xor-secret-cipher';
import { SecretMaterialRepository } from './repositories/secret-material.repository';
import { SecretRefRepository } from './repositories/secret-ref.repository';
import { StubSecretsProvider } from './services/stub-secrets-provider';

describe('XorSecretCipher (bouchon de dev)', () => {
  it('déchiffre ce qu’il a chiffré (round-trip), le chiffré diffère du clair', () => {
    const cipher = new XorSecretCipher();
    const plaintext = 'sk-live-1234567890abcd';
    const encrypted = cipher.encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(cipher.decrypt(encrypted)).toBe(plaintext);
  });

  it('refuse de démarrer en production (bouchon non cryptographique)', () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      expect(() => new XorSecretCipher()).toThrow(/jamais être utilisé en production/);
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});

describe('StubSecretsProvider (ADR.21)', () => {
  let refs: jest.Mocked<
    Pick<SecretRefRepository, 'findByReference' | 'upsert' | 'setStatus' | 'markRotated'>
  >;
  let material: jest.Mocked<Pick<SecretMaterialRepository, 'put' | 'getCiphertext' | 'delete'>>;
  let provider: StubSecretsProvider;
  const cipher = new XorSecretCipher();

  const ref = (over: Partial<SecretRef> = {}): SecretRef =>
    ({
      id: 'id-1',
      reference: 'ref-1',
      type: SecretType.AI_KEY,
      scope: SecretScope.USER,
      scopeId: 'user-1',
      provider: 'openai',
      lastFour: 'abcd',
      status: SecretStatus.CONFIGURED,
      createdAt: new Date('2026-07-20T00:00:00.000Z'),
      updatedAt: new Date('2026-07-20T00:00:00.000Z'),
      rotatedAt: null,
      expiresAt: null,
      ...over,
    }) as SecretRef;

  beforeEach(() => {
    refs = {
      findByReference: jest.fn(),
      upsert: jest.fn(),
      setStatus: jest.fn(),
      markRotated: jest.fn(),
    };
    material = { put: jest.fn(), getCiphertext: jest.fn(), delete: jest.fn() };
    provider = new StubSecretsProvider(
      refs as unknown as SecretRefRepository,
      material as unknown as SecretMaterialRepository,
      cipher,
    );
  });

  it('put : chiffre la valeur, ne renvoie que des métadonnées masquées (jamais la valeur)', async () => {
    refs.upsert.mockResolvedValue(ref());
    const meta = await provider.put({
      type: SecretType.AI_KEY,
      scope: SecretScope.USER,
      scopeId: 'user-1',
      provider: 'openai',
      value: 'sk-live-secret-abcd',
    });
    // La valeur stockée est chiffrée (différente du clair).
    expect(material.put).toHaveBeenCalledTimes(1);
    expect(material.put.mock.calls[0][1]).not.toContain('sk-live-secret-abcd');
    // Réponse masquée uniquement.
    expect(meta.masked).toBe('••••abcd');
    expect(JSON.stringify(meta)).not.toContain('sk-live-secret-abcd');
  });

  it('resolve : renvoie la valeur en clair uniquement au point d’usage', async () => {
    refs.findByReference.mockResolvedValue(ref());
    material.getCiphertext.mockResolvedValue(cipher.encrypt('sk-live-secret-abcd'));
    await expect(provider.resolve('ref-1')).resolves.toBe('sk-live-secret-abcd');
  });

  it('resolve : bloqué pour un secret révoqué', async () => {
    refs.findByReference.mockResolvedValue(ref({ status: SecretStatus.REVOKED }));
    await expect(provider.resolve('ref-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(material.getCiphertext).not.toHaveBeenCalled();
  });

  it('revoke : supprime la valeur et marque REVOKED', async () => {
    refs.setStatus.mockResolvedValue(ref({ status: SecretStatus.REVOKED }));
    await provider.revoke('ref-1');
    expect(material.delete).toHaveBeenCalledWith('ref-1');
    expect(refs.setStatus).toHaveBeenCalledWith('ref-1', SecretStatus.REVOKED);
  });

  it('rotate : renouvelle la valeur en gardant la même référence', async () => {
    refs.findByReference.mockResolvedValue(ref());
    refs.markRotated.mockResolvedValue(ref({ lastFour: 'wxyz' }));
    const meta = await provider.rotate('ref-1', 'sk-new-value-wxyz');
    expect(material.put).toHaveBeenCalledWith('ref-1', expect.any(String));
    expect(meta.reference).toBe('ref-1');
    expect(meta.masked).toBe('••••wxyz');
  });
});
