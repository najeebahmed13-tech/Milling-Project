import React, { useEffect, useState } from "react";
import "./paginated-list.css";

const pageSizes = [10, 20, 50, 100, 200, 500];

export function usePaginatedItems(items, resetKey = "") {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalItems = items.length;
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleItems = items.slice(startIndex, startIndex + pageSize);
  const firstItem = totalItems ? startIndex + 1 : 0;
  const lastItem = Math.min(startIndex + visibleItems.length, totalItems);

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return {
    visibleItems,
    pagination: (
      <nav className="pagination-controls" aria-label="List pagination">
        <span className="pagination-summary">
          Showing {firstItem}–{lastItem} of {totalItems}
        </span>
        <div className="pagination-navigation">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            Previous
          </button>
          <span aria-current="page">
            Page {currentPage} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            disabled={currentPage >= pageCount}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
        <label className="pagination-size">
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </nav>
    ),
  };
}
