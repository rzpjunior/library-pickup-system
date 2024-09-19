import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { bookService } from '../services/bookService';
import { formatSuccessResponse, formatErrorResponse } from '../utils/responseFormatter';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const books = bookService.getBooks();
    res.json(formatSuccessResponse(StatusCodes.OK, books));
  } catch (error) {
    next(error);
  }
});

router.get('/:prefix/:id/availability', (req, res, next) => {
  try {
    const fullId = `/${req.params.prefix}/${req.params.id}`;
    const book = bookService.getBookById(fullId);
    if (!book) {
      return res.status(StatusCodes.NOT_FOUND).json(formatErrorResponse(StatusCodes.NOT_FOUND, 'Book not found'));
    }
    res.json(formatSuccessResponse(StatusCodes.OK, book));
  } catch (error) {
    next(error);
  }
});

export default router;