import { v4 as uuidv4 } from 'uuid';
import { StatusCodes } from 'http-status-codes';
import { Appointment } from '../models/appointment';
import { bookService } from './bookService';
import { logger } from '../utils/logger';
import { CreateAppointmentDto, AppointmentResponseDto } from '../dtos/appointmentDtos';
import { BookWithAppointments, UserWithAppointments } from '../types/appointmentInterfaces';
import { CustomError } from '../utils/customError';

export class AppointmentService {
  private appointments: Map<string, Appointment> = new Map();

  private mapAppointmentToDto(appointment: Appointment): AppointmentResponseDto {
    return {
      id: appointment.id,
      bookId: appointment.bookId,
      userId: appointment.userId,
      pickupTime: appointment.pickupTime,
      createdAt: appointment.createdAt,
      status: appointment.status,
      approvedAt: appointment.approvedAt,
      rejectedAt: appointment.rejectedAt
    };
  }

  private getUserActiveAppointmentsForBook(userId: string, bookId: string): Appointment[] {
    return Array.from(this.appointments.values()).filter(
      app => app.userId === userId && app.bookId === bookId && (app.status === 'pending' || app.status === 'approved')
    );
  }

  createAppointment(appointmentDto: CreateAppointmentDto): AppointmentResponseDto {
    const book = bookService.getBookById(appointmentDto.bookId);
    if (!book) {
      throw new CustomError(StatusCodes.NOT_FOUND, 'Book not found');
    }
    if (book.availableCopies <= 0) {
      throw new CustomError(StatusCodes.BAD_REQUEST, 'No available copies');
    }

    const userBookAppointments = this.getUserActiveAppointmentsForBook(appointmentDto.userId, appointmentDto.bookId);
    if (userBookAppointments.length >= 2) {
      throw new CustomError(StatusCodes.BAD_REQUEST, 'You have reached the maximum number of appointments for this book');
    }

    const appointment: Appointment = {
      id: uuidv4(),
      bookId: appointmentDto.bookId,
      userId: appointmentDto.userId,
      pickupTime: new Date(appointmentDto.pickupTime),
      createdAt: new Date(),
      status: 'pending',
      approvedAt: '',
      rejectedAt: '',
    };

    this.appointments.set(appointment.id, appointment);
    logger.info(`Created appointment: ${appointment.id}`);
    return this.mapAppointmentToDto(appointment);
  }

  approveAppointment(appointmentId: string, isApproved: boolean): AppointmentResponseDto {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) {
      throw new CustomError(StatusCodes.NOT_FOUND, 'Appointment not found');
    }

    if (appointment.status !== 'pending') {
      throw new CustomError(StatusCodes.BAD_REQUEST, 'Appointment is not in pending status');
    }

    if (isApproved) {
      appointment.status = 'approved';
      appointment.approvedAt = new Date().toISOString();
      const book = bookService.getBookById(appointment.bookId);
      if (book) {
        bookService.updateBookAvailability(appointment.bookId, book.availableCopies - 1);
      }
      logger.info(`Approved appointment: ${appointmentId}`);
    } else {
      appointment.status = 'rejected';
      appointment.rejectedAt = new Date().toISOString();
      logger.info(`Rejected appointment: ${appointmentId}`);
    }

    this.appointments.set(appointmentId, appointment);
    return this.mapAppointmentToDto(appointment);
  }

  cancelAppointment(appointmentId: string): AppointmentResponseDto {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) {
      throw new CustomError(StatusCodes.NOT_FOUND, 'Appointment not found');
    }

    if (appointment.status === 'cancelled') {
      throw new CustomError(StatusCodes.BAD_REQUEST, 'Appointment is already cancelled');
    }

    const previousStatus = appointment.status;
    appointment.status = 'cancelled';
    this.appointments.set(appointmentId, appointment);

    if (previousStatus === 'approved') {
      const book = bookService.getBookById(appointment.bookId);
      if (book) {
        bookService.updateBookAvailability(appointment.bookId, book.availableCopies + 1);
      }
    }

    logger.info(`Cancelled appointment: ${appointmentId}`);
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
          createdAt: appointment.createdAt,
          status: appointment.status,
          approvedAt: appointment.approvedAt,
          rejectedAt: appointment.rejectedAt
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
      if (appointment.userId === userId) {
        const book = bookService.getBookById(appointment.bookId);
        if (book) {
          userAppointments.appointments.push({
            book,
            appointmentId: appointment.id,
            pickupTime: appointment.pickupTime,
            createdAt: appointment.createdAt,
            status: appointment.status,
            approvedAt: appointment.approvedAt,
            rejectedAt: appointment.rejectedAt
          });
        }
      }
    });

    return userAppointments;
  }

  getAllAppointments(): AppointmentResponseDto[] {
    return Array.from(this.appointments.values()).map(appointment => {
      const book = bookService.getBookById(appointment.bookId);
      return {
        ...this.mapAppointmentToDto(appointment),
        book: book || null
      };
    });
  }


  getAppointmentById(appointmentId: string): Appointment | undefined {
    return this.appointments.get(appointmentId);
  }
}

export const appointmentService = new AppointmentService();