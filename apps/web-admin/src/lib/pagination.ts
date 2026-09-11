export const ADMIN_PAGE_SIZE = 50;

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number = ADMIN_PAGE_SIZE,
): {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
} {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: current,
    pageCount,
    total,
    pageSize,
  };
}
