import { v4 as uuidv4 } from 'uuid';
import { Appointment } from '../models/appointment';
import { Book } from '../models/book';
import { bookService } from './bookService';
import { logger } from '../utils/logger';

interface BookWithAppointments extends Book {
  appointments: {
    userId: string;
    appointmentId: string;
    pickupTime: Date;
    status: 'active' | 'cancelled' | 'completed';
  }[];
}

interface UserWithAppointments {
  userId: string;
  appointments: {
    book: Book;
    appointmentId: string;
    pickupTime: Date;
    status: 'active' | 'cancelled' | 'completed';
  }[];
}

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

  getAppointmentsByBookId(bookId: string): BookWithAppointments | null {
    const book = bookService.getBookById(bookId);
    if (!book) return null;

    const bookAppointments: BookWithAppointments = {
      ...book,
      appointments: []
    };

    this.appointments.forEach(appointment => {
      if (appointment.bookId === bookId) {
        bookAppointments.appointments.push({
          userId: appointment.userId,
          appointmentId: appointment.id,
          pickupTime: appointment.pickupTime,
          status: appointment.status
        });
      }
    });

    return bookAppointments;
  }

  getUserAppointments(userId: string): UserWithAppointments {
    const userAppointments: UserWithAppointments = {
      userId,
      appointments: []
    };

    this.appointments.forEach(appointment => {
      const book = bookService.getBookById(appointment.bookId);
      if (book && appointment.userId === userId) {
        userAppointments.appointments.push({
          book,
          appointmentId: appointment.id,
          pickupTime: appointment.pickupTime,
          status: appointment.status
        });
      }
    });

    return userAppointments;
  }

  getAllAppointments(): Appointment[] {
    return Array.from(this.appointments.values());
  }

  cancelAppointment(appointmentId: string): Appointment {
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
    return appointment;
  }

  getAppointmentById(appointmentId: string): Appointment | undefined {
    return this.appointments.get(appointmentId);
  }
}

export const appointmentService = new AppointmentService();