import type { Booking, DashboardSummary } from '../store/api'

export type CustomerReportItem = {
  id?: number | string
  name?: string
  phone?: string
  email?: string | null
  address?: string | null
  vehicles_count?: number | string
  last_visit?: string | null
  created_at?: string
  [key: string]: unknown
}

export type VehicleReportItem = {
  id?: number | string
  reg_number?: string
  make?: string
  model?: string
  year?: number | string | null
  customer_name?: string
  customer_phone?: string
  customer_email?: string | null
  last_service_date?: string | null
  next_service_date?: string | null
  insurance_expiry?: string | null
  puc_expiry?: string | null
  warranty_expiry?: string | null
  [key: string]: unknown
}

export type FullReportData = {
  title: string
  periodLabel?: string
  dateRange?: { from: string; to: string }
  summary?: DashboardSummary
  customers: CustomerReportItem[]
  vehicles: VehicleReportItem[]
  bookings: Booking[]
  todayServices: Booking[]
}

const escapeCsv = (value: unknown): string => {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const escapeHtml = (val: unknown): string => {
  return String(val ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const todayDateString = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

function downloadCsv(rows: (string | number | null | undefined)[][], filename: string) {
  const csv = rows.map(row => row.map(escapeCsv).join(',')).join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function openPrintPopup(title: string, htmlContent: string) {
  const popup = window.open('', '_blank', 'width=1100,height=850')
  if (!popup) {
    window.alert('Please allow pop-ups to export the report as PDF.')
    return
  }

  popup.document.write(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 36px 40px;
      font-size: 11px;
      line-height: 1.45;
    }
    .header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -0.03em;
      color: #0f172a;
    }
    .brand span { color: #f07836; }
    .report-title {
      font-size: 17px;
      font-weight: 800;
      color: #1e293b;
      margin: 6px 0 3px;
    }
    .meta {
      font-size: 11px;
      color: #64748b;
    }
    .actions {
      display: flex;
      gap: 8px;
    }
    .print-btn {
      background: #f07836;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 9px 18px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: background 0.15s;
    }
    .print-btn:hover { background: #d96222; }
    .section {
      margin-bottom: 32px;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    .section-title {
      font-size: 13.5px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin: 0;
    }
    .section-count {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      margin-top: 4px;
    }
    th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 9.5px;
      letter-spacing: 0.05em;
      border-bottom: 1.5px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
    }
    td {
      border-bottom: 1px solid #e2e8f0;
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }
    tr:nth-child(even) td { background-color: #fafbfd; }
    .bold { font-weight: 700; color: #0f172a; }
    .code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 700; color: #b94f1e; }
    .num { text-align: right; }
    th.num { text-align: right; }
    .sub { color: #64748b; font-size: 9.5px; display: block; margin-top: 2px; }
    .empty {
      padding: 20px;
      text-align: center;
      color: #94a3b8;
      font-style: italic;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px dashed #cbd5e1;
      margin-top: 6px;
    }
    .badge {
      display: inline-block;
      padding: 2.5px 7px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-warn { background: #fef3c7; color: #b45309; }
    .badge-danger { background: #fee2e2; color: #b91c1c; }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }
    .metric-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      background: #f8fafc;
    }
    .metric-label {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .metric-val {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 3px;
    }
    @media print {
      body { padding: 20px; }
      .actions { display: none !important; }
      .section { page-break-inside: auto; margin-bottom: 24px; }
      tr { page-break-inside: avoid; }
      thead { display: table-header-group; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">remindme<span>.</span></div>
      <div class="report-title">${escapeHtml(title)}</div>
      <div class="meta">Generated: ${escapeHtml(new Date().toLocaleString())}</div>
    </div>
    <div class="actions">
      <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
    </div>
  </div>
  ${htmlContent}
</body>
</html>`)
  popup.document.close()
  popup.focus()
}

function renderTodayServicesTableHtml(todayServices: Booking[]): string {
  if (!todayServices.length) return '<div class="empty">No services scheduled for today.</div>'
  const rows = todayServices.map(b => `
    <tr>
      <td class="bold">${escapeHtml(b.slot_start ? b.slot_start.slice(0, 5) : '—')}</td>
      <td class="code">${escapeHtml(b.booking_code)}</td>
      <td><strong>${escapeHtml(b.customer_name)}</strong><span class="sub">${escapeHtml(b.customer_phone)}</span></td>
      <td>${escapeHtml(b.reg_number)}<span class="sub">${escapeHtml(b.make)} ${escapeHtml(b.model)}</span></td>
      <td>${escapeHtml(b.service_type)}</td>
      <td><span class="badge ${b.status === 'COMPLETED' ? 'badge-success' : b.status === 'CANCELLED' ? 'badge-danger' : 'badge-warn'}">${escapeHtml(b.status)}</span></td>
      <td>${escapeHtml(b.assigned_staff_name || 'Unassigned')}</td>
      <td class="num">${b.invoice_total != null ? `₹${Number(b.invoice_total).toLocaleString('en-IN')}` : '—'}</td>
    </tr>
  `).join('')
  return `<table>
    <thead><tr><th>Time</th><th>Code</th><th>Customer</th><th>Vehicle</th><th>Service</th><th>Status</th><th>Handled By</th><th class="num">Bill Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`
}

function renderBookingsTableHtml(bookings: Booking[]): string {
  if (!bookings.length) return '<div class="empty">No bookings found for the selected period.</div>'
  const rows = bookings.map(b => `
    <tr>
      <td><strong>${escapeHtml(b.booking_date)}</strong><span class="sub">${escapeHtml(b.slot_start ? b.slot_start.slice(0, 5) : '—')}</span></td>
      <td class="code">${escapeHtml(b.booking_code)}</td>
      <td><strong>${escapeHtml(b.customer_name)}</strong><span class="sub">${escapeHtml(b.customer_phone)}</span></td>
      <td>${escapeHtml(b.reg_number)}<span class="sub">${escapeHtml(b.make)} ${escapeHtml(b.model)}</span></td>
      <td>${escapeHtml(b.service_type)}</td>
      <td><span class="badge ${b.status === 'COMPLETED' ? 'badge-success' : b.status === 'CANCELLED' ? 'badge-danger' : 'badge-warn'}">${escapeHtml(b.status)}</span></td>
      <td>${escapeHtml(b.assigned_staff_name || 'Unassigned')}</td>
      <td class="num">${b.invoice_total != null ? `₹${Number(b.invoice_total).toLocaleString('en-IN')}` : '—'}</td>
    </tr>
  `).join('')
  return `<table>
    <thead><tr><th>Date & Time</th><th>Code</th><th>Customer</th><th>Vehicle</th><th>Service</th><th>Status</th><th>Staff</th><th class="num">Invoice Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`
}

function renderCustomersTableHtml(customers: CustomerReportItem[]): string {
  if (!customers.length) return '<div class="empty">No customer records found.</div>'
  const rows = customers.map(c => `
    <tr>
      <td><strong>${escapeHtml(c.name || '—')}</strong></td>
      <td>${escapeHtml(c.phone || '—')}</td>
      <td>${escapeHtml(c.email || '—')}</td>
      <td>${escapeHtml(c.address || '—')}</td>
      <td class="num">${escapeHtml(c.vehicles_count ?? 0)}</td>
      <td>${escapeHtml(c.last_visit || '—')}</td>
    </tr>
  `).join('')
  return `<table>
    <thead><tr><th>Customer Name</th><th>Phone</th><th>Email</th><th>Address</th><th class="num">Vehicles</th><th>Last Visit</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`
}

function renderVehiclesTableHtml(vehicles: VehicleReportItem[]): string {
  if (!vehicles.length) return '<div class="empty">No vehicle records found.</div>'
  const rows = vehicles.map(v => `
    <tr>
      <td class="bold">${escapeHtml(v.reg_number || '—')}</td>
      <td>${escapeHtml(v.make || '—')} ${escapeHtml(v.model || '')}</td>
      <td>${escapeHtml(v.year ?? '—')}</td>
      <td><strong>${escapeHtml(v.customer_name || '—')}</strong><span class="sub">${escapeHtml(v.customer_phone || '')}</span></td>
      <td>${escapeHtml(v.last_service_date || '—')}</td>
      <td>${escapeHtml(v.next_service_date || '—')}</td>
      <td>${escapeHtml(v.insurance_expiry || '—')}</td>
      <td>${escapeHtml(v.puc_expiry || '—')}</td>
    </tr>
  `).join('')
  return `<table>
    <thead><tr><th>Registration</th><th>Make & Model</th><th>Year</th><th>Owner</th><th>Last Service</th><th>Next Service</th><th>Insurance</th><th>PUC</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`
}

/* -------------------------------------------------------------------------
 * FULL REPORT EXPORTS (CSV & PDF)
 * Includes separate sections for Customers, Vehicles, Bookings, and Today's Services
 * ------------------------------------------------------------------------- */

export function exportFullReportSpreadsheet(data: FullReportData) {
  const generatedAt = new Date().toLocaleString()
  const rows: (string | number | null | undefined)[][] = [
    ['remindme. Service Center Comprehensive Report', data.title],
    ['Generated At', generatedAt],
    ['Reporting Period', data.periodLabel || 'All time'],
    [],
  ]

  if (data.summary) {
    rows.push(
      ['=== SUMMARY METRICS ==='],
      ['Active Customers', data.summary.activeCustomers],
      ['Registered Vehicles', data.summary.registeredVehicles],
      ['Bookings Today', data.summary.bookingsToday.total],
      ['Confirmed Bookings Today', data.summary.bookingsToday.confirmed],
      ['Completed Bookings Today', data.summary.bookingsToday.completed],
      ['Services Completed (Month)', data.summary.servicesCompletedMonth],
      ['Active Staff', data.summary.activeStaff],
      [],
    )
  }

  // Section 1: Today's Services
  rows.push(
    ['=== SECTION 1: TODAY\'S SERVICES ==='],
    ['Time Slot', 'Booking Code', 'Customer Name', 'Phone', 'Registration', 'Vehicle', 'Service Type', 'Status', 'Assigned Staff', 'Bill Total'],
    ...(data.todayServices.length
      ? data.todayServices.map(b => [
          b.slot_start ? b.slot_start.slice(0, 5) : '—',
          b.booking_code,
          b.customer_name,
          b.customer_phone,
          b.reg_number,
          `${b.make} ${b.model}`,
          b.service_type,
          b.status,
          b.assigned_staff_name || 'Unassigned',
          b.invoice_total != null ? `₹${Number(b.invoice_total).toLocaleString('en-IN')}` : '—',
        ])
      : [['No services scheduled for today']]),
    [],
  )

  // Section 2: Bookings
  rows.push(
    ['=== SECTION 2: BOOKINGS ==='],
    ['Booking Date', 'Time Slot', 'Booking Code', 'Customer Name', 'Phone', 'Registration', 'Vehicle', 'Service Type', 'Status', 'Assigned Staff', 'Invoice Total', 'Payment Status'],
    ...(data.bookings.length
      ? data.bookings.map(b => [
          b.booking_date,
          b.slot_start ? b.slot_start.slice(0, 5) : '—',
          b.booking_code,
          b.customer_name,
          b.customer_phone,
          b.reg_number,
          `${b.make} ${b.model}`,
          b.service_type,
          b.status,
          b.assigned_staff_name || 'Unassigned',
          b.invoice_total != null ? `₹${Number(b.invoice_total).toLocaleString('en-IN')}` : '—',
          b.invoice_status || '—',
        ])
      : [['No bookings found for the selected period']]),
    [],
  )

  // Section 3: Customers
  rows.push(
    ['=== SECTION 3: CUSTOMERS ==='],
    ['Customer Name', 'Phone', 'Email', 'Address', 'Vehicles Count', 'Last Visit Date'],
    ...(data.customers.length
      ? data.customers.map(c => [
          c.name || '—',
          c.phone || '—',
          c.email || '—',
          c.address || '—',
          c.vehicles_count ?? 0,
          c.last_visit || '—',
        ])
      : [['No customers found']]),
    [],
  )

  // Section 4: Vehicles
  rows.push(
    ['=== SECTION 4: VEHICLES ==='],
    ['Registration Number', 'Make', 'Model', 'Year', 'Owner Name', 'Owner Phone', 'Last Service Date', 'Next Service Due', 'Insurance Expiry', 'PUC Expiry', 'Warranty Expiry'],
    ...(data.vehicles.length
      ? data.vehicles.map(v => [
          v.reg_number || '—',
          v.make || '—',
          v.model || '—',
          v.year ?? '—',
          v.customer_name || '—',
          v.customer_phone || '—',
          v.last_service_date || '—',
          v.next_service_date || '—',
          v.insurance_expiry || '—',
          v.puc_expiry || '—',
          v.warranty_expiry || '—',
        ])
      : [['No vehicles found']]),
  )

  downloadCsv(rows, `service-center-full-report-${todayDateString()}.csv`)
}

export function exportFullReportPdf(data: FullReportData) {
  const summaryHtml = data.summary ? `
    <div class="metrics-grid">
      <div class="metric-card"><div class="metric-label">Active Customers</div><div class="metric-val">${data.summary.activeCustomers}</div></div>
      <div class="metric-card"><div class="metric-label">Registered Vehicles</div><div class="metric-val">${data.summary.registeredVehicles}</div></div>
      <div class="metric-card"><div class="metric-label">Bookings Today</div><div class="metric-val">${data.summary.bookingsToday.total}</div></div>
      <div class="metric-card"><div class="metric-label">Services Completed (Mo)</div><div class="metric-val">${data.summary.servicesCompletedMonth}</div></div>
    </div>
  ` : ''

  const html = `
    ${summaryHtml}
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Section 1: Today’s Services</h2>
        <span class="section-count">${data.todayServices.length} record${data.todayServices.length === 1 ? '' : 's'}</span>
      </div>
      ${renderTodayServicesTableHtml(data.todayServices)}
    </div>

    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Section 2: Bookings (${escapeHtml(data.periodLabel || 'Selected period')})</h2>
        <span class="section-count">${data.bookings.length} record${data.bookings.length === 1 ? '' : 's'}</span>
      </div>
      ${renderBookingsTableHtml(data.bookings)}
    </div>

    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Section 3: Customers</h2>
        <span class="section-count">${data.customers.length} record${data.customers.length === 1 ? '' : 's'}</span>
      </div>
      ${renderCustomersTableHtml(data.customers)}
    </div>

    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Section 4: Vehicles</h2>
        <span class="section-count">${data.vehicles.length} record${data.vehicles.length === 1 ? '' : 's'}</span>
      </div>
      ${renderVehiclesTableHtml(data.vehicles)}
    </div>
  `

  openPrintPopup(data.title, html)
}

/* -------------------------------------------------------------------------
 * INDIVIDUAL SECTION EXPORTS (CSV & PDF)
 * ------------------------------------------------------------------------- */

export function exportTodayServicesSpreadsheet(services: Booking[]) {
  const rows: (string | number | null | undefined)[][] = [
    ['remindme. Today\'s Services Report'],
    ['Generated At', new Date().toLocaleString()],
    [],
    ['Time Slot', 'Booking Code', 'Customer Name', 'Phone', 'Registration', 'Vehicle', 'Service Type', 'Status', 'Assigned Staff', 'Bill Total'],
    ...(services.length
      ? services.map(b => [
          b.slot_start ? b.slot_start.slice(0, 5) : '—',
          b.booking_code,
          b.customer_name,
          b.customer_phone,
          b.reg_number,
          `${b.make} ${b.model}`,
          b.service_type,
          b.status,
          b.assigned_staff_name || 'Unassigned',
          b.invoice_total != null ? `₹${Number(b.invoice_total).toLocaleString('en-IN')}` : '—',
        ])
      : [['No services scheduled for today']]),
  ]
  downloadCsv(rows, `todays-services-${todayDateString()}.csv`)
}

export function exportTodayServicesPdf(services: Booking[]) {
  const html = `
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Today’s Services</h2>
        <span class="section-count">${services.length} record${services.length === 1 ? '' : 's'}</span>
      </div>
      ${renderTodayServicesTableHtml(services)}
    </div>
  `
  openPrintPopup('Today’s Services Report', html)
}

export function exportBookingsSpreadsheet(bookings: Booking[], periodLabel?: string) {
  const rows: (string | number | null | undefined)[][] = [
    ['remindme. Bookings Report'],
    ['Generated At', new Date().toLocaleString()],
    ['Reporting Period', periodLabel || 'All time'],
    [],
    ['Booking Date', 'Time Slot', 'Booking Code', 'Customer Name', 'Phone', 'Registration', 'Vehicle', 'Service Type', 'Status', 'Assigned Staff', 'Invoice Total', 'Payment Status'],
    ...(bookings.length
      ? bookings.map(b => [
          b.booking_date,
          b.slot_start ? b.slot_start.slice(0, 5) : '—',
          b.booking_code,
          b.customer_name,
          b.customer_phone,
          b.reg_number,
          `${b.make} ${b.model}`,
          b.service_type,
          b.status,
          b.assigned_staff_name || 'Unassigned',
          b.invoice_total != null ? `₹${Number(b.invoice_total).toLocaleString('en-IN')}` : '—',
          b.invoice_status || '—',
        ])
      : [['No bookings found for the selected period']]),
  ]
  downloadCsv(rows, `bookings-${todayDateString()}.csv`)
}

export function exportBookingsPdf(bookings: Booking[], periodLabel?: string) {
  const html = `
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Bookings Report (${escapeHtml(periodLabel || 'All time')})</h2>
        <span class="section-count">${bookings.length} record${bookings.length === 1 ? '' : 's'}</span>
      </div>
      ${renderBookingsTableHtml(bookings)}
    </div>
  `
  openPrintPopup('Bookings Report', html)
}

export function exportCustomersSpreadsheet(customers: CustomerReportItem[]) {
  const rows: (string | number | null | undefined)[][] = [
    ['remindme. Customers Report'],
    ['Generated At', new Date().toLocaleString()],
    [],
    ['Customer Name', 'Phone', 'Email', 'Address', 'Vehicles Count', 'Last Visit Date'],
    ...(customers.length
      ? customers.map(c => [
          c.name || '—',
          c.phone || '—',
          c.email || '—',
          c.address || '—',
          c.vehicles_count ?? 0,
          c.last_visit || '—',
        ])
      : [['No customer records found']]),
  ]
  downloadCsv(rows, `customers-${todayDateString()}.csv`)
}

export function exportCustomersPdf(customers: CustomerReportItem[]) {
  const html = `
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Customers Report</h2>
        <span class="section-count">${customers.length} record${customers.length === 1 ? '' : 's'}</span>
      </div>
      ${renderCustomersTableHtml(customers)}
    </div>
  `
  openPrintPopup('Customers Report', html)
}

export function exportVehiclesSpreadsheet(vehicles: VehicleReportItem[]) {
  const rows: (string | number | null | undefined)[][] = [
    ['remindme. Vehicles Report'],
    ['Generated At', new Date().toLocaleString()],
    [],
    ['Registration Number', 'Make', 'Model', 'Year', 'Owner Name', 'Owner Phone', 'Last Service Date', 'Next Service Due', 'Insurance Expiry', 'PUC Expiry', 'Warranty Expiry'],
    ...(vehicles.length
      ? vehicles.map(v => [
          v.reg_number || '—',
          v.make || '—',
          v.model || '—',
          v.year ?? '—',
          v.customer_name || '—',
          v.customer_phone || '—',
          v.last_service_date || '—',
          v.next_service_date || '—',
          v.insurance_expiry || '—',
          v.puc_expiry || '—',
          v.warranty_expiry || '—',
        ])
      : [['No vehicle records found']]),
  ]
  downloadCsv(rows, `vehicles-${todayDateString()}.csv`)
}

export function exportVehiclesPdf(vehicles: VehicleReportItem[]) {
  const html = `
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Vehicles Report</h2>
        <span class="section-count">${vehicles.length} record${vehicles.length === 1 ? '' : 's'}</span>
      </div>
      ${renderVehiclesTableHtml(vehicles)}
    </div>
  `
  openPrintPopup('Vehicles Report', html)
}

/* -------------------------------------------------------------------------
 * LEGACY EXPORTS (Backward compatibility)
 * ------------------------------------------------------------------------- */

type LegacyReportData = {
  title: string
  summary: DashboardSummary
  bookings: Booking[]
}

export function exportReportSpreadsheet(data: LegacyReportData) {
  const rows = [
    ['Metric', 'Value', 'Details'],
    ['Active customers', data.summary.activeCustomers, ''],
    ['Registered vehicles', data.summary.registeredVehicles, ''],
    ['Bookings today', data.summary.bookingsToday.total, `${data.summary.bookingsToday.confirmed} confirmed; ${data.summary.bookingsToday.completed} completed`],
    ['Active staff', data.summary.activeStaff, ''],
    ['Services completed', data.summary.servicesCompletedMonth, 'This month'],
    ['Reminders tracked', data.summary.remindersCount, 'Pending and sent'],
    [],
    ['Booking code', 'Customer', 'Vehicle', 'Service', 'Booking date', 'Slot', 'Status'],
    ...data.bookings.map(booking => [
      booking.booking_code,
      booking.customer_name,
      `${booking.reg_number} · ${booking.make} ${booking.model}`,
      booking.service_type,
      booking.booking_date,
      booking.slot_start,
      booking.status,
    ]),
    [],
    ['Day', 'Bookings', 'Services completed'],
    ...data.summary.monthlyBookingTrend.map(item => [item.day, item.bookings, item.services]),
  ]
  downloadCsv(rows, `${data.title.toLowerCase().replaceAll(' ', '-')}-report.csv`)
}

export function exportReportPdf(data: LegacyReportData) {
  const rows = data.bookings.map(booking => `<tr><td>${escapeHtml(booking.booking_code)}</td><td>${escapeHtml(booking.customer_name)}</td><td>${escapeHtml(booking.reg_number)}</td><td>${escapeHtml(booking.service_type)}</td><td>${escapeHtml(booking.booking_date)}</td><td>${escapeHtml(booking.slot_start)}</td><td>${escapeHtml(booking.status)}</td></tr>`).join('')
  const html = `
    <div class="metrics-grid">
      <div class="metric-card"><div class="metric-label">Active customers</div><div class="metric-val">${data.summary.activeCustomers}</div></div>
      <div class="metric-card"><div class="metric-label">Registered vehicles</div><div class="metric-val">${data.summary.registeredVehicles}</div></div>
      <div class="metric-card"><div class="metric-label">Bookings today</div><div class="metric-val">${data.summary.bookingsToday.total}</div></div>
      <div class="metric-card"><div class="metric-label">Active staff</div><div class="metric-val">${data.summary.activeStaff}</div></div>
      <div class="metric-card"><div class="metric-label">Services completed</div><div class="metric-val">${data.summary.servicesCompletedMonth}</div></div>
      <div class="metric-card"><div class="metric-label">Reminders tracked</div><div class="metric-val">${data.summary.remindersCount}</div></div>
    </div>
    <div class="section">
      <div class="section-header"><h2 class="section-title">Bookings</h2></div>
      <table><thead><tr><th>Code</th><th>Customer</th><th>Vehicle</th><th>Service</th><th>Date</th><th>Slot</th><th>Status</th></tr></thead><tbody>${rows || '<tr><td colspan="7">No bookings found.</td></tr>'}</tbody></table>
    </div>
    <div class="section">
      <div class="section-header"><h2 class="section-title">Monthly Activity</h2></div>
      <table><thead><tr><th>Day</th><th>Bookings</th><th>Services completed</th></tr></thead><tbody>${data.summary.monthlyBookingTrend.map(item => `<tr><td>${item.day}</td><td>${item.bookings}</td><td>${item.services}</td></tr>`).join('')}</tbody></table>
    </div>
  `
  openPrintPopup(data.title, html)
}
