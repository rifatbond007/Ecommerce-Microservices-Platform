import { addressRepository } from '../../repositories';
import { NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import type { CreateAddressInput, UpdateAddressInput } from './addresses.validator';

export interface AddressResponse {
  id: string;
  userId: string;
  type: string;
  isDefault: boolean;
  firstName: string;
  lastName: string;
  company: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string | null;
  deliveryInstructions: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AddressesService {
  async getAddresses(userId: string, type?: string): Promise<AddressResponse[]> {
    const addresses = type
      ? await addressRepository.findByUserIdAndType(userId, type)
      : await addressRepository.findByUserId(userId);

    return addresses.map(this.formatAddressResponse);
  }

  async getAddressById(id: string, userId: string): Promise<AddressResponse> {
    const address = await addressRepository.findById(id);

    if (!address || address.userId !== userId) {
      throw new NotFoundError('Address');
    }

    return this.formatAddressResponse(address);
  }

  async createAddress(userId: string, input: CreateAddressInput): Promise<AddressResponse> {
    const address = await addressRepository.create({
      userId,
      type: input.type,
      isDefault: input.isDefault,
      firstName: input.firstName,
      lastName: input.lastName,
      company: input.company,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: input.country,
      phone: input.phone,
      deliveryInstructions: input.deliveryInstructions,
    });

    logger.info('Address created', { userId, addressId: address.id });

    return this.formatAddressResponse(address);
  }

  async updateAddress(id: string, userId: string, input: UpdateAddressInput): Promise<AddressResponse> {
    const existing = await addressRepository.findById(id);

    if (!existing || existing.userId !== userId) {
      throw new NotFoundError('Address');
    }

    const address = await addressRepository.update(id, userId, input);

    logger.info('Address updated', { userId, addressId: id });

    return this.formatAddressResponse(address);
  }

  async deleteAddress(id: string, userId: string): Promise<void> {
    const existing = await addressRepository.findById(id);

    if (!existing || existing.userId !== userId) {
      throw new NotFoundError('Address');
    }

    await addressRepository.delete(id);

    logger.info('Address deleted', { userId, addressId: id });
  }

  async setDefaultAddress(id: string, userId: string, type: string): Promise<AddressResponse> {
    const existing = await addressRepository.findById(id);

    if (!existing || existing.userId !== userId) {
      throw new NotFoundError('Address');
    }

    const address = await addressRepository.setDefault(id, userId, type);

    logger.info('Address set as default', { userId, addressId: id });

    return this.formatAddressResponse(address);
  }

  private formatAddressResponse(address: any): AddressResponse {
    return {
      id: address.id,
      userId: address.userId,
      type: address.type,
      isDefault: address.isDefault,
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone,
      deliveryInstructions: address.deliveryInstructions,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }
}

export const addressesService = new AddressesService();
