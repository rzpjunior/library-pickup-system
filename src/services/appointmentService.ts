import { v4 as uuidv4 } from 'uuid';
import { StatusCodes } from 'http-status-codes';
import { Appointment } from '../models/appointment';
import { bookService } from './bookService';
import { logger } from '../utils/logger';
import { CreateAppointmentDto, AppointmentResponseDto } from '../dtos/appointmentDtos';
import { BookWithAppointments, UserWithAppointments } from '../types/appointmentInterfaces';
import { CustomError } from '../utils/customError';

class AppointmentService {
  private appointments: Map<string, Appointment> = new Map();

  private mapAppointmentToDto(appointment: Appointment): AppointmentResponseDto {
    return {
      id: appointment.id,
      bookId: appointment.bookId,
      userId: appointment.userId,
      pickupTime: appointment.pickupTime,
      status: appointment.status
    };
  }

  createAppointment(appointmentDto: CreateAppointmentDto): AppointmentResponseDto {
    const book = bookService.getBookById(appointmentDto.bookId);
    if (!book) {
      throw new Error('Book not found');
    }
    if (book.availableCopies <= 0) {
      throw new Error('No available copies');
    }

    const appointment: Appointment = {
      id: uuidv4(),
      bookId: appointmentDto.bookId,
      userId: appointmentDto.userId,
      pickupTime: new Date(appointmentDto.pickupTime),
      status: 'active'
    };

    this.appointments.set(appointment.id, appointment);
    bookService.updateBookAvailability(appointmentDto.bookId, book.availableCopies - 1);

    logger.info(`Created appointment: ${appointment.id}`);
    return this.mapAppointmentToDto(appointment);
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

  cancelAppointment(appointmentId: string): AppointmentResponseDto {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) {
      throw new CustomError(StatusCodes.NOT_FOUND, 'Appointment not found');
    }

    if (appointment.status === 'cancelled') {
      throw new CustomError(StatusCodes.BAD_REQUEST, 'Appointment is already cancelled');
    }

    appointment.status = 'cancelled';
    this.appointments.set(appointmentId, appointment);

    const book = bookService.getBookById(appointment.bookId);
    if (book) {
      bookService.updateBookAvailability(appointment.bookId, book.availableCopies + 1);
    }

    logger.info(`Cancelled appointment: ${appointmentId}`);
    return this.mapAppointmentToDto(appointment);
  }

  getAppointmentById(appointmentId: string): Appointment | undefined {
    return this.appointments.get(appointmentId);
  }
}

export const appointmentService = new AppointmentService();