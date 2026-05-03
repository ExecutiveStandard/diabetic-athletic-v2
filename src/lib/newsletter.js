// src/lib/newsletter.js
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export const submitNewsletterSignup = async (email, source = 'unknown') => {
  try {
    if (!validateEmail(email)) {
      throw new Error('Invalid email address')
    }

    // TODO: Replace with Firebase Cloud Function call in Phase 2
    // For now, simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    return {
      success: true,
      message: 'Check your email for confirmation'
    }
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Something went wrong. Try again.'
    }
  }
}
