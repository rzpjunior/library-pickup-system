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

router.get('/user/:userId', (req, res, next) => {
  try {
    const appointments = appointmentService.getAppointmentsByUser(req.params.userId);
    res.json(formatSuccessResponse(StatusCodes.OK, appointments));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/cancel', (req, res, next) => {
  try {
    appointmentService.cancelAppointment(req.params.id);
    res.status(StatusCodes.OK).json(formatSuccessResponse(StatusCodes.OK, null));
  } catch (error) {
    next(error);
  }
});

export default router;