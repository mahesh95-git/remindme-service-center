export type BookingStatus = 'Confirmed' | 'In progress' | 'Completed'
export type ReminderTone = 'rose' | 'amber' | 'blue' | 'green'

export interface Booking {
  id: string
  customer: string
  vehicle: string
  service: string
  date: string
  time: string
  status: BookingStatus
  avatar: string
}

export interface Reminder {
  label: string
  customer: string
  vehicle: string
  due: string
  tone: ReminderTone
  icon: string
}
