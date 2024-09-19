import { Book } from '../models/book';

export interface AppointmentDetails {
    appointmentId: string;
    pickupTime: Date;
    createdAt: Date;
    status: 'pending' | 'approved' | 'cancelled' | 'completed';
    approvedAt?: Date;
  }
  
  export interface BookWithAppointments extends Book {
    appointments: (AppointmentDetails & { userId: string })[];
  }
  
  export interface UserWithAppointments {
    userId: string;
    appointments: (AppointmentDetails & { book: Book })[];
  }