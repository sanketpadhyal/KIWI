import { ArrowRight, Keyboard, KeyRound, LogOut, ShoppingBag, Sparkles, UserRound } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { FiChevronRight, FiMenu, FiSearch, FiShoppingCart, FiUser, FiUsers, FiX } from "react-icons/fi"
import { useLocation, useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../firebase"
import LoginPopup from "../auth/LoginPopup"
import { clearStoredKiwiUser, getStoredKiwiUser, KIWI_USER_UPDATED_EVENT } from "../utils/kiwiUser"
import "./Navbar.css"

const LOGO_CACHE_KEY = "zenty-logo-loaded"
const NAME_CACHE_KEY = "zenty-name-loaded"
const CART_UPDATED_EVENT = "kiwi-cart-updated"

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [active, setActive] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openLogin, setOpenLogin] = useState(false)
  const [openProfile, setOpenProfile] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [user, setUser] = useState(null)
  const [cartCount, setCartCount] = useState(0)
  const [logoLoaded, setLogoLoaded] = useState(() => localStorage.getItem(LOGO_CACHE_KEY) === "true")
  const [nameLoaded, setNameLoaded] = useState(() => localStorage.getItem(NAME_CACHE_KEY) === "true")
  const [searchShortcut, setSearchShortcut] = useState("Ctrl + K")
  const searchInputRef = useRef(null)
  const scrollPositionRef = useRef(0)
  const profileWrapperRef = useRef(null)
  const links = ["New arrivals", "Men", "Women", "Kids", "Collections", "Team"]
  const expandableLinks = ["New arrivals", "Men", "Women", "Kids", "Collections"]
  const plainLinkIcons = {
    Team: <FiUsers size={14} />
  }
  const getDropdownItems = (section) => section === "Men"
    ? [
        { label: "Hoddie", image: "/men/hoddie.png" },
        { label: "Jeans", image: "/men/jeans.png" },
        { label: "Shoes", image: "/men/shoes.png" }
      ]
    : section === "New arrivals"
      ? [
          { label: "Essentials", image: "/arrival/essential.png" },
          { label: "Premium layers", image: "/arrival/layers.png" },
          { label: "Perfumes drops", image: "/arrival/perfumes.png" }
        ]
      : section === "Women"
        ? [
            { label: "Skirt", image: "/women/skirt.png" },
            { label: "Sarees", image: "/women/saree.png" },
            { label: "Heels", image: "/women/heels.png" }
          ]
      : section === "Kids"
          ? [
              { label: "T-Shirts", image: "/kids/tshirt.png" },
              { label: "Shorts", image: "/kids/shorts.png" },
              { label: "Sneakers", image: "/kids/shoes.png" }
            ]
        : section === "Collections"
          ? [
              { label: "Watches", image: "/collection/watch.png" },
              { label: "Accessories", image: "/collection/acce.png" },
              { label: "Laptop", image: "/collection/laptop.png"}
            ]
      : [
          { label: "Modern essentials" },
          { label: "Premium layers" },
          { label: "Perfumes drops" }
        ]
  const getSectionDescription = (section) => {
    const descriptions = {
      "New arrivals": "Discover fresh drops, trending essentials, and standout new-season picks.",
      Men: "Explore refined menswear, everyday denim, and clean modern footwear.",
      Women: "Browse elegant skirts, timeless sarees, and elevated statement styles.",
      Kids: "Find comfortable kidswear, playful essentials, and easy everyday outfits.",
      Collections: "Shop curated edits, premium releases, and signature seasonal selections."
    }

    return descriptions[section] || "Explore curated styles and premium essentials designed for a smooth shopping experience."
  }
  const dropdownItems = getDropdownItems(active)
  const toggleItem = (item) => {
    if (!expandableLinks.includes(item)) {
      if (item === "Team") {
        navigate("/team")
        closeMenu()
      }

      setActive(null)
      return
    }

    setActive(active === item ? null : item)
  }

  const handleSectionExplore = (section) => {
    if (section === "New arrivals") {
      navigate("/new-arrivals")
      closeMenu()
      return
    }

    if (section === "Men") {
      navigate("/men")
      closeMenu()
      return
    }

    if (section === "Women") {
      navigate("/women")
      closeMenu()
      return
    }

    if (section === "Collections") {
      navigate("/collections")
      closeMenu()
      return
    }

    if (section === "Kids") {
      navigate("/kids")
      closeMenu()
      return
    }

    closeMenu()
  }

  useEffect(() => {
    if (menuOpen) {
      scrollPositionRef.current = window.scrollY
      document.documentElement.classList.add("menu-open")
      document.body.classList.add("menu-open")
      document.body.style.top = `-${scrollPositionRef.current}px`
    } else {
      document.documentElement.classList.remove("menu-open")
      document.body.classList.remove("menu-open")
      document.body.style.top = ""
      window.scrollTo(0, scrollPositionRef.current)
    }

    return () => {
      document.documentElement.classList.remove("menu-open")
      document.body.classList.remove("menu-open")
      document.body.style.top = ""
    }
  }, [menuOpen])

  useEffect(() => {
    const platform = window.navigator.platform.toLowerCase()
    setSearchShortcut(platform.includes("mac") ? "Cmd + K" : "Ctrl + K")
  }, [])

  useEffect(() => {
    const syncUser = () => {
      const storedUser = getStoredKiwiUser()
      setUser(storedUser)
    }

    syncUser()
    window.addEventListener(KIWI_USER_UPDATED_EVENT, syncUser)
    window.addEventListener("storage", syncUser)

    return () => {
      window.removeEventListener(KIWI_USER_UPDATED_EVENT, syncUser)
      window.removeEventListener("storage", syncUser)
    }
  }, [])

  useEffect(() => {
    const syncCartCount = async () => {
      const currentUser = auth.currentUser

      if (!user?.uid || !currentUser || currentUser.uid !== user.uid) {
        setCartCount(0)
        return
      }

      try {
        const userRef = doc(db, "users", user.uid)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          const data = userSnap.data()
          setCartCount(Array.isArray(data.cart) ? data.cart.length : 0)
          return
        }
      } catch (error) {
        console.log(error)
      }

      setCartCount(0)
    }

    syncCartCount()
  }, [user, location.pathname])

  useEffect(() => {
    const handleCartUpdated = (event) => {
      const nextCount = event.detail?.count

      if (typeof nextCount === "number") {
        setCartCount(nextCount)
      }
    }

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated)

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated)
    }
  }, [])

  useEffect(() => {
    if (!searchOpen) {
      return
    }

    const timeout = window.setTimeout(() => {
      searchInputRef.current?.focus()
    }, 10)

    return () => window.clearTimeout(timeout)
  }, [searchOpen])

  useEffect(() => {
    if (!openProfile) {
      return
    }

    const handlePointerDown = (event) => {
      if (!profileWrapperRef.current?.contains(event.target)) {
        setOpenProfile(false)
      }
    }

    window.addEventListener("mousedown", handlePointerDown)
    window.addEventListener("touchstart", handlePointerDown)

    return () => {
      window.removeEventListener("mousedown", handlePointerDown)
      window.removeEventListener("touchstart", handlePointerDown)
    }
  }, [openProfile])

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isMac = window.navigator.platform.toLowerCase().includes("mac")
      const isShortcut = event.key.toLowerCase() === "k" && (isMac ? event.metaKey : event.ctrlKey)

      if (!isShortcut) {
        return
      }

      event.preventDefault()
      setSearchOpen(true)
      setActive(null)
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const handleLogoLoad = () => {
    setLogoLoaded(true)
    localStorage.setItem(LOGO_CACHE_KEY, "true")
  }

  const handleNameLoad = () => {
    setNameLoaded(true)
    localStorage.setItem(NAME_CACHE_KEY, "true")
  }

  const closeMenu = () => {
    setMenuOpen(false)
    setActive(null)
    setOpenProfile(false)
  }

  const toggleDesktopSearch = () => {
    setSearchOpen((current) => !current)
    setActive(null)
    setOpenProfile(false)
  }

  const handleSearch = () => {
    const query = searchValue.trim()

    if (!query) {
      return
    }

    if (!user) {
      setOpenLogin(true)
      return
    }

    navigate(`/search?q=${encodeURIComponent(query)}`)
    setSearchOpen(false)
    setActive(null)
    setOpenProfile(false)
  }

  const handleAccountClick = () => {
    if (user) {
      setOpenProfile((current) => !current)
      setOpenLogin(false)
      return
    }

    setOpenProfile(false)
    setOpenLogin(true)
  }

  const handleProfileRoute = () => {
    closeMenu()
    setOpenLogin(false)
    setOpenProfile(false)
    navigate("/profile")
  }

  const handleCartRoute = () => {
    closeMenu()
    navigate("/cart")
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.log(error)
    }

    clearStoredKiwiUser()

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("firebase:")) {
        localStorage.removeItem(key)
      }
    })

    setCartCount(0)
  }

  const showDesktopSearchPrompt = searchOpen && searchValue.trim() && !user
  const isHomePage = location.pathname === "/home"
  const handleBrandClick = () => {
    if (isHomePage) {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      })
      return
    }

    navigate("/home")
  }

  return (
    <div className="navbar-wrapper">
      <div className="info-bar">
        <div className="info-track">
          <div className="info-marquee">
            <span><Sparkles size={12} strokeWidth={2.2} />Kiwi is a hackathon AdSync engine project built for smarter marketing.</span>
            <span><ShoppingBag size={12} strokeWidth={2.2} />This demo personalizes product discovery using user interests and audience signals.</span>
          </div>
          <div className="info-marquee" aria-hidden="true">
            <span><Sparkles size={12} strokeWidth={2.2} />Kiwi is a hackathon AdSync engine project built for smarter marketing.</span>
            <span><ShoppingBag size={12} strokeWidth={2.2} />This demo personalizes product discovery using user interests and audience signals.</span>
          </div>
        </div>
      </div>

      <div className="navbar">
        <div className="nav-left">
          <button
            type="button"
            className={`brand ${isHomePage ? "brand-static" : "brand-link"}`}
            onClick={handleBrandClick}
            aria-label="Go to home"
          >
            <div className={`brand-media logo-shell ${logoLoaded ? "loaded" : ""}`}>
              <span className="brand-skeleton" aria-hidden="true" />
              <img
                src="/assets/logo.png"
                alt="Zenty logo"
                className="logo"
                onLoad={handleLogoLoad}
              />
            </div>
            <div className={`brand-media brand-name-shell ${nameLoaded ? "loaded" : ""}`}>
              <span className="brand-skeleton" aria-hidden="true" />
              <img
                src="/assets/name.png"
                alt="Zenty name"
                className="brand-name-image"
                onLoad={handleNameLoad}
              />
            </div>
          </button>

          <div className={`nav-links-shell ${searchOpen ? "search-open" : ""}`}>
            <div className="nav-search">
              <FiSearch size={16} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products, collections, and more"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearch()
                  }
                }}
              />
              {searchValue && user ? (
                <button type="button" className="nav-search-action" aria-label="Search now" onClick={handleSearch}>
                  <FiSearch size={15} />
                </button>
              ) : (
                <span className="nav-search-shortcut" aria-hidden="true">
                  <Keyboard size={13} strokeWidth={2.1} />
                  <span>{searchShortcut}</span>
                </span>
              )}
            </div>

            {showDesktopSearchPrompt && (
              <div className="nav-search-login-prompt">
                <div className="nav-search-login-icon">
                  <KeyRound size={14} strokeWidth={2.4} />
                </div>
                <div className="nav-search-login-copy">
                  <strong>Sign in to search smarter with Kiwi</strong>
                  <p>Save your account, explore faster, and unlock a smoother shopping experience.</p>
                </div>
                <button type="button" className="nav-search-login-action" aria-label="Open login" onClick={() => setOpenLogin(true)}>
                  <ArrowRight size={15} strokeWidth={2.5} />
                </button>
              </div>
            )}

            <div className="nav-links">
            {links.map((item) => (
              <button
                type="button"
                key={item}
                className={`nav-link-button ${active === item ? "active" : ""} ${expandableLinks.includes(item) ? "" : "plain"}`}
                onClick={() => toggleItem(item)}
              >
                {!expandableLinks.includes(item) && plainLinkIcons[item]}
                <span>{item}</span>
                {expandableLinks.includes(item) && <FiChevronRight size={14} />}
              </button>
            ))}
            </div>
          </div>
        </div>

        <div className="nav-right">
          <button
            type="button"
            className={`icon-button desktop-search-toggle ${searchOpen ? "active-search" : ""}`}
            aria-label={searchOpen ? "Close search" : "Search"}
            onClick={toggleDesktopSearch}
          >
            {searchOpen ? <FiX size={18} /> : <FiSearch size={18} />}
          </button>
          <div className="profile-wrapper" ref={profileWrapperRef}>
            <button type="button" className="icon-button profile-trigger" aria-label="Account" onClick={handleAccountClick}>
              {user?.photo ? (
                <img src={user.photo} alt={user.name || "Account"} className="profile-pic" />
              ) : (
                <FiUser size={18} />
              )}
            </button>

            {openProfile && user && (
              <div className="profile-dropdown">
                <p className="profile-name">{user.name}</p>
                <p className="profile-email">{user.email}</p>
                <button type="button" className="profile-action-button" onClick={handleProfileRoute}>
                  <span className="profile-action-icon">
                    <UserRound size={15} strokeWidth={2.2} />
                  </span>
                  <span className="profile-action-copy">
                    <span>My Profile</span>
                    <small>Manage your account details</small>
                  </span>
                </button>
                <button type="button" className="profile-action-button logout" onClick={handleLogout}>
                  <span className="profile-action-icon">
                    <LogOut size={15} strokeWidth={2.2} />
                  </span>
                  <span className="profile-action-copy">
                    <span>Logout</span>
                    <small>Sign out of your Kiwi account</small>
                  </span>
                </button>
              </div>
            )}
          </div>
          <button type="button" className="icon-button cart-button" aria-label="Cart" onClick={handleCartRoute}>
            <FiShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="cart-count-badge">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>
          <button
            type="button"
            className="menu-button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => {
              const nextMenuOpen = !menuOpen
              setMenuOpen(nextMenuOpen)
              setActive(nextMenuOpen ? "New arrivals" : null)
            }}
          >
            {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </div>

      {active && !menuOpen && (
        <div className="dropdown-banner">
          <div className="banner-content">
            <div className="banner-text">
              <span className="banner-eyebrow">Featured edit</span>
              <h3>{active}</h3>
              <p>{getSectionDescription(active)}</p>
              <button type="button" className="banner-button" onClick={() => handleSectionExplore(active)}>
                <ShoppingBag size={14} strokeWidth={2.2} />
                <span>{active === "New arrivals" ? "Explore" : "Shop Now"}</span>
              </button>
            </div>

            <div className="banner-grid">
              {dropdownItems.map((item, index) => (
                <div key={item.label} className="banner-card">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {item.image ? (
                    <img src={item.image} alt={item.label} className="banner-card-image" />
                  ) : (
                    <div className="banner-card-placeholder" />
                  )}
                  <strong>{item.label}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`mobile-menu-overlay ${menuOpen ? "open" : ""}`} onClick={closeMenu} />

      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <div className="mobile-menu-top">
          <div className="mobile-menu-heading">
            <span className="mobile-menu-label">Kiwi</span>
            <h3>Discover a more refined wardrobe.</h3>
          </div>
          <button type="button" className="mobile-close" aria-label="Close menu" onClick={closeMenu}>
            <FiX size={18} />
          </button>
        </div>

        <div className="mobile-nav-links">
          {links.map((item) => (
            <div
              key={item}
              className={`mobile-nav-item ${active === item ? "open" : ""} ${expandableLinks.includes(item) ? "" : "plain"}`}
            >
              <button type="button" className="mobile-nav-trigger" onClick={() => toggleItem(item)}>
                <div className="mobile-nav-copy">
                  <span className={expandableLinks.includes(item) ? "" : "mobile-nav-title-with-icon"}>
                    {!expandableLinks.includes(item) && plainLinkIcons[item]}
                    <span>{item}</span>
                  </span>
                  {expandableLinks.includes(item) && <small>Curated picks and seasonal highlights</small>}
                </div>
                {expandableLinks.includes(item) && <FiChevronRight size={18} />}
              </button>

              {expandableLinks.includes(item) && (
                <div className={`mobile-nav-panel ${active === item ? "open" : ""}`}>
                  <div className="mobile-nav-panel-inner">
                    <p>{getSectionDescription(item)}</p>
                    <div className="mobile-panel-grid">
                      {getDropdownItems(item).map((card) => (
                        <div key={`${item}-${card.label}`} className="mobile-panel-card">
                          {card.image ? (
                            <img src={card.image} alt={card.label} className="mobile-panel-image" />
                          ) : (
                            <div className="mobile-panel-placeholder" />
                          )}
                          <strong>{card.label}</strong>
                        </div>
                      ))}
                    </div>
                    <button type="button" className="mobile-shop-button" onClick={() => handleSectionExplore(item)}>
                      <ShoppingBag size={14} strokeWidth={2.2} />
                      <span>{item === "New arrivals" ? "Explore" : "Shop Now"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mobile-actions">
          <button
            type="button"
            className="mobile-action-button"
            onClick={() => {
              if (user) {
                handleProfileRoute()
                return
              }

              handleAccountClick()
            }}
          >
            {user?.photo ? (
              <img src={user.photo} alt={user.name || "Account"} className="mobile-profile-pic" />
            ) : (
              <FiUser size={17} />
            )}
            <div>
              <span>{user ? user.name : "Account"}</span>
              <small>{user ? "Profile, orders and sign out" : "Orders, profile and saved items"}</small>
            </div>
          </button>
        </div>
      </div>

      <LoginPopup open={openLogin} setOpen={setOpenLogin} />
    </div>
  )
}
