import express from 'express';
const rootRoute = express();

/*
 * import routes
 */
import lotteryRoutes from './lottery.router.mjs';
import adminRoutes from './admin.router.mjs';

/*
 * use routes
 */
rootRoute.use('/lottery', lotteryRoutes);
rootRoute.use('/admin', adminRoutes);

export default rootRoute;
