// Older API deployments may not return receipt_code yet. Keep the receipt
// reference visible from the immutable receipt id while the API catches up.
export const receiptCode = (record) => {
  if (record?.receipt_code) return record.receipt_code;
  const ticketDate = String(record?.ticket_no || "").match(/^WB-(\d{8})-/)?.[1];
  const fallbackDate = String(record?.entry_at || record?.created_at || "")
    .slice(0, 10)
    .replaceAll("-", "");
  return record?.id && (ticketDate || fallbackDate)
    ? `RC-${ticketDate || fallbackDate}-${String(record.id).padStart(6, "0")}`
    : "—";
};
