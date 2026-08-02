export type BookStatus = 'uploading' | 'ocr_processing' | 'awaiting_review' | 'reviewed' | 'generated';

export interface Author {
  id: string;
  name: string;
  bio: string;
  photo_url?: string;
  credentials: string;
  created_at: string;
}

export interface Book {
  id: string;
  author_id: string;
  title: string;
  subject: string;
  class_level: string;
  term: string;
  status: BookStatus;
  created_at: string;
  pages_count?: number;
}

export interface Page {
  id: string;
  book_id: string;
  page_order: number;
  image_url: string;
  raw_ocr_text?: string;
  ocr_confidence?: number;
  status?: 'pending' | 'processing' | 'completed' | 'error';
  created_at: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface ContentSection {
  subheading: string;
  paragraphs: string[];
  table?: TableData;
}

export interface Week {
  id: string;
  book_id: string;
  week_number: number;
  topic: string;
  content_json: ContentSection[];
  created_at: string;
}

export interface GlossaryTerm {
  id: string;
  book_id: string;
  term: string;
  definition: string;
}

export interface GeneratedDocument {
  id: string;
  book_id: string;
  file_url: string;
  format: 'docx' | 'pdf';
  created_at: string;
}

export interface SampleNote {
  id: string;
  title: string;
  subject: string;
  class_level: string;
  term: string;
  description: string;
  sample_pages: {
    page_order: number;
    image_url: string;
    raw_text: string;
  }[];
}
