import { useEffect, useState } from "react";
import { ADMIN_PAGE_SIZE, paginateItems } from "../lib/pagination";
import { btnSecondaryClass } from "../lib/adminUi";

export function AdminPagination({
  page,
  pageCount,
  total,
  pageSize = ADMIN_PAGE_SIZE,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}) {
  if (total === 0) {
    return null;
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-zinc-500">
        {from}–{to} de {total}
        {total > pageSize ? ` · ${pageSize} por página` : ""}
      </p>
      {pageCount > 1 ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`${btnSecondaryClass} min-h-10 px-3 text-xs`}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Anterior
          </button>
          <span className="min-w-[5.5rem] text-center text-xs font-medium text-zinc-600">
            {page} / {pageCount}
          </span>
          <button
            type="button"
            className={`${btnSecondaryClass} min-h-10 px-3 text-xs`}
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            Siguiente
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function usePagedItems<T>(
  items: T[] | undefined,
  resetKey?: string,
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
      paged: undefined as T[] | undefined,
    };
  }

  const paged = paginateItems(items, page);
  return {
    page: paged.page,
    setPage,
    pageCount: paged.pageCount,
    total: paged.total,
    paged: paged.items,
  };
}
