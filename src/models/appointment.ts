export interface Appointment {
  id: string;
  bookId: string;
  userId: string;
  pickupTime: Date;
  createdAt: Date;
  status: 'pending' | 'approved' | 'cancelled' | 'completed';
  approvedAt: string;
}