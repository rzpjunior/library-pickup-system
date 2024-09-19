import { Router } from 'express';
import { appointmentService } from '../services/appointmentService';

const router = Router();

router.post('/', (req, res, next) => {
  try {
    const { bookId, userId, pickupTime } = req.body;
    const appointment = appointmentService.createAppointment(bookId, userId, new Date(pickupTime));
    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
});

router.get('/user/:userId', (req, res, next) => {
  try {
    const appointments = appointmentService.getAppointmentsByUser(req.params.userId);
    res.json(appointments);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/cancel', (req, res, next) => {
  try {
    appointmentService.cancelAppointment(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;