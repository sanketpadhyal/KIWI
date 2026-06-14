export const KIWI_USER_UPDATED_EVENT = "kiwi-user-updated"

export const getStoredKiwiUser = () => {
  const stored = localStorage.getItem("kiwiUser")

  if (!stored) {
    return null
  }

  try {
    return JSON.parse(stored)
  } catch (error) {
    console.log(error)
    localStorage.removeItem("kiwiUser")
    return null
  }
}

export const hasMissingInterests = (user) => Boolean(user) && (!user.interestedIn || user.interestedIn.length === 0)

export const setStoredKiwiUser = (user) => {
  localStorage.setItem("kiwiUser", JSON.stringify(user))
  window.dispatchEvent(new CustomEvent(KIWI_USER_UPDATED_EVENT, { detail: user }))
}

export const clearStoredKiwiUser = () => {
  localStorage.removeItem("kiwiUser")
  window.dispatchEvent(new CustomEvent(KIWI_USER_UPDATED_EVENT, { detail: null }))
}
