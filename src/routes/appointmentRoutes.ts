import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { appointmentService } from '../services/appointmentService';
import { formatSuccessResponse } from '../utils/responseFormatter';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const appointment = await appointmentService.createAppointment(req.body);
    res.status(StatusCodes.CREATED).json(formatSuccessResponse(StatusCodes.CREATED, appointment));
  } catch (error) {
    next(error);
  }
});

router.get('/book/:prefix/:id', async (req, res, next) => {
  try {
    const bookId = `/${req.params.prefix}/${req.params.id}`;
    const bookAppointments = await appointmentService.getAppointmentsByBookId(bookId);
    res.json(formatSuccessResponse(StatusCodes.OK, bookAppointments));
  } catch (error) {
    next(error);
  }
});

router.get('/user/:userId', async (req, res, next) => {
  try {
    const userAppointments = await appointmentService.getUserAppointments(req.params.userId);
    res.json(formatSuccessResponse(StatusCodes.OK, userAppointments));
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const appointments = await appointmentService.getAllAppointments();
    res.json(formatSuccessResponse(StatusCodes.OK, appointments));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/cancel', async (req, res, next) => {
  try {
    const cancelledAppointment = await appointmentService.cancelAppointment(req.params.id);
    res.json(formatSuccessResponse(StatusCodes.OK, cancelledAppointment));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id);
    res.json(formatSuccessResponse(StatusCodes.OK, appointment));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/approve', async (req, res, next) => {
  try {
    const updatedAppointment = await appointmentService.approveAppointment(req.params.id, req.body);
    res.json(formatSuccessResponse(StatusCodes.OK, updatedAppointment));
  } catch (error) {
    next(error);
  }
});

export default router;