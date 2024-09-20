import { v4 as uuidv4 } from 'uuid';
import { StatusCodes } from 'http-status-codes';
import { Appointment } from '../models/appointment';
import { bookService } from './bookService';
import { logger } from '../utils/logger';
import { CreateAppointmentDto, AppointmentResponseDto } from '../dtos/appointmentDtos';
import { BookWithAppointments, UserWithAppointments } from '../types/appointmentInterfaces';
import { CustomError } from '../utils/customError';
import { Book } from '../models/book';

export class AppointmentService {
  private appointments: Map<string, Appointment> = new Map();

  private mapAppointmentToDto(appointment: Appointment, book?: Book | null): AppointmentResponseDto {
    return {
      id: appointment.id,
      bookId: appointment.bookId,
      userId: appointment.userId,
      pickupTime: appointment.pickupTime,
      createdAt: appointment.createdAt,
      status: appointment.status,
      approvedAt: appointment.approvedAt,
      rejectedAt: appointment.rejectedAt,
      book: book || undefined
    };
  }

  private getUserActiveAppointmentsForBook(userId: string, bookId: string): Appointment[] {
    return Array.from(this.appointments.values()).filter(
      app => app.userId === userId && app.bookId === bookId && (app.status === 'pending' || app.status === 'approved')
    );
  }

  async createAppointment(appointmentDto: CreateAppointmentDto): Promise<AppointmentResponseDto> {
    try {
      const book = await bookService.getBookById(appointmentDto.bookId);
      if (book.availableCopies <= 0) {
        throw new CustomError(StatusCodes.BAD_REQUEST, 'The book is not available for appointment');
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
      return this.mapAppointmentToDto(appointment, book);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create appointment');
    }
  }

  async approveAppointment(appointmentId: string, approvalData: { isApproved?: boolean }): Promise<AppointmentResponseDto> {
    if (typeof approvalData.isApproved !== 'boolean') {
      throw new CustomError(StatusCodes.BAD_REQUEST, 'isApproved must be a boolean');
    }

    const appointment = this.appointments.get(appointmentId);
    if (!appointment) {
      throw new CustomError(StatusCodes.NOT_FOUND, 'Appointment not found');
    }

    if (appointment.status !== 'pending') {
      throw new CustomError(StatusCodes.BAD_REQUEST, 'Appointment is not in pending status');
    }

    try {
      const book = await bookService.getBookById(appointment.bookId);
      
      if (approvalData.isApproved) {
        appointment.status = 'approved';
        appointment.approvedAt = new Date().toISOString();
        await bookService.updateBookAvailability(appointment.bookId, book.availableCopies - 1);
        logger.info(`Approved appointment: ${appointmentId}`);
      } else {
        appointment.status = 'rejected';
        appointment.rejectedAt = new Date().toISOString();
        logger.info(`Rejected appointment: ${appointmentId}`);
      }

      this.appointments.set(appointmentId, appointment);
      return this.mapAppointmentToDto(appointment, book);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to approve/reject appointment');
    }
  }

  async cancelAppointment(appointmentId: string): Promise<AppointmentResponseDto> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) {
      throw new CustomError(StatusCodes.NOT_FOUND, 'Appointment not found');
    }

    if (appointment.status === 'cancelled') {
      throw new CustomError(StatusCodes.BAD_REQUEST, 'Appointment is already cancelled');
    }

    try {
      const previousStatus = appointment.status;
      appointment.status = 'cancelled';
      this.appointments.set(appointmentId, appointment);

      let book: Book | null = null;
      if (previousStatus === 'approved') {
        book = await bookService.getBookById(appointment.bookId);
        await bookService.updateBookAvailability(appointment.bookId, book.availableCopies + 1);
      }

      logger.info(`Cancelled appointment: ${appointmentId}`);
      return this.mapAppointmentToDto(appointment, book);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to cancel appointment');
    }
  }

  async getAppointmentsByBookId(bookId: string): Promise<BookWithAppointments> {
    try {
      const book = await bookService.getBookById(bookId);
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
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get appointments for book');
    }
  }

  async getUserAppointments(userId: string): Promise<UserWithAppointments> {
    const userAppointments: UserWithAppointments = {
      userId,
      appointments: []
    };

    for (const appointment of this.appointments.values()) {
      if (appointment.userId === userId) {
        try {
          const book = await bookService.getBookById(appointment.bookId);
          userAppointments.appointments.push({
            book,
            appointmentId: appointment.id,
            pickupTime: appointment.pickupTime,
            createdAt: appointment.createdAt,
            status: appointment.status,
            approvedAt: appointment.approvedAt,
            rejectedAt: appointment.rejectedAt
          });
        } catch (error) {
          logger.error(`Failed to get book for appointment ${appointment.id}`, error);
        }
      }
    }

    return userAppointments;
  }

  async getAllAppointments(): Promise<AppointmentResponseDto[]> {
    const allAppointments: AppointmentResponseDto[] = [];

    for (const appointment of this.appointments.values()) {
      try {
        const book = await bookService.getBookById(appointment.bookId);
        allAppointments.push(this.mapAppointmentToDto(appointment, book));
      } catch (error) {
        logger.error(`Failed to get book for appointment ${appointment.id}`, error);
        allAppointments.push(this.mapAppointmentToDto(appointment, null));
      }
    }

    return allAppointments;
  }

  async getAppointmentById(appointmentId: string): Promise<AppointmentResponseDto> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) {
      throw new CustomError(StatusCodes.NOT_FOUND, 'Appointment not found');
    }
    try {
      const book = await bookService.getBookById(appointment.bookId);
      return this.mapAppointmentToDto(appointment, book);
    } catch (error) {
      logger.error(`Failed to get book for appointment ${appointmentId}`, error);
      return this.mapAppointmentToDto(appointment, null);
    }
  }
}

export const appointmentService = new AppointmentService();