import { Router } from 'express';
import { apiStatus, createPlan, createUser, deleteUser, getBalancedDistinctResearchJob, getResearchBacktest, listNotifications, listPlans, listResults, listUsers, listVipResults, login, overview, paymentSettings, refreshReferenceResearchBacktest, refreshResearchBacktest, requireAdmin, runBalancedDistinctResearch, updateApiSetting, updatePaymentRequest, updatePaymentSettings, updatePlan, updateTelegram, updateUser } from '../controllers/admin.controller.mjs';

const adminRoutes = Router();

adminRoutes.post('/login', login);
adminRoutes.use(requireAdmin);
adminRoutes.get('/overview', overview);
adminRoutes.get('/api-status', apiStatus);
adminRoutes.put('/settings/:key', updateApiSetting);
adminRoutes.get('/payments', paymentSettings);
adminRoutes.put('/payments', updatePaymentSettings);
adminRoutes.get('/notifications', listNotifications);
adminRoutes.put('/notifications/telegram', updateTelegram);
adminRoutes.patch('/payment-requests/:id', updatePaymentRequest);
adminRoutes.get('/users', listUsers);
adminRoutes.post('/users', createUser);
adminRoutes.patch('/users/:id', updateUser);
adminRoutes.delete('/users/:id', deleteUser);
adminRoutes.get('/plans', listPlans);
adminRoutes.post('/plans', createPlan);
adminRoutes.patch('/plans/:id', updatePlan);
adminRoutes.get('/results', listResults);
adminRoutes.get('/vip-results', listVipResults);
adminRoutes.get('/research-backtest', getResearchBacktest);
adminRoutes.post('/research-backtest/refresh', refreshResearchBacktest);
adminRoutes.post('/research-backtest/reference/refresh', refreshReferenceResearchBacktest);
adminRoutes.post('/research-backtest/balanced-distinct/run', runBalancedDistinctResearch);
adminRoutes.get('/research-backtest/balanced-distinct/jobs/:id', getBalancedDistinctResearchJob);

export default adminRoutes;
