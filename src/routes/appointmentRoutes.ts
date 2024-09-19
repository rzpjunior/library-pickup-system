import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { appointmentService } from '../services/appointmentService';
import { formatSuccessResponse, formatErrorResponse } from '../utils/responseFormatter';
import { CreateAppointmentDto } from '../dtos/appointmentDtos';

const router = Router();

router.post('/', (req, res, next) => {
  try {
    const appointmentDto: CreateAppointmentDto = {
      bookId: req.body.bookId,
      userId: req.body.userId,
      pickupTime: req.body.pickupTime
    };

    const appointment = appointmentService.createAppointment(appointmentDto);
    res.status(StatusCodes.CREATED).json(formatSuccessResponse(StatusCodes.CREATED, appointment));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'No available copies') {
        return res.status(StatusCodes.BAD_REQUEST).json(
          formatErrorResponse(StatusCodes.BAD_REQUEST, 'The book is not available for appointment')
        );
      }
    }
    next(error);
  }
});

router.get('/book/:prefix/:id', (req, res, next) => {
  try {
    const bookId = `/${req.params.prefix}/${req.params.id}`;
    const bookAppointments = appointmentService.getAppointmentsByBookId(bookId);
    if (!bookAppointments) {
      return res.status(StatusCodes.NOT_FOUND).json(formatErrorResponse(StatusCodes.NOT_FOUND, 'Book not found'));
    }
    res.json(formatSuccessResponse(StatusCodes.OK, bookAppointments));
  } catch (error) {
    next(error);
  }
});

router.get('/user/:userId', (req, res, next) => {
  try {
    const userAppointments = appointmentService.getUserAppointments(req.params.userId);
    res.json(formatSuccessResponse(StatusCodes.OK, userAppointments));
  } catch (error) {
    next(error);
  }
});

router.get('/', (req, res, next) => {
  try {
    const appointments = appointmentService.getAllAppointments();
    res.json(formatSuccessResponse(StatusCodes.OK, appointments));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/cancel', (req, res, next) => {
  try {
    const cancelledAppointment = appointmentService.cancelAppointment(req.params.id);
    res.json(formatSuccessResponse(StatusCodes.OK, cancelledAppointment));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const appointment = appointmentService.getAppointmentById(req.params.id);
    if (!appointment) {
      return res.status(StatusCodes.NOT_FOUND).json(formatErrorResponse(StatusCodes.NOT_FOUND, 'Appointment not found'));
    }
    res.json(formatSuccessResponse(StatusCodes.OK, appointment));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/approve', (req, res, next) => {
  try {
    const approvedAppointment = appointmentService.approveAppointment(req.params.id);
    res.json(formatSuccessResponse(StatusCodes.OK, approvedAppointment));
  } catch (error) {
    next(error);
  }
});

export default router;