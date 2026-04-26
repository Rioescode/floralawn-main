import DOMPurify from 'isomorphic-dompurify'

// Email validation
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

// Phone validation
export function validatePhone(phone) {
  const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{10,15}$/
  return phoneRegex.test(phone)
}

// Sanitize HTML content
export function sanitizeHtml(content) {
  if (typeof content !== 'string') return ''
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  })
}

// Sanitize text input
export function sanitizeText(text, maxLength = 1000) {
  if (typeof text !== 'string') return ''
  return text
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
}

// Validate and sanitize customer data
export function validateCustomerData(data) {
  const errors = []
  const sanitized = {}

  // Name validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters')
  } else {
    sanitized.name = sanitizeText(data.name, 100)
  }

  // Email validation
  if (data.email && !validateEmail(data.email)) {
    errors.push('Invalid email format')
  } else if (data.email) {
    sanitized.email = data.email.toLowerCase().trim()
  }

  // Phone validation
  if (data.phone && !validatePhone(data.phone)) {
    errors.push('Invalid phone number format')
  } else if (data.phone) {
    sanitized.phone = sanitizeText(data.phone, 20)
  }

  // Address validation
  if (data.address) {
    sanitized.address = sanitizeText(data.address, 200)
  }

  // Service type validation
  const validServiceTypes = ['lawn_mowing', 'lawn_care', 'landscaping', 'mulch_installation', 'spring_cleanup', 'fall_cleanup']
  if (data.service_type && !validServiceTypes.includes(data.service_type)) {
    errors.push('Invalid service type')
  } else {
    sanitized.service_type = data.service_type || 'lawn_mowing'
  }

  // Frequency validation
  const validFrequencies = ['weekly', 'bi_weekly', 'monthly', 'seasonal', 'one_time']
  if (data.frequency && !validFrequencies.includes(data.frequency)) {
    errors.push('Invalid frequency')
  } else {
    sanitized.frequency = data.frequency || 'weekly'
  }

  // Price validation
  if (data.price !== undefined) {
    const price = parseFloat(data.price)
    if (isNaN(price) || price < 0 || price > 10000) {
      errors.push('Price must be between $0 and $10,000')
    } else {
      sanitized.price = price
    }
  }

  // Status validation
  const validStatuses = ['active', 'pending', 'completed', 'cancelled']
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push('Invalid status')
  } else {
    sanitized.status = data.status || 'active'
  }

  // Notes validation
  if (data.notes) {
    sanitized.notes = sanitizeHtml(data.notes)
  }

  return { errors, sanitized }
}

// Validate file uploads
export function validateFileUpload(file, options = {}) {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
    maxFiles = 5
  } = options

  const errors = []

  if (!file) {
    errors.push('No file provided')
    return { errors }
  }

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`)
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type must be one of: ${allowedTypes.join(', ')}`)
  }

  // Check file name
  if (file.name.length > 255) {
    errors.push('File name too long')
  }

  return { errors }
}

// Rate limiting validation
export function validateRateLimit(ip, endpoint, requests = new Map()) {
  const key = `${ip}:${endpoint}`
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 10

  const requestData = requests.get(key) || { count: 0, resetTime: now + windowMs }

  if (now > requestData.resetTime) {
    requestData.count = 1
    requestData.resetTime = now + windowMs
  } else {
    requestData.count++
  }

  requests.set(key, requestData)

  if (requestData.count > maxRequests) {
    return {
      blocked: true,
      retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
    }
  }

  return { blocked: false }
}

// SQL injection prevention (for raw queries)
export function escapeSqlString(str) {
  if (typeof str !== 'string') return str
  return str.replace(/'/g, "''")
}

// XSS prevention
export function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
} 