import express from 'express';
import {findNearbyVendors, stallDetails} from '../controllers/vendor.controller.js'
import { UserAuthMiddleware } from '../middlewares/auth.middleware.js';
const vendorRouter= express.Router();

vendorRouter.post('/detailsOfStall',UserAuthMiddleware,stallDetails);
vendorRouter.post('/nearby-vendors', findNearbyVendors);

export default vendorRouter;