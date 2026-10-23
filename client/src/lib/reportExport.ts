import type { Booking, DashboardSummary } from '../store/api'

type ReportData = {
  title: string
  summary: DashboardSummary
  bookings: Booking[]
}

const escapeCsv = (value: unknown) => {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const reportRows = ({ summary, bookings }: ReportData) => [
  ['Metric', 'Value', 'Details'],
  ['Active customers', summary.activeCustomers, ''],
  ['Registered vehicles', summary.registeredVehicles, ''],
  ['Bookings today', summary.bookingsToday.total, `${summary.bookingsToday.confirmed} confirmed; ${summary.bookingsToday.completed} completed`],
  ['Active staff', summary.activeStaff, ''],
  ['Services completed', summary.servicesCompletedMonth, 'This month'],
  ['Reminders tracked', summary.remindersCount, 'Pending and sent'],
  [],
  ['Booking code', 'Customer', 'Vehicle', 'Service', 'Booking date', 'Slot', 'Status'],
  ...bookings.map(booking => [
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
  ...summary.monthlyBookingTrend.map(item => [item.day, item.bookings, item.services]),
]

export function exportReportSpreadsheet(data: ReportData) {
  const csv = reportRows(data).map(row => row.map(escapeCsv).join(',')).join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${data.title.toLowerCase().replaceAll(' ', '-')}-report.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function exportReportPdf(data: ReportData) {
  const popup = window.open('', '_blank', 'width=1000,height=800')
  if (!popup) {
    window.alert('Please allow pop-ups to export the report as PDF.')
    return
  }

  const rows = data.bookings.map(booking => `<tr><td>${booking.booking_code}</td><td>${booking.customer_name}</td><td>${booking.reg_number}</td><td>${booking.service_type}</td><td>${booking.booking_date}</td><td>${booking.slot_start}</td><td>${booking.status}</td></tr>`).join('')
  popup.document.write(`<!doctype html><html><head><title>${data.title}</title><style>
    body{font-family:Arial,sans-serif;color:#0f172a;padding:32px}h1{margin:0 0 4px}h2{margin:28px 0 10px;font-size:16px}.muted{color:#64748b;font-size:12px}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.metric{border:1px solid #e2e8f0;border-radius:8px;padding:12px}.label{color:#64748b;font-size:11px}.value{font-size:20px;font-weight:bold;margin-top:5px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border-bottom:1px solid #e2e8f0;padding:7px;text-align:left}th{color:#64748b;text-transform:uppercase;font-size:10px}@media print{button{display:none}}
  </style></head><body><h1>${data.title}</h1><p class="muted">Generated ${new Date().toLocaleString()}</p><div class="metrics">
    <div class="metric"><div class="label">Active customers</div><div class="value">${data.summary.activeCustomers}</div></div>
    <div class="metric"><div class="label">Registered vehicles</div><div class="value">${data.summary.registeredVehicles}</div></div>
    <div class="metric"><div class="label">Bookings today</div><div class="value">${data.summary.bookingsToday.total}</div></div>
    <div class="metric"><div class="label">Active staff</div><div class="value">${data.summary.activeStaff}</div></div>
    <div class="metric"><div class="label">Services completed</div><div class="value">${data.summary.servicesCompletedMonth}</div></div>
    <div class="metric"><div class="label">Reminders tracked</div><div class="value">${data.summary.remindersCount}</div></div>
  </div><h2>Bookings</h2><table><thead><tr><th>Code</th><th>Customer</th><th>Vehicle</th><th>Service</th><th>Date</th><th>Slot</th><th>Status</th></tr></thead><tbody>${rows || '<tr><td colspan="7">No bookings found.</td></tr>'}</tbody></table><h2>Monthly activity</h2><table><thead><tr><th>Day</th><th>Bookings</th><th>Services completed</th></tr></thead><tbody>${data.summary.monthlyBookingTrend.map(item => `<tr><td>${item.day}</td><td>${item.bookings}</td><td>${item.services}</td></tr>`).join('')}</tbody></table><button onclick="window.print()">Print / Save as PDF</button></body></html>`)
  popup.document.close()
  popup.focus()
}
