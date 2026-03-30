import { Router } from 'express';
import profilesRoutes from '../modules/profiles/profiles.route';
import addressesRoutes from '../modules/addresses/addresses.route';
import wishlistsRoutes from '../modules/wishlists/wishlists.route';
import reviewsRoutes from '../modules/reviews/reviews.route';
import sellersRoutes from '../modules/sellers/sellers.route';

export {
  profilesRoutes,
  addressesRoutes,
  wishlistsRoutes,
  reviewsRoutes,
  sellersRoutes,
};

const router = Router();

router.use('/users/me', profilesRoutes);
router.use('/users/me/addresses', addressesRoutes);
router.use('/users/me/wishlists', wishlistsRoutes);
router.use('/users/me/reviews', reviewsRoutes);
router.use('/sellers', sellersRoutes);

export default router;
