export const PAGE_SIZE = 8;

export interface PageSlice<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  previousPage?: number;
  nextPage?: number;
}

export function paginate<T>(
  items: readonly T[],
  currentPage: number,
  pageSize = PAGE_SIZE,
): PageSlice<T> {
  if (!Number.isInteger(currentPage) || currentPage < 1) {
    throw new RangeError("currentPage must be a positive integer");
  }
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError("pageSize must be a positive integer");
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  if (currentPage > totalPages) {
    throw new RangeError("currentPage exceeds the available pages");
  }

  const offset = (currentPage - 1) * pageSize;
  return {
    items: items.slice(offset, offset + pageSize),
    currentPage,
    totalPages,
    previousPage: currentPage > 1 ? currentPage - 1 : undefined,
    nextPage: currentPage < totalPages ? currentPage + 1 : undefined,
  };
}

export function pageHref(section: "studio" | "journal", page: number): string {
  return page <= 1 ? `/${section}/` : `/${section}/page/${page}/`;
}
