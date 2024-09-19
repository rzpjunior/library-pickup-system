import { v4 as uuidv4 } from 'uuid';
import { Appointment } from '../models/appointment';
import { bookService } from './bookService';
import { logger } from '../utils/logger';

class AppointmentService {
  private appointments: Map<string, Appointment> = new Map();

  createAppointment(bookId: string, userId: string, pickupTime: Date): Appointment {
    const book = bookService.getBookById(bookId);
    if (!book) {
      throw new Error('Book not found');
    }
    if (book.availableCopies <= 0) {
      throw new Error('No available copies');
    }

    const appointment: Appointment = {
      id: uuidv4(),
      bookId,
      userId,
      pickupTime,
      status: 'active'
    };

    this.appointments.set(appointment.id, appointment);
    bookService.updateBookAvailability(bookId, book.availableCopies - 1);

    logger.info(`Created appointment: ${appointment.id}`);
    return appointment;
  }

  getAppointmentsByUser(userId: string): Appointment[] {
    return Array.from(this.appointments.values()).filter(app => app.userId === userId);
  }

  cancelAppointment(appointmentId: string): void {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    appointment.status = 'cancelled';
    this.appointments.set(appointmentId, appointment);

    const book = bookService.getBookById(appointment.bookId);
    if (book) {
      bookService.updateBookAvailability(appointment.bookId, book.availableCopies + 1);
    }

    logger.info(`Cancelled appointment: ${appointmentId}`);
  }
}

export const appointmentService = new AppointmentService();