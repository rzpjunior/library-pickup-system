import { AppointmentService } from '../services/appointmentService';
import { bookService } from '../services/bookService';
import { CustomError } from '../utils/customError';
import { CreateAppointmentDto, AppointmentResponseDto } from '../dtos/appointmentDtos';
import { Appointment } from '../models/appointment';
import { Book } from '../models/book';
import { StatusCodes } from 'http-status-codes';

jest.mock('../services/bookService');
jest.mock('../utils/logger');

describe('AppointmentService', () => {
  let service: AppointmentService;
  let mockBook: Book;

  beforeEach(() => {
    service = new AppointmentService();
    jest.clearAllMocks();

    mockBook = {
      id: 'book1',
      title: 'Test Book',
      author: 'Test Author',
      availableCopies: 1,
      editionNumber: 1,
      genre: 'Test Genre'
    };

    (bookService.getBookById as jest.Mock).mockResolvedValue(mockBook);
    (bookService.updateBookAvailability as jest.Mock).mockResolvedValue(undefined);
  });

  describe('createAppointment', () => {
    it('should create a pending appointment', async () => {
      const appointmentDto: CreateAppointmentDto = {
        bookId: 'book1',
        userId: 'user1',
        pickupTime: '2023-09-25T14:00:00Z',
      };

      const result = await service.createAppointment(appointmentDto);

      expect(result.status).toBe('pending');
      expect(result.bookId).toBe('book1');
      expect(result.userId).toBe('user1');
      expect(result.approvedAt).toBe('');
      expect(new Date(result.pickupTime)).toEqual(new Date(appointmentDto.pickupTime));
      expect(result.book).toEqual(mockBook);
    });

    it('should throw an error if user has 2 active appointments for the same book', async () => {
      const appointmentDto: CreateAppointmentDto = {
        bookId: 'book1',
        userId: 'user1',
        pickupTime: '2023-09-25T14:00:00Z',
      };

      await service.createAppointment(appointmentDto);
      await service.createAppointment(appointmentDto);

      await expect(service.createAppointment(appointmentDto)).rejects.toThrow(
        new CustomError(StatusCodes.BAD_REQUEST, 'You have reached the maximum number of appointments for this book')
      );
    });

    it('should throw an error if the book is not available', async () => {
      (bookService.getBookById as jest.Mock).mockResolvedValue({ ...mockBook, availableCopies: 0 });

      const appointmentDto: CreateAppointmentDto = {
        bookId: 'book1',
        userId: 'user1',
        pickupTime: '2023-09-25T14:00:00Z',
      };

      await expect(service.createAppointment(appointmentDto)).rejects.toThrow(
        new CustomError(StatusCodes.BAD_REQUEST, 'The book is not available for appointment')
      );
    });
  });

  describe('approveAppointment', () => {
    it('should approve a pending appointment', async () => {
      const appointmentDto: CreateAppointmentDto = {
        bookId: 'book1',
        userId: 'user1',
        pickupTime: '2023-09-25T14:00:00Z',
      };

      const createdAppointment = await service.createAppointment(appointmentDto);
      const result = await service.approveAppointment(createdAppointment.id, { isApproved: true });

      expect(result.status).toBe('approved');
      expect(result.approvedAt).not.toBe('');
      expect(bookService.updateBookAvailability).toHaveBeenCalledWith('book1', 0);
    });

    it('should reject a pending appointment', async () => {
      const appointmentDto: CreateAppointmentDto = {
        bookId: 'book1',
        userId: 'user1',
        pickupTime: '2023-09-25T14:00:00Z',
      };

      const createdAppointment = await service.createAppointment(appointmentDto);
      const result = await service.approveAppointment(createdAppointment.id, { isApproved: false });

      expect(result.status).toBe('rejected');
      expect(result.rejectedAt).not.toBe('');
      expect(bookService.updateBookAvailability).not.toHaveBeenCalled();
    });

    it('should throw an error if the appointment is not found', async () => {
      await expect(service.approveAppointment('nonexistent', { isApproved: true })).rejects.toThrow(
        new CustomError(StatusCodes.NOT_FOUND, 'Appointment not found')
      );
    });

    it('should throw an error if isApproved is not a boolean', async () => {
      const appointmentDto: CreateAppointmentDto = {
        bookId: 'book1',
        userId: 'user1',
        pickupTime: '2023-09-25T14:00:00Z',
      };

      const createdAppointment = await service.createAppointment(appointmentDto);
      
      await expect(service.approveAppointment(createdAppointment.id, { isApproved: 'true' as any })).rejects.toThrow(
        new CustomError(StatusCodes.BAD_REQUEST, 'isApproved must be a boolean')
      );
    });
  });

  describe('cancelAppointment', () => {
    it('should cancel an approved appointment', async () => {
      const appointmentDto: CreateAppointmentDto = {
        bookId: 'book1',
        userId: 'user1',
        pickupTime: '2023-09-25T14:00:00Z',
      };

      const createdAppointment = await service.createAppointment(appointmentDto);
      await service.approveAppointment(createdAppointment.id, { isApproved: true });
      const result = await service.cancelAppointment(createdAppointment.id);

      expect(result.status).toBe('cancelled');
      expect(bookService.updateBookAvailability).toHaveBeenCalledWith('book1', 2);
    });

    it('should cancel a pending appointment without updating book availability', async () => {
      const appointmentDto: CreateAppointmentDto = {
        bookId: 'book1',
        userId: 'user1',
        pickupTime: '2023-09-25T14:00:00Z',
      };

      const createdAppointment = await service.createAppointment(appointmentDto);
      const result = await service.cancelAppointment(createdAppointment.id);

      expect(result.status).toBe('cancelled');
      expect(bookService.updateBookAvailability).not.toHaveBeenCalled();
    });

    it('should throw an error if the appointment is not found', async () => {
      await expect(service.cancelAppointment('nonexistent')).rejects.toThrow(
        new CustomError(StatusCodes.NOT_FOUND, 'Appointment not found')
      );
    });

    it('should throw an error if the appointment is already cancelled', async () => {
      const appointmentDto: CreateAppointmentDto = {
        bookId: 'book1',
        userId: 'user1',
        pickupTime: '2023-09-25T14:00:00Z',
      };

      const createdAppointment = await service.createAppointment(appointmentDto);
      await service.cancelAppointment(createdAppointment.id);

      await expect(service.cancelAppointment(createdAppointment.id)).rejects.toThrow(
        new CustomError(StatusCodes.BAD_REQUEST, 'Appointment is already cancelled')
      );
    });
  });

  describe('getAppointmentsByBookId', () => {
    it('should return appointments for a specific book', async () => {
      const appointmentDto1: CreateAppointmentDto = {
        bookId: 'book1',
        userId: 'user1',
        pickupTime: '2023-09-25T14:00:00Z',
      };

      const appointmentDto2: CreateAppointmentDto = {
        bookId: 'book1',
        userId: 'user2',
        pickupTime: '2023-09-26T14:00:00Z',
      };

      await service.createAppointment(appointmentDto1);
      await service.createAppointment(appointmentDto2);

      const result = await service.getAppointmentsByBookId('book1');

      expect(result.id).toBe('book1');
      expect(result.appointments.length).toBe(2);
      expect(result.appointments[0].userId).toBe('user1');
      expect(result.appointments[1].userId).toBe('user2');
    });

    it('should throw an error if the book is not found', async () => {
      (bookService.getBookById as jest.Mock).mockRejectedValue(new CustomError(StatusCodes.NOT_FOUND, 'Book not found'));

      await expect(service.getAppointmentsByBookId('nonexistent')).rejects.toThrow(
        new CustomError(StatusCodes.NOT_FOUND, 'Book not found')
      );
    });
  });

  describe('getUserAppointments', () => {
    it('should return appointments for a specific user', async () => {
      const appointmentDto1: CreateAppointmentDto = {
        bookId: 'book1',
        userId: 'user1',
        pickupTime: '2023-09-25T14:00:00Z',
      };

      const appointmentDto2: CreateAppointmentDto = {
        bookId: 'book2',
        userId: 'user1',
        pickupTime: '2023-09-26T14:00:00Z',
      };

      await service.createAppointment(appointmentDto1);
      await service.createAppointment(appointmentDto2);

      const result = await service.getUserAppointments('user1');

      expect(result.userId).toBe('user1');
      expect(result.appointments.length).toBe(2);
      expect(result.appointments[0].book).toEqual(mockBook);
      expect(result.appointments[1].book).toEqual(mockBook);
    });

    it('should return an empty array if the user has no appointments', async () => {
      const result = await service.getUserAppointments('user2');

      expect(result.userId).toBe('user2');
      expect(result.appointments.length).toBe(0);
    });
  });

  describe('getAllAppointments', () => {
    it('should return all appointments', async () => {
      const appointmentDto1: CreateAppointmentDto = {
        bookId: 'book1',
        userId: 'user1',
        pickupTime: '2023-09-25T14:00:00Z',
      };

      const appointmentDto2: CreateAppointmentDto = {
        bookId: 'book2',
        userId: 'user2',
        pickupTime: '2023-09-26T14:00:00Z',
      };

      await service.createAppointment(appointmentDto1);
      await service.createAppointment(appointmentDto2);

      const result = await service.getAllAppointments();

      expect(result.length).toBe(2);
      expect(result[0].userId).toBe('user1');
      expect(result[1].userId).toBe('user2');
      expect(result[0].book).toEqual(mockBook);
      expect(result[1].book).toEqual(mockBook);
    });

    it('should return an empty array if there are no appointments', async () => {
      const result = await service.getAllAppointments();

      expect(result.length).toBe(0);
    });
  });

  describe('getAppointmentById', () => {
    it('should return an appointment by id', async () => {
      const appointmentDto: CreateAppointmentDto = {
        bookId: 'book1',
        userId: 'user1',
        pickupTime: '2023-09-25T14:00:00Z',
      };

      const createdAppointment = await service.createAppointment(appointmentDto);
      const result = await service.getAppointmentById(createdAppointment.id);

      expect(result.id).toBe(createdAppointment.id);
      expect(result.userId).toBe('user1');
      expect(result.bookId).toBe('book1');
      expect(result.book).toEqual(mockBook);
    });

    it('should throw an error if the appointment is not found', async () => {
      await expect(service.getAppointmentById('nonexistent')).rejects.toThrow(
        new CustomError(StatusCodes.NOT_FOUND, 'Appointment not found')
      );
    });
  });
});