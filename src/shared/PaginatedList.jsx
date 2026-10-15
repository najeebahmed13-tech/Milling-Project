import React, { useEffect, useState } from "react";
import { Pagination } from "../design-system/Pagination.jsx";

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
    pagination: <Pagination currentPage={currentPage} totalPages={pageCount} pageSize={pageSize} totalItems={totalItems} firstItem={firstItem} lastItem={lastItem} onPageChange={setPage} onPageSizeChange={setPageSize} />,
  };
}
