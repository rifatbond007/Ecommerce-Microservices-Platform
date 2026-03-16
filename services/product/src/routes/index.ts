import { Router } from 'express';
import productsRoutes from '../modules/products/products.route';
import categoriesRoutes from '../modules/categories/categories.route';
import brandsRoutes from '../modules/brands/brands.route';
import variantsRoutes from '../modules/variants/variants.route';
import inventoryRoutes from '../modules/inventory/inventory.route';

export {
  productsRoutes,
  categoriesRoutes,
  brandsRoutes,
  variantsRoutes,
  inventoryRoutes,
};

const router = Router();

router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/brands', brandsRoutes);
router.use('/variants', variantsRoutes);
router.use('/inventory', inventoryRoutes);

export default router;
