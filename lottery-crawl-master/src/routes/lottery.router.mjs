import { Router } from 'express';
const lotteryRoutes = new Router();

/*
 * controller
 */
import lotteryController from '../controllers/lottery.controller.mjs';
import { advanced, byDate, frequency, gaps, homepageForecasts, homepageStatistics, latest, numberQuery, overview, strategies, tripleReport, vipStrategies } from '../controllers/dashboard.controller.mjs';
import { crawlToday } from '../controllers/crawl.controller.mjs';
import { activePlans, authenticate, getMemberAccount, loginMember, paymentMethods, registerMember, requestPlan, submitPaymentRequest, updateMemberEmail, updateMemberPassword, vipHistory, vipTrialResults } from '../controllers/membership.controller.mjs';

/*
 * define route
 */
lotteryRoutes.get('/get/by_date', lotteryController.getByDate);
lotteryRoutes.get('/dashboard', overview);
lotteryRoutes.get('/draws/latest', latest);
lotteryRoutes.get('/draws/:date', byDate);
lotteryRoutes.get('/statistics/frequency', frequency);
lotteryRoutes.get('/data-gaps', gaps);
lotteryRoutes.get('/statistics/advanced', advanced);
lotteryRoutes.get('/statistics/numbers', numberQuery);
lotteryRoutes.get('/statistics/triple-report', tripleReport);
lotteryRoutes.get('/statistics/strategies', strategies);
lotteryRoutes.get('/statistics/vip-strategies', vipStrategies);
lotteryRoutes.get('/homepage-forecasts', homepageForecasts);
lotteryRoutes.get('/homepage-statistics', homepageStatistics);
lotteryRoutes.get('/membership-plans', activePlans);
lotteryRoutes.get('/payment-methods', paymentMethods);
lotteryRoutes.post('/member/register', registerMember);
lotteryRoutes.post('/member/login', loginMember);
lotteryRoutes.get('/member/account', authenticate, getMemberAccount);
lotteryRoutes.put('/member/email', authenticate, updateMemberEmail);
lotteryRoutes.put('/member/password', authenticate, updateMemberPassword);
lotteryRoutes.post('/member/plan-request', authenticate, requestPlan);
lotteryRoutes.post('/member/payment-requests/:id/submit', authenticate, submitPaymentRequest);
lotteryRoutes.get('/member/vip-trial-results', authenticate, vipTrialResults);
lotteryRoutes.get('/member/vip-history', authenticate, vipHistory);
lotteryRoutes.post('/crawl', crawlToday);

export default lotteryRoutes;
