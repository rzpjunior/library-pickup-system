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
    status: 'active' | 'cancelled' | 'completed';
  }
  