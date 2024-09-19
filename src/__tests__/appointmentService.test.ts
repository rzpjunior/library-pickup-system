import { AppointmentService } from '../services/appointmentService';
import { bookService } from '../services/bookService';
import { CustomError } from '../utils/customError';
import { CreateAppointmentDto } from '../dtos/appointmentDtos';
import { Appointment } from '../models/appointment';

jest.mock('../services/bookService');

describe('AppointmentService', () => {
  let service: AppointmentService;

  beforeEach(() => {
    service = new AppointmentService();
    jest.clearAllMocks();
  });

  describe('createAppointment', () => {
    it('should create a pending appointment', () => {
      const mockBook = { id: 'book1', availableCopies: 1 };
      (bookService.getBookById as jest.Mock).mockReturnValue(mockBook);
  
      const appointmentDto: CreateAppointmentDto = {
        bookId: 'book1',
        userId: 'user1',
        pickupTime: '2023-09-25T14:00:00Z',
      };
  
      const result = service.createAppointment(appointmentDto);
  
      expect(result.status).toBe('pending');
      expect(result.bookId).toBe('book1');
      expect(result.userId).toBe('user1');
      expect(result.approvedAt).toBe('');
      expect(new Date(result.pickupTime)).toEqual(new Date(appointmentDto.pickupTime));
    });

    it('should throw an error if user has 2 active appointments for the same book', () => {
      const mockBook = { id: 'book1', availableCopies: 5 };
      (bookService.getBookById as jest.Mock).mockReturnValue(mockBook);

      service['appointments'].set('appointment1', {
        id: 'appointment1',
        bookId: 'book1',
        userId: 'user1',
        status: 'approved',
        pickupTime: new Date(),
        createdAt: new Date(),
        approvedAt: new Date().toISOString(),
      });
      service['appointments'].set('appointment2', {
        id: 'appointment2',
        bookId: 'book1',
        userId: 'user1',
        status: 'pending',
        pickupTime: new Date(),
        createdAt: new Date(),
        approvedAt: '',
      });

      const appointmentDto: CreateAppointmentDto = {
        bookId: 'book1',
        userId: 'user1',
        pickupTime: '2023-09-25T14:00:00Z',
      };

      expect(() => service.createAppointment(appointmentDto)).toThrow('You have reached the maximum number of appointments for this book');
    });

    it('should throw an error if the book is not found', () => {
      (bookService.getBookById as jest.Mock).mockReturnValue(null);

      const appointmentDto: CreateAppointmentDto = {
        bookId: 'nonexistent',
        userId: 'user1',
        pickupTime: '2023-09-25T14:00:00Z',
      };

      expect(() => service.createAppointment(appointmentDto)).toThrow('Book not found');
    });

    it('should throw an error if no copies are available', () => {
      const mockBook = { id: 'book1', availableCopies: 0 };
      (bookService.getBookById as jest.Mock).mockReturnValue(mockBook);

      const appointmentDto: CreateAppointmentDto = {
        bookId: 'book1',
        userId: 'user1',
        pickupTime: '2023-09-25T14:00:00Z',
      };

      expect(() => service.createAppointment(appointmentDto)).toThrow('No available copies');
    });
  });

  describe('approveAppointment', () => {
    it('should approve a pending appointment', () => {
      const mockAppointment: Appointment = {
        id: 'appointment1',
        bookId: 'book1',
        userId: 'user1',
        status: 'pending',
        pickupTime: new Date('2023-09-25T14:00:00Z'),
        createdAt: new Date(),
        approvedAt: '',
      };
      service['appointments'].set('appointment1', mockAppointment);

      const mockBook = { id: 'book1', availableCopies: 1 };
      (bookService.getBookById as jest.Mock).mockReturnValue(mockBook);
      (bookService.updateBookAvailability as jest.Mock).mockImplementation();

      const result = service.approveAppointment('appointment1');

      expect(result.status).toBe('approved');
      expect(result.approvedAt).not.toBe('');
      expect(bookService.updateBookAvailability).toHaveBeenCalledWith('book1', 0);
    });

    it('should throw an error if the appointment is not found', () => {
      expect(() => service.approveAppointment('nonexistent')).toThrow('Appointment not found');
    });

    it('should throw an error if the appointment is not pending', () => {
      const mockAppointment: Appointment = {
        id: 'appointment1',
        bookId: 'book1',
        userId: 'user1',
        status: 'approved',
        pickupTime: new Date('2023-09-25T14:00:00Z'),
        createdAt: new Date(),
        approvedAt: new Date().toISOString(),
      };
      service['appointments'].set('appointment1', mockAppointment);

      expect(() => service.approveAppointment('appointment1')).toThrow('Appointment is not in pending status');
    });
  });

  describe('cancelAppointment', () => {
    it('should cancel an approved appointment', () => {
      const mockAppointment: Appointment = {
        id: 'appointment1',
        bookId: 'book1',
        userId: 'user1',
        status: 'approved',
        pickupTime: new Date('2023-09-25T14:00:00Z'),
        createdAt: new Date(),
        approvedAt: new Date().toISOString(),
      };
      service['appointments'].set('appointment1', mockAppointment);

      const mockBook = { id: 'book1', availableCopies: 0 };
      (bookService.getBookById as jest.Mock).mockReturnValue(mockBook);
      (bookService.updateBookAvailability as jest.Mock).mockImplementation();

      const result = service.cancelAppointment('appointment1');

      expect(result.status).toBe('cancelled');
      expect(bookService.updateBookAvailability).toHaveBeenCalledWith('book1', 1);
    });

    it('should cancel a pending appointment without updating book availability', () => {
      const mockAppointment: Appointment = {
        id: 'appointment1',
        bookId: 'book1',
        userId: 'user1',
        status: 'pending',
        pickupTime: new Date('2023-09-25T14:00:00Z'),
        createdAt: new Date(),
        approvedAt: '',
      };
      service['appointments'].set('appointment1', mockAppointment);

      const result = service.cancelAppointment('appointment1');

      expect(result.status).toBe('cancelled');
      expect(bookService.updateBookAvailability).not.toHaveBeenCalled();
    });

    it('should throw an error if the appointment is not found', () => {
      expect(() => service.cancelAppointment('nonexistent')).toThrow('Appointment not found');
    });

    it('should throw an error if the appointment is already cancelled', () => {
      const mockAppointment: Appointment = {
        id: 'appointment1',
        bookId: 'book1',
        userId: 'user1',
        status: 'cancelled',
        pickupTime: new Date('2023-09-25T14:00:00Z'),
        createdAt: new Date(),
        approvedAt: '',
      };
      service['appointments'].set('appointment1', mockAppointment);

      expect(() => service.cancelAppointment('appointment1')).toThrow('Appointment is already cancelled');
    });
  });

  describe('getAppointmentsByBookId', () => {
    it('should return appointments for a specific book', () => {
      const mockBook = { id: 'book1', title: 'Test Book', availableCopies: 1 };
      (bookService.getBookById as jest.Mock).mockReturnValue(mockBook);

      const mockAppointment1: Appointment = {
        id: 'appointment1',
        bookId: 'book1',
        userId: 'user1',
        status: 'approved',
        pickupTime: new Date('2023-09-25T14:00:00Z'),
        createdAt: new Date(),
        approvedAt: new Date().toISOString(),
      };
      const mockAppointment2: Appointment = {
        id: 'appointment2',
        bookId: 'book1',
        userId: 'user2',
        status: 'pending',
        pickupTime: new Date('2023-09-26T14:00:00Z'),
        createdAt: new Date(),
        approvedAt: '',
      };
      service['appointments'].set('appointment1', mockAppointment1);
      service['appointments'].set('appointment2', mockAppointment2);

      const result = service.getAppointmentsByBookId('book1');

      expect(result).toEqual({
        ...mockBook,
        appointments: [
          {
            userId: 'user1',
            appointmentId: 'appointment1',
            pickupTime: mockAppointment1.pickupTime,
            createdAt: mockAppointment1.createdAt,
            status: 'approved',
            approvedAt: mockAppointment1.approvedAt,
          },
          {
            userId: 'user2',
            appointmentId: 'appointment2',
            pickupTime: mockAppointment2.pickupTime,
            createdAt: mockAppointment2.createdAt,
            status: 'pending',
            approvedAt: '',
          },
        ],
      });
    });

    it('should return null if the book is not found', () => {
      (bookService.getBookById as jest.Mock).mockReturnValue(null);

      const result = service.getAppointmentsByBookId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserAppointments', () => {
    it('should return appointments for a specific user', () => {
      const mockBook1 = { id: 'book1', title: 'Test Book 1' };
      const mockBook2 = { id: 'book2', title: 'Test Book 2' };
      (bookService.getBookById as jest.Mock)
        .mockReturnValueOnce(mockBook1)
        .mockReturnValueOnce(mockBook2);

      const mockAppointment1: Appointment = {
        id: 'appointment1',
        bookId: 'book1',
        userId: 'user1',
        status: 'approved',
        pickupTime: new Date('2023-09-25T14:00:00Z'),
        createdAt: new Date(),
        approvedAt: new Date().toISOString(),
      };
      const mockAppointment2: Appointment = {
        id: 'appointment2',
        bookId: 'book2',
        userId: 'user1',
        status: 'pending',
        pickupTime: new Date('2023-09-26T14:00:00Z'),
        createdAt: new Date(),
        approvedAt: '',
      };
      service['appointments'].set('appointment1', mockAppointment1);
      service['appointments'].set('appointment2', mockAppointment2);

      const result = service.getUserAppointments('user1');

      expect(result).toEqual({
        userId: 'user1',
        appointments: [
          {
            book: mockBook1,
            appointmentId: 'appointment1',
            pickupTime: mockAppointment1.pickupTime,
            createdAt: mockAppointment1.createdAt,
            status: 'approved',
            approvedAt: mockAppointment1.approvedAt,
          },
          {
            book: mockBook2,
            appointmentId: 'appointment2',
            pickupTime: mockAppointment2.pickupTime,
            createdAt: mockAppointment2.createdAt,
            status: 'pending',
            approvedAt: '',
          },
        ],
      });
    });

    it('should return empty appointments array if user has no appointments', () => {
      const result = service.getUserAppointments('user2');

      expect(result).toEqual({
        userId: 'user2',
        appointments: [],
      });
    });
  });
});