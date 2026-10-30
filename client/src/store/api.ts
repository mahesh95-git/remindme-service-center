import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api')

type ApiResponse<T> = {
  success?: boolean
  data: T
  message?: string
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: headers => {
    const token = localStorage.getItem('autocare-token')
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})

const baseQuery: typeof rawBaseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions)
  if (result.error) {
    if (result.error.status === 'FETCH_ERROR') {
      return { error: { status: 'CUSTOM_ERROR', error: `Cannot reach the API at ${API_URL}. Start the backend with npm run dev:server.` } }
    }
    return result
  }

  const body = result.data as ApiResponse<unknown>
  if (body.success === false) {
    return { error: { status: 'CUSTOM_ERROR', error: body.message ?? 'Request failed.' } }
  }
  return { data: body.data }
}

export type Booking = {
  id: number
  vehicle_id: number
  booking_code: string
  customer_name: string
  customer_phone: string
  customer_email?: string | null
  year?: number | null
  reg_number: string
  vehicle_name?: string
  make: string
  model: string
  service_type: string
  booking_date: string
  slot_start: string
  slot_end?: string
  contact_name?: string
  contact_phone?: string
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  invoice_id: number | null
  invoice_total: number | null
  invoice_status: 'PAID' | 'UNPAID' | null
  invoice_amount?: number | null
  invoice_tax?: number | null
  invoice_method?: string | null
  assigned_staff_id?: number | null
  assigned_staff_name?: string | null
  assigned_staff_role?: string | null
}

export type DashboardSummary = {
  registeredVehicles: number
  activeCustomers: number
  bookingsToday: { total: number; confirmed: number; completed: number }
  activeStaff: number
  remindersCount: number
  revenueThisMonth: number
  servicesCompletedMonth: number
  averageInvoice: number
  monthlyBookingTrend: { day: number; bookings: number; services: number }[]
}

export type ServiceActivity = {
  id: number
  service_type: string
  service_date: string
  cost: number
  reg_number: string
  make: string
  model: string
  customer_name: string
}
export type RevenueActivity = { total: number; invoice_count: number; trend: { date: string; total: number }[] }
export type DueCustomer = {
  id: number
  due_type: 'INSURANCE' | 'PUC' | 'WARRANTY' | 'SERVICE'
  due_date: string
  reg_number: string
  make: string
  model: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
}

export type RecordRow = Record<string, string | number | boolean | null | undefined>
export type Settings = {
  working_hours_start: string
  working_hours_end: string
  slot_duration_minutes: number
  max_bookings_per_slot: number
}
export type Vehicle = {
  id: number
  reg_number: string
  make: string
  model: string
  year: number | null
  last_service_date: string | null
  next_service_date: string | null
  insurance_expiry: string | null
  puc_expiry: string | null
  customer_id: number
  customer_name: string
  customer_phone: string
  customer_email: string | null
}
export type VehicleDetail = {
  id: number
  reg_number: string
  make: string
  model: string
  year: number | null
  purchase_date: string | null
  insurance_expiry: string | null
  puc_expiry: string | null
  warranty_expiry: string | null
  service_interval_days: number
  last_service_date: string | null
  next_service_date: string | null
  created_at: string
  updated_at: string
  customer: { id: number; name: string; phone: string; email: string | null; address: string | null }
  service_history: { id: number; service_type: string; service_date: string | null; cost: number; notes: string | null; created_at: string }[]
  bookings: { id: number; booking_code: string; booking_date: string | null; slot_start: string; slot_end: string; service_type: string; status: Booking['status']; invoice_photo_url: string | null; invoice: { id: number; total: number; payment_status: 'PAID' | 'UNPAID' } | null }[]
  reminders: { id: number; type: string; due_date: string | null; lead_days: number; channel: string; status: string; sent_at: string | null; error_message: string | null; created_at: string }[]
}
export type CustomerDetail = {
  id: number
  name: string
  phone: string
  email: string | null
  address: string | null
  createdAt: string
  vehicles_count: number
  vehicles: Array<{
    id: number
    regNumber: string
    make: string
    model: string
    year: number | null
    insuranceExpiry: string | null
    pucExpiry: string | null
    warrantyExpiry: string | null
    nextServiceDate: string | null
    serviceHistory: Array<{
      id: number
      serviceDate: string
      serviceType: string
      cost: number
      notes: string | null
    }>
  }>
}
export type Slot = { slot_start: string; slot_end: string; is_available: boolean; booked_count: number; max_capacity: number }
export type Confirmation = {
  booking_code: string
  booking_date: string
  slot_start: string
  service_type: string
  contact_name: string
  contact_phone: string
  vehicle_reg: string
  vehicle_name: string
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Bookings', 'Settings', 'Users', 'Customers', 'Vehicles', 'Reminders', 'Dashboard'],
  endpoints: builder => ({
    login: builder.mutation<{ token: string; user: { role: string } }, { email: string; password: string }>({
      query: body => ({ url: '/auth/login', method: 'POST', body }),
    }),
    forgotPassword: builder.mutation<{ message: string }, { email: string }>({
      query: body => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),
    resetPassword: builder.mutation<null, { token: string; password: string }>({
      query: body => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),
    bookings: builder.query<Booking[], { date?: string; status?: Booking['status']; search?: string } | void>({
      query: filters => {
        const params = new URLSearchParams()
        if (filters && filters.date) params.set('date', filters.date)
        if (filters && filters.status) params.set('status', filters.status)
        if (filters && filters.search) params.set('search', filters.search)
        const query = params.toString()
        return `/bookings${query ? `?${query}` : ''}`
      },
      providesTags: ['Bookings'],
    }),
    updateBookingStatus: builder.mutation<void, { bookingId: number; status: Booking['status'] }>({
      query: ({ bookingId, status }) => ({ url: `/bookings/${bookingId}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Bookings'],
    }),
    completeBooking: builder.mutation<{ id: number; status: 'COMPLETED'; invoice_photo_url: string; total_bill: number; email_sent: boolean; email_error?: string }, { bookingId: number; invoicePhotoUrl: string; nextServiceDate: string; totalBill: number }>({
      query: ({ bookingId, invoicePhotoUrl, nextServiceDate, totalBill }) => ({ url: `/bookings/${bookingId}/complete`, method: 'PATCH', body: { invoice_photo_url: invoicePhotoUrl, next_service_date: nextServiceDate, total_bill: totalBill } }),
      invalidatesTags: ['Bookings', 'Vehicles', 'Dashboard'],
    }),
    invoiceUploadSignature: builder.mutation<{ cloud_name: string; api_key: string; timestamp: number; folder: string; signature: string }, void>({
      query: () => ({ url: '/bookings/invoice-upload-signature', method: 'POST', body: {} }),
    }),
    assignBookingStaff: builder.mutation<{ id: number; assigned_staff_id: number | null; assigned_staff_name: string | null; assigned_staff_role: string | null }, { bookingId: number; staffId: number | null }>({
      query: ({ bookingId, staffId }) => ({ url: `/bookings/${bookingId}/assignee`, method: 'PATCH', body: { staff_id: staffId } }),
      invalidatesTags: ['Bookings'],
    }),
    rescheduleSlots: builder.query<{ date: string; slots: Slot[] }, { bookingId: number; date: string }>({
      query: ({ bookingId, date }) => `/bookings/${bookingId}/slots?date=${encodeURIComponent(date)}`,
    }),
    rescheduleBooking: builder.mutation<Booking, { bookingId: number; booking_date: string; slot_start: string }>({
      query: ({ bookingId, ...body }) => ({ url: `/bookings/${bookingId}/schedule`, method: 'PATCH', body }),
      invalidatesTags: ['Bookings'],
    }),
    createBooking: builder.mutation<Confirmation, Record<string, string>>({
      query: body => ({ url: '/bookings', method: 'POST', body }),
      invalidatesTags: ['Bookings'],
    }),
    createInvoice: builder.mutation<RecordRow, { booking_id: number; amount: number; tax: number; total: number; payment_status: 'PAID' | 'UNPAID'; payment_method: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'OTHER' | null }>({
      query: body => ({ url: '/invoices', method: 'POST', body }),
      invalidatesTags: ['Bookings', 'Dashboard', 'Vehicles'],
    }),
    dashboardSummary: builder.query<DashboardSummary, void>({ query: () => '/dashboard/summary', providesTags: ['Dashboard'] }),
    serviceActivity: builder.query<ServiceActivity[], { from: string; to: string }>({
      query: ({ from, to }) => `/dashboard/service-activity?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      providesTags: ['Dashboard'],
    }),
    revenueActivity: builder.query<RevenueActivity, { from: string; to: string }>({
      query: ({ from, to }) => `/dashboard/revenue-activity?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      providesTags: ['Dashboard'],
    }),
    duePeriod: builder.query<DueCustomer[], { from: string; to: string }>({
      query: ({ from, to }) => `/dashboard/due-period?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      providesTags: ['Dashboard'],
    }),
    reminders: builder.query<{ items: RecordRow[] }, void>({ query: () => '/reminders', providesTags: ['Reminders'] }),
    sendCustomReminder: builder.mutation<{ id: number; status: string; recipient: string; channel: string }, { vehicleId: number; reminderType: 'SERVICE' | 'INSURANCE' | 'PUC' | 'WARRANTY'; channel: 'EMAIL' | 'SMS' | 'WHATSAPP'; message: string }>({
      query: body => ({ url: '/reminders/manual', method: 'POST', body }),
      invalidatesTags: ['Reminders', 'Vehicles'],
    }),
    runReminders: builder.mutation<{ totalChecked: number; totalCreated: number; totalSent: number; totalFailed: number; totalSkipped: number }, void>({
      query: () => ({ url: '/reminders/run', method: 'POST', body: {} }),
      invalidatesTags: ['Reminders'],
    }),
    sendDuePeriodReminders: builder.mutation<{ total: number; sent: number; skipped: number; failed: number }, { from: string; to: string }>({
      query: body => ({ url: '/reminders/due-period', method: 'POST', body }),
      invalidatesTags: ['Reminders', 'Dashboard'],
    }),
    settings: builder.query<{ slotConfig: Settings }, void>({ query: () => '/settings', providesTags: ['Settings'] }),
    updateSettings: builder.mutation<Settings, Settings>({
      query: body => ({ url: '/settings', method: 'PUT', body }),
      invalidatesTags: ['Settings'],
    }),
    records: builder.query<RecordRow[], { path: string; search?: string }>({
      query: ({ path, search }) => `${path}${search ? `?search=${encodeURIComponent(search)}` : ''}`,
      providesTags: (_result, _error, arg) => arg.path === '/users' ? ['Users'] : arg.path === '/customers' ? ['Customers'] : arg.path === '/vehicles' ? ['Vehicles'] : [],
    }),
    customerDetail: builder.query<CustomerDetail, number>({
      query: id => `/customers/${id}`,
      providesTags: ['Customers'],
    }),
    deleteCustomer: builder.mutation<{ id: number }, number>({
      query: id => ({ url: `/customers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Customers'],
    }),
    updateCustomer: builder.mutation<RecordRow, { id: number; body: { name?: string; phone?: string; email?: string; address?: string } }>({
      query: ({ id, body }) => ({ url: `/customers/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Customers'],
    }),
    createVehicle: builder.mutation<RecordRow, { customer_id: number; reg_number: string; make: string; model: string; year?: number; purchase_date?: string; insurance_expiry?: string; puc_expiry?: string; warranty_expiry?: string; service_interval_days?: number; last_service_date?: string; next_service_date?: string }>({
      query: body => ({ url: '/vehicles', method: 'POST', body }),
      invalidatesTags: ['Vehicles', 'Customers'],
    }),
    deleteVehicle: builder.mutation<{ id: number }, number>({
      query: id => ({ url: `/vehicles/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Vehicles', 'Customers', 'Bookings', 'Reminders'],
    }),
    sendManualReminder: builder.mutation<{ id: number; status: string; recipient: string }, { vehicleId: number; reminder_type: 'SERVICE' | 'INSURANCE' | 'PUC' | 'WARRANTY' }>({
      query: ({ vehicleId, reminder_type }) => ({ url: `/vehicles/${vehicleId}/reminder`, method: 'POST', body: { reminder_type } }),
      invalidatesTags: ['Reminders', 'Vehicles'],
    }),
    registerVehicleWithCustomer: builder.mutation<RecordRow, { customer: { name: string; phone: string; email?: string; address?: string }; vehicle: { reg_number: string; make: string; model: string; year?: number; purchase_date?: string; insurance_expiry?: string; puc_expiry?: string; warranty_expiry?: string; service_interval_days: number; last_service_date?: string; next_service_date?: string } }>({
      query: body => ({ url: '/vehicles/register', method: 'POST', body }),
      invalidatesTags: ['Customers', 'Vehicles'],
    }),
    createStaff: builder.mutation<RecordRow, { name: string; email: string; password: string; role: 'ADMIN' | 'RECEPTIONIST' }>({
      query: body => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['Users', 'Dashboard'],
    }),
    updateStaff: builder.mutation<RecordRow, { id: number; body: { isActive: boolean } }>({
      query: ({ id, body }) => ({ url: `/users/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Users', 'Dashboard'],
    }),
    deleteStaff: builder.mutation<{ id: number }, number>({
      query: id => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Users', 'Dashboard'],
    }),
    services: builder.query<{ id: number; name: string }[], void>({ query: () => '/services' }),
    slots: builder.query<{ slots: Slot[] }, string>({ query: date => `/bookings/slots?date=${encodeURIComponent(date)}` }),
    vehicleLookup: builder.query<Vehicle, string>({ query: registration => `/vehicles/lookup/${encodeURIComponent(registration)}` }),
    vehicleDetail: builder.query<VehicleDetail, number>({ query: id => `/vehicles/${id}`, providesTags: ['Vehicles'] }),
    updateVehicle: builder.mutation<RecordRow, { id: number; body: { reg_number?: string; make?: string; model?: string; year?: number; purchase_date?: string | null; insurance_expiry?: string | null; puc_expiry?: string | null; warranty_expiry?: string | null; service_interval_days?: number; last_service_date?: string | null; next_service_date?: string | null } }>({
      query: ({ id, body }) => ({ url: `/vehicles/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Vehicles'],
    }),
  }),
})

export const {
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useBookingsQuery,
  useUpdateBookingStatusMutation,
  useCompleteBookingMutation,
  useInvoiceUploadSignatureMutation,
  useAssignBookingStaffMutation,
  useRescheduleSlotsQuery,
  useRescheduleBookingMutation,
  useCreateBookingMutation,
  useCreateInvoiceMutation,
  useDashboardSummaryQuery,
  useServiceActivityQuery,
  useRevenueActivityQuery,
  useDuePeriodQuery,
  useRemindersQuery,
  useSendCustomReminderMutation,
  useRunRemindersMutation,
  useSendDuePeriodRemindersMutation,
  useSettingsQuery,
  useUpdateSettingsMutation,
  useRecordsQuery,
  useCustomerDetailQuery,
  useDeleteCustomerMutation,
  useUpdateCustomerMutation,
  useCreateVehicleMutation,
  useDeleteVehicleMutation,
  useSendManualReminderMutation,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useRegisterVehicleWithCustomerMutation,
  useServicesQuery,
  useSlotsQuery,
  useLazyVehicleLookupQuery,
  useVehicleDetailQuery,
  useLazyVehicleDetailQuery,
  useUpdateVehicleMutation,
} = api
