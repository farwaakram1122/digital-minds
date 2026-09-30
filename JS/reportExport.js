// Shared CSV export for the HTML and React admin dashboards.
export function downloadReport(report) {
  const rows = [
    ['Section', 'Name', 'Orders', 'Value (PKR)'],
    ['Summary', 'Farmers', '', report.farmers],
    ['Summary', 'Customers', '', report.customers],
    ['Summary', 'Markets', '', report.markets],
    ['Summary', 'All orders', report.orders, ''],
    ['Summary', 'Completed pickup revenue', '', report.revenue],
    ...report.activeFarmers.map(farmer => ['Farmer', farmer.business || String(farmer._id), farmer.orders, farmer.value]),
    ...(report.byMarket || []).map(market => ['Market', market.name || String(market._id), market.orders, market.revenue]),
  ];
  const cell = value => {
    const text = String(value ?? '');
    const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const csv = '\ufeff' + rows.map(row => row.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `marketlink-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
