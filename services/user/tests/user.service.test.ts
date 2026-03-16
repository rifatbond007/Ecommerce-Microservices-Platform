import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../src/repositories/profile.repository', () => ({
  profileRepository: {
    findByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../src/repositories/address.repository', () => ({
  addressRepository: {
    findByUserId: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../src/repositories/wishlist.repository', () => ({
  wishlistRepository: {
    findByUserId: jest.fn(),
    findById: jest.fn(),
    findItem: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    addItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../src/repositories/review.repository', () => ({
  reviewRepository: {
    findById: jest.fn(),
    findByProductId: jest.fn(),
    findByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Profiles', () => {
    it('should get user profile successfully', async () => {
      const { profilesService } = await import('../src/modules/profiles/profiles.service');
      const { profileRepository } = await import('../src/repositories/profile.repository');
      
      (profileRepository.findByUserId as jest.Mock).mockResolvedValue({
        userId: 'user-id',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        language: 'en',
        timezone: 'UTC',
        currency: 'USD',
        bio: 'Test bio',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await profilesService.getProfile('user-id');

      expect(result.userId).toBe('user-id');
      expect(profileRepository.findByUserId).toHaveBeenCalledWith('user-id');
    });

    it('should throw NotFoundError if profile not found', async () => {
      const { profilesService } = await import('../src/modules/profiles/profiles.service');
      const { profileRepository } = await import('../src/repositories/profile.repository');
      
      (profileRepository.findByUserId as jest.Mock).mockResolvedValue(null);

      await expect(profilesService.getProfile('user-id')).rejects.toThrow('Profile not found');
    });

    it('should create profile successfully', async () => {
      const { profilesService } = await import('../src/modules/profiles/profiles.service');
      const { profileRepository } = await import('../src/repositories/profile.repository');
      
      (profileRepository.findByUserId as jest.Mock).mockResolvedValue(null);
      (profileRepository.create as jest.Mock).mockResolvedValue({
        userId: 'user-id',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        language: 'en',
        timezone: 'UTC',
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await profilesService.createProfile('user-id', {
        dateOfBirth: '1990-01-01',
        gender: 'male',
        language: 'en',
        timezone: 'UTC',
        currency: 'USD',
      });

      expect(result.userId).toBe('user-id');
      expect(profileRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictError if profile already exists', async () => {
      const { profilesService } = await import('../src/modules/profiles/profiles.service');
      const { profileRepository } = await import('../src/repositories/profile.repository');
      
      (profileRepository.findByUserId as jest.Mock).mockResolvedValue({
        userId: 'user-id',
        dateOfBirth: new Date('1990-01-01'),
      });

      await expect(profilesService.createProfile('user-id', {})).rejects.toThrow('Profile already exists');
    });
  });

  describe('Addresses', () => {
    it('should get user addresses successfully', async () => {
      const { addressesService } = await import('../src/modules/addresses/addresses.service');
      const { addressRepository } = await import('../src/repositories/address.repository');
      
      (addressRepository.findByUserId as jest.Mock).mockResolvedValue([
        { id: 'address-1', userId: 'user-id', type: 'shipping' },
        { id: 'address-2', userId: 'user-id', type: 'billing' },
      ]);

      const result = await addressesService.getAddresses('user-id');

      expect(result).toHaveLength(2);
      expect(addressRepository.findByUserId).toHaveBeenCalledWith('user-id');
    });

    it('should create address successfully', async () => {
      const { addressesService } = await import('../src/modules/addresses/addresses.service');
      const { addressRepository } = await import('../src/repositories/address.repository');
      
      (addressRepository.create as jest.Mock).mockResolvedValue({
        id: 'address-1',
        userId: 'user-id',
        type: 'shipping',
        firstName: 'John',
        lastName: 'Doe',
      });

      const result = await addressesService.createAddress('user-id', {
        type: 'shipping',
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      });

      expect(result.id).toBe('address-1');
      expect(addressRepository.create).toHaveBeenCalled();
    });

    it('should update address successfully', async () => {
      const { addressesService } = await import('../src/modules/addresses/addresses.service');
      const { addressRepository } = await import('../src/repositories/address.repository');
      
      (addressRepository.findById as jest.Mock).mockResolvedValue({
        id: 'address-1',
        userId: 'user-id',
      });
      (addressRepository.update as jest.Mock).mockResolvedValue({
        id: 'address-1',
        userId: 'user-id',
        firstName: 'Jane',
      });

      const result = await addressesService.updateAddress('address-1', 'user-id', {
        firstName: 'Jane',
      });

      expect(result.firstName).toBe('Jane');
    });

    it('should throw NotFoundError if address not found', async () => {
      const { addressesService } = await import('../src/modules/addresses/addresses.service');
      const { addressRepository } = await import('../src/repositories/address.repository');
      
      (addressRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        addressesService.updateAddress('address-1', 'user-id', { firstName: 'Jane' })
      ).rejects.toThrow('Address not found');
    });

    it('should delete address successfully', async () => {
      const { addressesService } = await import('../src/modules/addresses/addresses.service');
      const { addressRepository } = await import('../src/repositories/address.repository');
      
      (addressRepository.findById as jest.Mock).mockResolvedValue({
        id: 'address-1',
        userId: 'user-id',
      });
      (addressRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await expect(addressesService.deleteAddress('address-1', 'user-id')).resolves.not.toThrow();
    });
  });

  describe('Wishlists', () => {
    it('should get user wishlists successfully', async () => {
      const { wishlistsService } = await import('../src/modules/wishlists/wishlists.service');
      const { wishlistRepository } = await import('../src/repositories/wishlist.repository');
      
      (wishlistRepository.findByUserId as jest.Mock).mockResolvedValue([
        { id: 'wishlist-1', userId: 'user-id', name: 'My Wishlist', items: [] },
      ]);

      const result = await wishlistsService.getWishlists('user-id');

      expect(result).toHaveLength(1);
    });

    it('should create wishlist successfully', async () => {
      const { wishlistsService } = await import('../src/modules/wishlists/wishlists.service');
      const { wishlistRepository } = await import('../src/repositories/wishlist.repository');
      
      (wishlistRepository.create as jest.Mock).mockResolvedValue({
        id: 'wishlist-1',
        userId: 'user-id',
        name: 'Birthday Gifts',
        items: [],
      });

      const result = await wishlistsService.createWishlist('user-id', {
        name: 'Birthday Gifts',
      });

      expect(result.name).toBe('Birthday Gifts');
    });

    it('should add item to wishlist successfully', async () => {
      const { wishlistsService } = await import('../src/modules/wishlists/wishlists.service');
      const { wishlistRepository } = await import('../src/repositories/wishlist.repository');
      
      (wishlistRepository.findById as jest.Mock).mockResolvedValue({
        id: 'wishlist-1',
        userId: 'user-id',
        items: [],
      });
      (wishlistRepository.findItem as jest.Mock).mockResolvedValue(null);
      (wishlistRepository.addItem as jest.Mock).mockResolvedValue({
        id: 'item-1',
        wishlistId: 'wishlist-1',
        productId: 'product-1',
      });

      const result = await wishlistsService.addItem('wishlist-1', 'user-id', {
        productId: 'product-1',
      });

      expect(result.productId).toBe('product-1');
    });

    it('should remove item from wishlist successfully', async () => {
      const { wishlistsService } = await import('../src/modules/wishlists/wishlists.service');
      const { wishlistRepository } = await import('../src/repositories/wishlist.repository');
      
      (wishlistRepository.findById as jest.Mock).mockResolvedValue({
        id: 'wishlist-1',
        userId: 'user-id',
        items: [],
      });
      (wishlistRepository.removeItem as jest.Mock).mockResolvedValue(undefined);

      await expect(
        wishlistsService.removeItem('wishlist-1', 'product-1', 'user-id')
      ).resolves.not.toThrow();
    });
  });

  describe('Reviews', () => {
    it('should get reviews by product successfully', async () => {
      const { reviewsService } = await import('../src/modules/reviews/reviews.service');
      const { reviewRepository } = await import('../src/repositories/review.repository');
      
      (reviewRepository.findByProductId as jest.Mock).mockResolvedValue({
        reviews: [
          { id: 'review-1', productId: 'product-1', rating: 5, title: 'Great!', content: 'Awesome product' },
        ],
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await reviewsService.getProductReviews('product-1');

      expect(result.reviews).toHaveLength(1);
      expect(result.reviews[0].rating).toBe(5);
    });

    it('should create review successfully', async () => {
      const { reviewsService } = await import('../src/modules/reviews/reviews.service');
      const { reviewRepository } = await import('../src/repositories/review.repository');
      
      (reviewRepository.create as jest.Mock).mockResolvedValue({
        id: 'review-1',
        userId: 'user-id',
        productId: 'product-1',
        rating: 5,
        title: 'Great!',
        content: 'Awesome product',
        isApproved: false,
      });

      const result = await reviewsService.createReview('user-id', {
        productId: 'product-1',
        rating: 5,
        title: 'Great!',
        content: 'Awesome product',
      });

      expect(result.rating).toBe(5);
    });
  });
});
