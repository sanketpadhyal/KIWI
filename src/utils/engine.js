import { backendUrl } from "../config/api"

export const ENGINE_URL = backendUrl("/engine")

export const pingEngine = async (userId) => {
  if (!userId) {
    return false
  }

  try {
    await fetch(ENGINE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId })
    })

    return true
  } catch (error) {
    console.log(error)
    return false
  }
}
