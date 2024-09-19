export interface Book {
  id: string;
  title: string;
  author: string;
  editionNumber: number;
  genre: string;
  availableCopies: number;
  coverImageUrl?: string;
  description?: string;
  publishedDate?: string;
}
  