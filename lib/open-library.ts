export type OpenLibraryResult = {
  key: string;
  title: string;
  author: string;
  coverUrl: string | null;
  isbn: string | null;
  firstPublishYear: number | null;
};

type OpenLibraryDoc = {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  isbn?: string[];
  first_publish_year?: number;
};

type OpenLibrarySearchResponse = {
  docs: OpenLibraryDoc[];
};

export async function searchOpenLibrary(
  query: string,
  signal?: AbortSignal
): Promise<OpenLibraryResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(trimmed)}&limit=15&fields=key,title,author_name,cover_i,isbn,first_publish_year`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Open Library search failed: ${response.status}`);
  }
  const data = (await response.json()) as OpenLibrarySearchResponse;

  return data.docs.map((doc) => ({
    key: doc.key,
    title: doc.title,
    author: doc.author_name?.[0] ?? 'Unknown author',
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
    isbn: doc.isbn?.[0] ?? null,
    firstPublishYear: doc.first_publish_year ?? null,
  }));
}
