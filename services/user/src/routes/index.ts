import { Router } from 'express';
import { profilesRoutes, addressesRoutes, wishlistsRoutes, reviewsRoutes } from '../modules';

const router = Router();

router.use('/profiles', profilesRoutes);
router.use('/addresses', addressesRoutes);
router.use('/wishlists', wishlistsRoutes);
router.use('/reviews', reviewsRoutes);

export default router;
