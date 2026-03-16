import prisma from './prisma.client';

export interface CreateSavedCartData {
  userId: string;
  name: string;
  items: any[];
  originalCartId?: string;
}

export class SavedCartRepository {
  async findById(id: string) {
    return prisma.savedCart.findUnique({ where: { id } });
  }

  async findByUserId(userId: string) {
    return prisma.savedCart.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateSavedCartData) {
    return prisma.savedCart.create({
      data: {
        userId: data.userId,
        name: data.name,
        items: data.items as any,
        originalCartId: data.originalCartId,
      },
    });
  }

  async update(id: string, data: Partial<CreateSavedCartData>) {
    return prisma.savedCart.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await prisma.savedCart.delete({ where: { id } });
  }
}

export const savedCartRepository = new SavedCartRepository();
