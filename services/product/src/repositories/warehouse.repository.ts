import prisma from './prisma.client';

export interface CreateWarehouseData {
  name: string;
  code: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isActive?: boolean;
}

export interface UpdateWarehouseData {
  name?: string;
  code?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isActive?: boolean;
}

export class WarehouseRepository {
  async findById(id: string) {
    return prisma.warehouse.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string) {
    return prisma.warehouse.findUnique({
      where: { code },
    });
  }

  async findAll(includeInactive: boolean = false) {
    return prisma.warehouse.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findDefault() {
    return prisma.warehouse.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(data: CreateWarehouseData) {
    return prisma.warehouse.create({
      data: {
        name: data.name,
        code: data.code,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: UpdateWarehouseData) {
    return prisma.warehouse.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.warehouse.delete({
      where: { id },
    });
  }
}

export const warehouseRepository = new WarehouseRepository();
