import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Lithuanian phone number validation and formatting
 * Supports formats:
 * - +370 XXX XXXXX (international)
 * - +370XXXXXXXX (international, no spaces)
 * - 8 XXX XXXXX (local with 8 prefix)
 * - 8XXXXXXXX (local, no spaces)
 */
const LT_PHONE_REGEX = /^(\+370|8)\s?[0-9]{3}\s?[0-9]{5}$/

export function isValidLithuanianPhone(phone: string): boolean {
  if (!phone || phone.trim() === '') return true // Allow empty (optional field)
  const cleaned = phone.replace(/[\s\-\(\)]/g, ' ').replace(/\s+/g, ' ').trim()
  return LT_PHONE_REGEX.test(cleaned.replace(/\s/g, '').length === 12 || cleaned.replace(/\s/g, '').length === 9 ? cleaned : '') ||
         /^(\+370|8)[0-9]{8}$/.test(cleaned.replace(/\s/g, ''))
}

export function formatLithuanianPhone(phone: string): string {
  if (!phone) return ''
  // Remove all non-digit characters except +
  const digits = phone.replace(/[^\d+]/g, '')

  // Convert local format (8...) to international (+370...)
  let normalized = digits
  if (digits.startsWith('8') && digits.length === 9) {
    normalized = '+370' + digits.slice(1)
  }

  // Format as +370 XXX XXXXX
  if (normalized.startsWith('+370') && normalized.length === 12) {
    return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`
  }

  return phone // Return original if can't format
}

export function validateLithuanianPhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || phone.trim() === '') {
    return { valid: true } // Optional field
  }

  const cleaned = phone.replace(/[^\d+]/g, '')

  // Check for valid Lithuanian formats
  const isInternational = cleaned.startsWith('+370') && cleaned.length === 12
  const isLocal = cleaned.startsWith('8') && cleaned.length === 9

  if (!isInternational && !isLocal) {
    if (cleaned.startsWith('+') && !cleaned.startsWith('+370')) {
      return { valid: false, error: 'Only Lithuanian numbers (+370) are supported' }
    }
    if (cleaned.length < 9) {
      return { valid: false, error: 'Phone number is too short' }
    }
    if (cleaned.length > 12) {
      return { valid: false, error: 'Phone number is too long' }
    }
    return { valid: false, error: 'Invalid format. Use +370 XXX XXXXX or 8 XXX XXXXX' }
  }

  return { valid: true }
}
