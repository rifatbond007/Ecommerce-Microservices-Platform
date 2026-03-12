import { Router } from 'express';
import profilesRoutes from '../modules/profiles/profiles.route';
import addressesRoutes from '../modules/addresses/addresses.route';
import wishlistsRoutes from '../modules/wishlists/wishlists.route';
import reviewsRoutes from '../modules/reviews/reviews.route';

export {
  profilesRoutes,
  addressesRoutes,
  wishlistsRoutes,
  reviewsRoutes,
};

const router = Router();

router.use('/profiles', profilesRoutes);
router.use('/addresses', addressesRoutes);
router.use('/wishlists', wishlistsRoutes);
router.use('/reviews', reviewsRoutes);

export default router;
