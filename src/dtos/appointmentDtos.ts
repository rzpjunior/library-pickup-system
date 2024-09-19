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
    status: 'pending' | 'approved' | 'cancelled' | 'completed';
    approvedAt: string;
  }
  