import { Router } from 'express';
import { searchController } from './search.controller';
import { optionalAuth, authenticate } from '../../middleware';
import { validate, validateQuery } from '../../utils/validate';
import { searchQuerySchema, suggestionsQuerySchema, trendingQuerySchema, clickBodySchema } from './search.validator';

const router = Router();

router.get('/products', optionalAuth, validateQuery(searchQuerySchema), searchController.search);

router.get('/suggestions', validateQuery(suggestionsQuerySchema), searchController.getSuggestions);

router.get('/trending', validateQuery(trendingQuerySchema), searchController.getTrending);

router.post('/click', authenticate, validate(clickBodySchema), searchController.logClick);

export default router;
