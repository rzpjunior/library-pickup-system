import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { appointmentService } from '../services/appointmentService';
import { formatSuccessResponse, formatErrorResponse } from '../utils/responseFormatter';

const router = Router();

router.post('/', (req, res, next) => {
  try {
    const { bookId, userId, pickupTime } = req.body;
    const formattedBookId = bookId.startsWith('/') ? bookId : `/works/${bookId}`;
    const appointment = appointmentService.createAppointment(formattedBookId, userId, new Date(pickupTime));
    res.status(StatusCodes.CREATED).json(formatSuccessResponse(StatusCodes.CREATED, appointment));
  } catch (error) {
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

export default router;