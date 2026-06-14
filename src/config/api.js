export const BACKEND_BASE_URL = (
  process.env.REACT_APP_BACKEND_URL || "http://localhost:8080"
).replace(/\/$/, "")

export const backendUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`

  return `${BACKEND_BASE_URL}${normalizedPath}`
}
