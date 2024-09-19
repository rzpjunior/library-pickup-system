export interface Appointment {
  id: string;
  bookId: string;
  userId: string;
  pickupTime: Date;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  approvedAt: string;
  rejectedAt: string;
}