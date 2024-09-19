export interface Appointment {
    id: string;
    bookId: string;
    userId: string;
    pickupTime: Date;
    status: 'active' | 'completed' | 'cancelled';
  }