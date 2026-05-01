import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import clientRoutes from './routes/clients';
import moduleRoutes from './routes/modules';
import offerRoutes from './routes/offers';
import invoiceRoutes from './routes/invoices';
import partnerRoutes from './routes/partners';
import expenseRoutes from './routes/expenses';
import projectRoutes from './routes/projects';
import settingsRoutes from './routes/settings';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'alwazzanos-oim-backend', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/settings', settingsRoutes);

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`[backend] running on http://localhost:${PORT}`);
});
