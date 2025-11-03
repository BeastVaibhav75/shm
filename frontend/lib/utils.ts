import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isValid } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, formatStr: string = 'MMM dd, yyyy') {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return 'Invalid Date'
    return format(dateObj, formatStr)
  } catch (error) {
    return 'Invalid Date'
  }
}

export function formatDateTime(date: string | Date) {
  return formatDate(date, 'MMM dd, yyyy HH:mm')
}

export function formatTime(time: string) {
  try {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  } catch (error) {
    return time
  }
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function capitalizeFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function formatPhoneNumber(phone: string) {
  // Format Indian phone numbers
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }
  return phone
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'bg-success-100 text-success-800 border-success-200'
    case 'completed':
      return 'bg-primary-100 text-primary-800 border-primary-200'
    case 'cancelled':
      return 'bg-error-100 text-error-800 border-error-200'
    case 'rescheduled':
      return 'bg-warning-100 text-warning-800 border-warning-200'
    default:
      return 'bg-secondary-100 text-secondary-800 border-secondary-200'
  }
}

export function getRoleColor(role: string) {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'bg-error-100 text-error-800 border-error-200'
    case 'doctor':
      return 'bg-primary-100 text-primary-800 border-primary-200'
    case 'receptionist':
      return 'bg-success-100 text-success-800 border-success-200'
    default:
      return 'bg-secondary-100 text-secondary-800 border-secondary-200'
  }
}

export function getGenderColor(gender: string) {
  switch (gender.toLowerCase()) {
    case 'male':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'female':
      return 'bg-pink-100 text-pink-800 border-pink-200'
    case 'other':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    default:
      return 'bg-secondary-100 text-secondary-800 border-secondary-200'
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string) {
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone.replace(/\D/g, ''))
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
