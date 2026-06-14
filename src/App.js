import './App.css'
import InterestPopup from './Interest/InterestPopup'
import Navbar from './components/Navbar'
import Poster from './components/Poster'
import Searchbar from './components/Searchbar'
import Products from './components/Products'
import Cart from './components/Cart'
import CartBuy from './components/CartBuy'
import ProductView from './components/ProductView'
import ProductBuy from './components/ProductBuy'
import Team from './team/Team'
import Profile from './auth/profile/Profile'
import NewArrivals from './new-arrivals/NewArrivals'
import MenPage from './men/MenPage'
import WomenPage from './women/WomenPage'
import CollectionsPage from './collections/CollectionsPage'
import KidsPage from './kids/KidsPage'
import SearchResults from './search/SearchResults'
import { getStoredKiwiUser, hasMissingInterests, KIWI_USER_UPDATED_EVENT } from './utils/kiwiUser'

// Activities
import ActivityPage from './Activities/activity'

import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const HOME_SCROLL_KEY = "kiwi-home-scroll-state"

function Home() {
  const location = useLocation()
  const navigate = useNavigate()

  const params = new URLSearchParams(location.search)
  let user = params.get("user")

  useEffect(() => {
    if (!user) {
      const isMobile = window.innerWidth < 768
      const detectedUser = isMobile ? "mobile" : "desktop"

      navigate(`/home?user=${detectedUser}`, { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    const storedScrollState = sessionStorage.getItem(HOME_SCROLL_KEY)
    const parsedStoredState = storedScrollState ? JSON.parse(storedScrollState) : null
    const restoreScrollY = typeof location.state?.restoreScrollY === "number"
      ? location.state.restoreScrollY
      : parsedStoredState?.from === `${location.pathname}${location.search}`
        ? parsedStoredState.scrollY
        : null

    if (typeof restoreScrollY !== "number") {
      return
    }

    const timeout = window.setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo(0, restoreScrollY)
          document.documentElement.scrollTop = restoreScrollY
          document.body.scrollTop = restoreScrollY
          sessionStorage.removeItem(HOME_SCROLL_KEY)
          navigate(`${location.pathname}${location.search}`, { replace: true })
        })
      })
    }, 60)

    return () => window.clearTimeout(timeout)
  }, [location, navigate])

  if (!user) return null

  return (
    <div className="App">
      <Navbar />
      <Searchbar user={user} />
      <Poster user={user} />
      <Products user={user} />
    </div>
  )
}

function App() {
  const [user, setUser] = useState(() => getStoredKiwiUser())
  const [showInterest, setShowInterest] = useState(() => hasMissingInterests(getStoredKiwiUser()))

  useEffect(() => {
    const syncUser = () => {
      const nextUser = getStoredKiwiUser()
      setUser(nextUser)
      setShowInterest(hasMissingInterests(nextUser))
    }

    window.addEventListener(KIWI_USER_UPDATED_EVENT, syncUser)
    window.addEventListener("storage", syncUser)

    return () => {
      window.removeEventListener(KIWI_USER_UPDATED_EVENT, syncUser)
      window.removeEventListener("storage", syncUser)
    }
  }, [])

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/home" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/cart/buy" element={<CartBuy />} />
        <Route path="/product/:productId" element={<ProductView />} />
        <Route path="/product/:productId/buy" element={<ProductBuy />} />
        <Route path="/new-arrivals" element={<NewArrivals />} />
        <Route path="/men" element={<MenPage />} />
        <Route path="/women" element={<WomenPage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/kids" element={<KidsPage />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/team" element={<Team />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/activities" element={<ActivityPage />} />
      </Routes>

      {user && showInterest && (
        <InterestPopup
          user={user}
          open={showInterest}
          setOpen={setShowInterest}
        />
      )}
    </>
  )
}

export default App
