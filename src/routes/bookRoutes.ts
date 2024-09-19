import { Router } from 'express';
import { bookService } from '../services/bookService';
import { logger } from '../utils/logger';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const books = bookService.getBooks();
    res.json(books);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/availability', (req, res, next) => {
  try {
    const book = bookService.getBookById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ availableCopies: book.availableCopies });
  } catch (error) {
    next(error);
  }
});

export default router;