import express from 'express';
import dotenv from 'dotenv';
import bookRoutes from './routes/bookRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import { errorHandler } from './utils/errorHandler';
import { bookService } from './services/bookService';

dotenv.config();

const app = express();

app.use(express.json());

bookService.fetchBooks().catch(console.error);

app.use('/v1/books', bookRoutes);
app.use('/v1/appointments', appointmentRoutes);

app.use(errorHandler);

export default app;