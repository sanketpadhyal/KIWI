import { ArrowRight, KeyRound } from "lucide-react"
import { useEffect, useState } from "react"
import { FiSearch } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import LoginPopup from "../auth/LoginPopup"
import { getStoredKiwiUser, KIWI_USER_UPDATED_EVENT } from "../utils/kiwiUser"
import "./Searchbar.css"

export default function Searchbar() {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState("")
  const [openLogin, setOpenLogin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const showSearchPrompt = searchValue.trim() && !isLoggedIn

  const handleSearch = () => {
    const query = searchValue.trim()

    if (!query) {
      return
    }

    if (!isLoggedIn) {
      setOpenLogin(true)
      return
    }

    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

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
    <div className="mobile-searchbar-wrapper">
      <div className="mobile-searchbar">
        <FiSearch size={17} />
        <input
          type="text"
          placeholder="Search products, styles, and collections"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSearch()
            }
          }}
        />
        {searchValue && isLoggedIn && (
          <button type="button" className="mobile-searchbar-action" aria-label="Search now" onClick={handleSearch}>
            <FiSearch size={17} strokeWidth={3} />
          </button>
        )}
      </div>

      {!isLoggedIn && (
        <div className="mobile-signup-panel">
          <div className="mobile-signup-icon">
            <KeyRound size={15} strokeWidth={2.4} />
          </div>
          <p>{showSearchPrompt ? "Sign in to search smarter and build your interest feed with Kiwi" : "Login helps us build your interest feed for a smoother Kiwi experience"}</p>
          <button type="button" className="mobile-signup-action" aria-label="Go to signup" onClick={() => setOpenLogin(true)}>
            <ArrowRight size={15} strokeWidth={2.5} />
          </button>
        </div>
      )}

      <LoginPopup open={openLogin} setOpen={setOpenLogin} />
    </div>
  )
}
