import { ArrowRight, KeyRound } from "lucide-react"
import { useEffect, useState } from "react"
import LoginPopup from "../auth/LoginPopup"
import { getStoredKiwiUser, KIWI_USER_UPDATED_EVENT } from "../utils/kiwiUser"
import "./Poster.css"

export default function Poster() {
  const [openLogin, setOpenLogin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const syncLoginState = () => {
      setIsLoggedIn(Boolean(getStoredKiwiUser()))
    }

    syncLoginState()
    window.addEventListener(KIWI_USER_UPDATED_EVENT, syncLoginState)
    window.addEventListener("storage", syncLoginState)

    return () => {
      window.removeEventListener(KIWI_USER_UPDATED_EVENT, syncLoginState)
      window.removeEventListener("storage", syncLoginState)
    }
  }, [])

  return (
    <div className="poster-container">
      <div className="poster-shell">
        <img
          src="/poster/poster.webp"
          alt="Kiwi Promo"
          className="poster-image"
        />

        {!isLoggedIn && (
          <div className="poster-signup-panel">
            <div className="poster-signup-icon">
              <KeyRound size={16} strokeWidth={2.4} />
            </div>
            <div className="poster-signup-copy">
              <strong>Login for a smoother Kiwi experience</strong>
              <p>Signing in helps us build your interest feed, save your profile details, and personalize your shopping flow.</p>
            </div>
            <button type="button" className="poster-signup-action" aria-label="Open sign up" onClick={() => setOpenLogin(true)}>
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      <LoginPopup open={openLogin} setOpen={setOpenLogin} />
    </div>
  )
}
