import prisma from './prisma.client';

export interface CreateAddressData {
  userId: string;
  type?: string;
  isDefault?: boolean;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  deliveryInstructions?: string;
}

export interface UpdateAddressData {
  type?: string;
  isDefault?: boolean;
  firstName?: string;
  lastName?: string;
  company?: string | null;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string | null;
  deliveryInstructions?: string | null;
}

export class AddressRepository {
  async findById(id: string) {
    return prisma.address.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserIdAndType(userId: string, type: string) {
    return prisma.address.findMany({
      where: { userId, type },
      orderBy: { isDefault: 'desc' },
    });
  }

  async create(data: CreateAddressData) {
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: data.userId, type: data.type || 'shipping' },
        data: { isDefault: false },
      });
    }

    return prisma.address.create({
      data: {
        userId: data.userId,
        type: data.type || 'shipping',
        isDefault: data.isDefault || false,
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        phone: data.phone,
        deliveryInstructions: data.deliveryInstructions,
      },
    });
  }

  async update(id: string, userId: string, data: UpdateAddressData) {
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, type: data.type || 'shipping' },
        data: { isDefault: false },
      });
    }

    return prisma.address.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.address.delete({
      where: { id },
    });
  }

  async setDefault(id: string, userId: string, type: string) {
    await prisma.address.updateMany({
      where: { userId, type },
      data: { isDefault: false },
    });

    return prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });
  }
}

export const addressRepository = new AddressRepository();
