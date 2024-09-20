import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { bookService } from '../services/bookService';
import { formatSuccessResponse } from '../utils/responseFormatter';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const books = await bookService.getBooks();
    res.json(formatSuccessResponse(StatusCodes.OK, books));
  } catch (error) {
    next(error);
  }
});

router.get('/:prefix/:id/availability', async (req, res, next) => {
  try {
    const fullId = `/${req.params.prefix}/${req.params.id}`;
    const book = await bookService.getBookAvailability(fullId);
    res.json(formatSuccessResponse(StatusCodes.OK, book));
  } catch (error) {
    next(error);
  }
});

export default router;