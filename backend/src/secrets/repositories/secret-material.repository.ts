import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

/**
 * Stockage de la valeur chiffrée (backend bouchon). Séparé des métadonnées : un vault externe
 * remplacerait ce repository sans toucher aux références (ADR.21). Ne renvoie jamais de valeur en
 * clair (le déchiffrement est fait par le provider au point d'usage).
 */
@Injectable()
export class SecretMaterialRepository {
  constructor(private readonly prisma: PrismaService) {}

  async put(reference: string, ciphertext: string): Promise<void> {
    await this.prisma.secretMaterial.upsert({
      where: { reference },
      update: { ciphertext },
      create: { reference, ciphertext },
    });
  }

  async getCiphertext(reference: string): Promise<string | null> {
    const material = await this.prisma.secretMaterial.findUnique({ where: { reference } });
    return material?.ciphertext ?? null;
  }

  async delete(reference: string): Promise<void> {
    await this.prisma.secretMaterial.deleteMany({ where: { reference } });
  }
}
