import { useEffect, useState } from "react";
import { ADMIN_PAGE_SIZE, paginateItems } from "../lib/pagination";
import { btnSecondaryClass } from "../lib/adminUi";

const navBtnClass = `${btnSecondaryClass} min-h-9 min-w-9 px-2 text-xs`;

export function AdminPagination({
  page,
  pageCount,
  total,
  pageSize = ADMIN_PAGE_SIZE,
  onPageChange,
  className = "",
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (total === 0) {
    return null;
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div
      className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}
    >
      <p className="text-xs text-zinc-500">
        {from}–{to} de {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={navBtnClass}
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          aria-label="Primera página"
        >
          «
        </button>
        <button
          type="button"
          className={navBtnClass}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </button>
        <span className="min-w-[5.5rem] px-2 text-center text-xs font-medium text-zinc-600">
          {page} / {pageCount}
        </span>
        <button
          type="button"
          className={navBtnClass}
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </button>
        <button
          type="button"
          className={navBtnClass}
          disabled={page >= pageCount}
          onClick={() => onPageChange(pageCount)}
          aria-label="Última página"
        >
          »
        </button>
      </div>
    </div>
  );
}

export function usePagedItems<T>(
  items: T[] | undefined,
  resetKey?: string,
  pageSize: number = ADMIN_PAGE_SIZE,
) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  if (items === undefined) {
    return {
      page: 1,
      setPage,
      pageCount: 1,
      total: 0,
      pageSize,
      paged: undefined as T[] | undefined,
    };
  }

  const paged = paginateItems(items, page, pageSize);
  return {
    page: paged.page,
    setPage,
    pageCount: paged.pageCount,
    total: paged.total,
    pageSize: paged.pageSize,
    paged: paged.items,
  };
}