import axios from 'axios';
import { Book } from '../models/book';
import { logger } from '../utils/logger';
import { CustomError } from '../utils/customError';
import { StatusCodes } from 'http-status-codes';
import dotenv from 'dotenv';

dotenv.config();

class BookService {
  private books: Map<string, Book> = new Map();
  private readonly OPEN_LIBRARY_API = process.env.OPEN_LIBRARY_API_BASE_URL || 'https://openlibrary.org/subjects/';
  private readonly GENRE = process.env.GENRE || 'science_fiction';

  async fetchBooks(): Promise<void> {
    try {
      const response = await axios.get(`${this.OPEN_LIBRARY_API}${this.GENRE}.json`);
      const booksData = response.data.works;

      booksData.forEach((bookData: any) => {
        const book: Book = {
          id: bookData.key,
          title: bookData.title,
          author: bookData.authors[0]?.name || 'Unknown',
          editionNumber: 1,
          genre: this.GENRE,
          availableCopies: Math.floor(Math.random() * 5) + 1,
          coverImageUrl: bookData.cover_id ? `https://covers.openlibrary.org/b/id/${bookData.cover_id}-M.jpg` : undefined,
          description: bookData.description?.value || bookData.description || undefined,
          publishedDate: bookData.first_publish_year ? bookData.first_publish_year.toString() : undefined
        };
        this.books.set(book.id, book);
      });

      logger.info(`Fetched ${this.books.size} books from Open Library API`);
    } catch (error) {
      logger.error('Error fetching books from Open Library API', error);
      throw new CustomError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch books');
    }
  }

  async getBooks(): Promise<Book[]> {
    return Array.from(this.books.values());
  }

  async getBookById(id: string): Promise<Book> {
    const book = this.books.get(id);
    if (!book) {
      throw new CustomError(StatusCodes.NOT_FOUND, 'Book not found');
    }
    return book;
  }

  async getBookAvailability(id: string): Promise<Book> {
    return this.getBookById(id);
  }

  async updateBookAvailability(id: string, availableCopies: number): Promise<void> {
    const book = await this.getBookById(id);
    book.availableCopies = availableCopies;
    this.books.set(id, book);
  }
}

export const bookService = new BookService();