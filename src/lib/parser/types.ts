export interface ParsedBookmark {
  url: string;
  title: string;
  folderPath: string | null;
  dateAdded: Date | null;
}

export interface ParseResult {
  bookmarks: ParsedBookmark[];
  errors: string[];
}
