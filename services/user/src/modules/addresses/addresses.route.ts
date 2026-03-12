import { Router } from 'express';
import { addressesController } from './addresses.controller';
import { authenticate } from '../../middleware';
import { validate, validateParams } from '../../utils/validate';
import { createAddressSchema, updateAddressSchema, addressIdSchema } from './addresses.validator';

const router = Router();

router.get('/', authenticate, addressesController.getAddresses);

router.get('/:id', authenticate, validateParams(addressIdSchema), addressesController.getAddressById);

router.post('/', authenticate, validate(createAddressSchema), addressesController.createAddress);

router.put('/:id', authenticate, validateParams(addressIdSchema), validate(updateAddressSchema), addressesController.updateAddress);

router.delete('/:id', authenticate, validateParams(addressIdSchema), addressesController.deleteAddress);

router.post('/:id/default', authenticate, validateParams(addressIdSchema), addressesController.setDefaultAddress);

export default router;
