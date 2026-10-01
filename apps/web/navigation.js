export const navigationItems = [
  { id: 'dashboard', label: 'Home', icon: '⌂', permission: null },
  { id: 'users', label: 'Users', icon: '♙', permission: 'user.read' },
  { id: 'customers', label: 'Customers', icon: '♧', permission: 'customer.read', children: [
    { id: 'salesContracts', label: 'Sales Contracts', icon: '◫', permission: 'sales.contract.read' },
    { id: 'deliveryOrders', label: 'Delivery Orders', icon: '⇢', permission: 'sales.delivery_order.read' }
  ] },
  { id: 'vendors', label: 'Suppliers', icon: '▣', permission: 'supplier.read', children: [
    { id: 'purchaseContracts', label: 'Purchase Contracts', icon: '◧', permission: 'purchase.contract.read' }
  ] },
  { id: 'finance', label: 'Finance', icon: '₹', permission: 'finance.read' },
  { id: 'production', label: 'Production', icon: '▥', permission: 'production.read', children: [
    { id: 'productionRuns', label: 'Production Runs', icon: 'R', permission: 'production.read' },
    { id: 'productionRouting', label: 'Routing', icon: 'P', permission: 'production.read' }
  ] },
  { id: 'stock', label: 'Stock', icon: '◇', permission: 'inventory.read', children: [
    { id: 'ffbReceiving', label: 'FFB Receiving', icon: '▱', permission: 'ffb.receipt.read' }
  ] },
  { id: 'quality', label: 'Quality', icon: '✓', permission: 'quality.read' },
  { id: 'dispatch', label: 'Dispatch', icon: '↗', permission: 'dispatch.read' },
  { id: 'masters', label: 'Masters', icon: 'M', permission: 'configuration.manage', children: [
    { id: 'items', label: 'Item Master', icon: 'I', permission: 'configuration.manage' },
    { id: 'masterProductionLines', label: 'Production Line Master', icon: 'L', permission: 'production.manage' },
    { id: 'masterStations', label: 'Station Master', icon: 'S', permission: 'production.manage' },
    { id: 'masterMachines', label: 'Machine Master', icon: 'M', permission: 'production.manage' },
    { id: 'masterVehicleTypes', label: 'Vehicle Type Master', icon: 'T', permission: 'configuration.manage' },
    { id: 'masterVehicles', label: 'Vehicle Master', icon: 'V', permission: 'configuration.manage' }
  ] },
  { id: 'configuration', label: 'Configuration', icon: '⚙', permission: 'configuration.read' }
];

export function getVisibleNavigation(items = navigationItems, permissions = new Set()) {
  return items
    .filter((item) => !item.permission || permissions.has(item.permission))
    .map((item) => ({ ...item, children: item.children?.filter((child) => !child.permission || permissions.has(child.permission)) || [] }));
}
