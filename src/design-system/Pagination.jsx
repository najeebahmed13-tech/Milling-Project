import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./pagination.css";

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100, 200, 500];

function pageItems(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const items = [1];
  if (currentPage > 4) items.push("start-ellipsis");
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let page = start; page <= end; page += 1) items.push(page);
  if (currentPage < totalPages - 3) items.push("end-ellipsis");
  items.push(totalPages);
  return items;
}

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  totalItems = 0,
  firstItem = 0,
  lastItem = 0,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  onPageChange,
  onPageSizeChange,
  loading = false,
  className = "",
}) {
  const safePage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
  const items = pageItems(safePage, Math.max(totalPages, 1));
  const canGoPrevious = !loading && safePage > 1;
  const canGoNext = !loading && safePage < totalPages;

  return (
    <>
      <div className="pagination-reserve" aria-hidden="true" />
      <nav className={`pagination-controls ${className}`.trim()} aria-label="List pagination" aria-busy={loading}>
      <span className="pagination-summary">
        {loading ? "Loading…" : `View ${firstItem.toLocaleString()} – ${lastItem.toLocaleString()} of ${totalItems.toLocaleString()}`}
      </span>
      <div className="pagination-navigation">
        <button type="button" onClick={() => onPageChange?.(safePage - 1)} disabled={!canGoPrevious} aria-label="Previous page">
          <ChevronLeft size={15} aria-hidden="true" />
          <span>Previous</span>
        </button>
        <div className="pagination-pages" aria-label={`Page ${safePage} of ${totalPages}`}>
          {items.map((item) => typeof item === "string" ? (
            <span className="pagination-ellipsis" key={item} aria-hidden="true">…</span>
          ) : (
            <button type="button" key={item} className={item === safePage ? "page-current" : ""} onClick={() => onPageChange?.(item)} disabled={loading} aria-current={item === safePage ? "page" : undefined} aria-label={`Page ${item}`}>
              {item}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => onPageChange?.(safePage + 1)} disabled={!canGoNext} aria-label="Next page">
          <span>Next</span>
          <ChevronRight size={15} aria-hidden="true" />
        </button>
      </div>
      <label className="pagination-size">
        <span className="pagination-size-label">Rows per page</span>
        <select value={pageSize} onChange={(event) => onPageSizeChange?.(Number(event.target.value))} disabled={loading} aria-label="Rows per page">
          {pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
      </nav>
    </>
  );
}
