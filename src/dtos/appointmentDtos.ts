import { Book } from '../models/book';

export interface CreateAppointmentDto {
  bookId: string;
  userId: string;
  pickupTime: string;
}

export interface AppointmentResponseDto {
  id: string;
  bookId: string;
  userId: string;
  pickupTime: Date;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  approvedAt: string;
  rejectedAt: string;
  book?: Book | null;
}