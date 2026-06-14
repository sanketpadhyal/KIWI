import { ArrowLeft, ArrowRight, BadgePercent, Search, ShoppingBag, Star } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { useLocation, useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import LoginPopup from "../auth/LoginPopup"
import { db } from "../firebase"
import { getStoredKiwiUser, KIWI_USER_UPDATED_EVENT } from "../utils/kiwiUser"
import { appendUserActivity } from "../utils/activity"
import { pingEngine } from "../utils/engine"
import "../components/Products.css"
import "../new-arrivals/NewArrivals.css"
import "./SearchResults.css"

const normalizeValue = (value) => String(value || "").trim().toLowerCase()
const splitWords = (value) => normalizeValue(value).split(/\s+/).filter(Boolean)

const QUERY_ALIASES = {
  men: ["men", "man", "male", "mens", "boy", "boys"],
  women: ["women", "woman", "female", "womens", "girl", "girls", "ladies"],
  kids: ["kids", "kid", "children", "child", "junior", "boys", "girls"],
  clothing: ["clothing", "clothes", "wear", "apparel", "outfit", "fashion"],
  shoes: ["shoes", "shoe", "sneakers", "heels", "footwear"],
  accessories: ["accessories", "accessory"],
  tech: ["tech", "technology", "gadget", "gadgets", "laptop", "mouse", "keyboard", "iphone", "ipad", "tv", "electronics"],
  perfumes: ["perfume", "perfumes", "fragrance", "deo", "deodorant", "scent"],
  new_arrivals: ["new", "arrival", "arrivals", "latest", "fresh", "trending"]
}

const CATEGORY_ALIASES = {
  accessories: ["accessories", "accessory"],
  tech: ["tech", "technology", "electronics", "gadget", "gadgets"],
  shoes: ["shoes", "shoe", "footwear"],
  clothing: ["clothing", "clothes", "wear", "apparel", "fashion"],
  perfumes: ["perfume", "perfumes", "fragrance", "deo", "deodorant", "scent"],
  kids: ["kids", "kid", "children", "child", "junior"]
}

const CLICK_COOLDOWN_MS = 2500

const TERM_INTENTS = {
  skirt: { gender: "female", category: "clothing" },
  saree: { gender: "female", category: "clothing" },
  heels: { gender: "female", category: "shoes" },
  hoodie: { gender: "male", category: "clothing" },
  hoddie: { gender: "male", category: "clothing" },
  jeans: { category: "clothing" },
  tshirt: { category: "clothing" },
  "t-shirts": { category: "kids" },
  sneakers: { category: "shoes" },
  shoes: { category: "shoes" },
  perfume: { category: "perfumes" },
  perfumes: { category: "perfumes" },
  earbuds: { category: "accessories" },
  headphones: { category: "accessories" },
  watch: { category: "accessories" },
  watches: { category: "accessories" },
  laptop: { category: "tech" },
  keyboard: { category: "tech" },
  mouse: { category: "tech" },
  kids: { category: "kids" }
}

const expandQueryTokens = (query) => {
  const baseTokens = splitWords(query)
  const expandedTokens = new Set(baseTokens)

  Object.values(QUERY_ALIASES).forEach((aliases) => {
    if (aliases.some((alias) => baseTokens.includes(alias))) {
      aliases.forEach((alias) => expandedTokens.add(alias))
    }
  })

  return [...expandedTokens]
}

const inferQueryIntent = (query) => {
  const tokens = splitWords(query)

  return tokens.reduce((intent, token) => {
    const nextIntent = TERM_INTENTS[token]

    if (!nextIntent) {
      return intent
    }

    return {
      gender: intent.gender || nextIntent.gender || null,
      category: intent.category || nextIntent.category || null
    }
  }, { gender: null, category: null })
}

const getAudienceSignals = (item) => {
  const gender = normalizeValue(item.gender)
  const category = normalizeValue(item.category)
  const signals = []

  if (["male", "men"].includes(gender)) {
    signals.push("men", "male", "mens")
  }

  if (["female", "women"].includes(gender)) {
    signals.push("women", "female", "womens", "ladies")
  }

  if (["both", "all", "unisex"].includes(gender)) {
    signals.push("unisex", "all")
  }

  if (category === "kids") {
    signals.push("kids", "kid", "children", "junior")
  }

  return signals
}

const getCategorySignals = (item) => {
  const category = normalizeValue(item.category)
  return [...new Set([category, ...(CATEGORY_ALIASES[category] || [])])]
}

const matchesIntentConstraints = (item, intent) => {
  const itemGender = normalizeValue(item.gender)
  const itemCategory = normalizeValue(item.category)

  if (intent.gender) {
    const genderAllowed = [intent.gender, "both", "all", "unisex"].includes(itemGender)

    if (!genderAllowed) {
      return false
    }
  }

  if (intent.category && itemCategory !== intent.category) {
    return false
  }

  return true
}

const getSearchScore = (item, query) => {
  const normalizedQuery = normalizeValue(query)

  if (!normalizedQuery) {
    return 0
  }

  const name = normalizeValue(item.name)
  const nameTokens = splitWords(item.name)
  const category = normalizeValue(item.category)
  const gender = normalizeValue(item.gender)
  const queryTokens = expandQueryTokens(query)
  const queryIntent = inferQueryIntent(query)
  const audienceSignals = getAudienceSignals(item)
  const categorySignals = getCategorySignals(item)

  if (!matchesIntentConstraints(item, queryIntent)) {
    return 0
  }

  let score = 0

  if (name === normalizedQuery) score += 140
  if (category === normalizedQuery) score += 120
  if (gender === normalizedQuery) score += 90

  if (name.includes(normalizedQuery)) score += 70
  if (category.includes(normalizedQuery)) score += 55
  if (gender.includes(normalizedQuery)) score += 35

  queryTokens.forEach((token) => {
    if (name.startsWith(token)) score += 24
    if (nameTokens.includes(token)) score += 26
    if (name.includes(token)) score += 16
    if (categorySignals.includes(token)) score += 10
    if (audienceSignals.includes(token)) score += 20
    if (gender === token) score += 18
  })

  if (queryIntent.gender && [queryIntent.gender, "both", "all", "unisex"].includes(gender)) {
    score += 16
  }

  if (queryIntent.category && category === queryIntent.category) {
    score += 18
  }

  return score
}

export default function SearchResults() {
  const navigate = useNavigate()
  const location = useLocation()
  const clickCooldownRef = useRef({})
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadedImages, setLoadedImages] = useState({})
  const [openingProductId, setOpeningProductId] = useState(null)
  const [openLogin, setOpenLogin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getStoredKiwiUser()))

  const searchParams = new URLSearchParams(location.search)
  const query = searchParams.get("q") || ""
  const normalizedQuery = normalizeValue(query)

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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"))
        const data = snapshot.docs.map((itemDoc) => ({
          id: itemDoc.id,
          ...itemDoc.data()
        }))

        setProducts(data)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    setLoadedImages({})
  }, [products, normalizedQuery])

  const filteredProducts = useMemo(() => {
    if (!normalizedQuery) {
      return []
    }

    return products
      .map((item) => ({
        ...item,
        searchScore: getSearchScore(item, query)
      }))
      .filter((item) => item.searchScore > 0)
      .sort((first, second) => {
        if (second.searchScore !== first.searchScore) {
          return second.searchScore - first.searchScore
        }

        return normalizeValue(first.name).localeCompare(normalizeValue(second.name))
      })
  }, [normalizedQuery, products, query])

  return (
    <div className="new-arrivals-page">
      <Navbar />
      <LoginPopup open={openLogin} setOpen={setOpenLogin} />

      <section className="products-container new-arrivals-section">
        <div className="new-arrivals-shell">
          <div className="new-arrivals-topbar search-results-topbar">
            <button type="button" className="new-arrivals-back" onClick={() => navigate("/home")}>
              <ArrowLeft size={15} strokeWidth={2.2} />
              Back to Home
            </button>
          </div>

          <div className="products-header">
            <div className="products-header-copy">
              <span className="products-eyebrow">Search Results</span>
              <h1 className="title">Search</h1>
              <p className="products-tagline">
                {normalizedQuery
                  ? `Showing products matching "${query}".`
                  : "Search for products, categories, or styles across Kiwi."}
              </p>
            </div>

            <div className="products-header-actions">
              <div className="products-badge">
                <Search size={15} />
                <span>{filteredProducts.length} matches</span>
              </div>
            </div>
          </div>

          {!isLoggedIn && (
            <div className="search-results-locked">
              <span className="search-results-kicker">Login required</span>
              <h2>Sign in to use search</h2>
              <p>Search is available for signed-in users so Kiwi can personalize results and recommendations better.</p>
              <button type="button" className="search-results-login" onClick={() => setOpenLogin(true)}>
                Login / Signup
              </button>
            </div>
          )}

          {isLoggedIn && !loading && !normalizedQuery && (
            <div className="search-results-empty">
              <h2>Start typing to search</h2>
              <p>Use the search bar to look for products by name, category, or audience.</p>
            </div>
          )}

          {isLoggedIn && !loading && normalizedQuery && filteredProducts.length === 0 && (
            <div className="search-results-empty">
              <h2>No results found</h2>
              <p>Try a different product name, category, or simpler keyword.</p>
            </div>
          )}

          {isLoggedIn && (
            <div className="products-grid">
              {loading &&
                Array.from({ length: 10 }).map((_, index) => (
                  <div className="product-card skeleton" key={index}>
                    <div className="product-image skeleton-box"></div>
                    <div className="product-info">
                      <div className="skeleton-line short"></div>
                      <div className="skeleton-line"></div>
                      <div className="skeleton-line"></div>
                      <div className="skeleton-line small"></div>
                    </div>
                  </div>
                ))}

              {!loading &&
                filteredProducts.map((item) => {
                  const hasOffer = item.offerPrice && item.offerPrice < item.price

                  return (
                    <div className="product-card" key={item.id}>
                      <div className="product-image">
                        {!loadedImages[item.id] && <div className="product-image-skeleton" aria-hidden="true"></div>}
                        <img
                          ref={(node) => {
                            if (node?.complete) {
                              setLoadedImages((prev) => prev[item.id] ? prev : {
                                ...prev,
                                [item.id]: true
                              })
                            }
                          }}
                          src={item.image}
                          alt={item.name}
                          className={loadedImages[item.id] ? "loaded" : ""}
                          loading="lazy"
                          decoding="async"
                          onLoad={() => {
                            setLoadedImages((prev) => ({
                              ...prev,
                              [item.id]: true
                            }))
                          }}
                          onError={() => {
                            setLoadedImages((prev) => ({
                              ...prev,
                              [item.id]: true
                            }))
                          }}
                        />

                        {hasOffer && (
                          <span className="product-chip">
                            <BadgePercent size={13} />
                            <span>Offer live</span>
                          </span>
                        )}

                        <span className="product-rating-badge">
                          <Star size={13} />
                          <span>{item.rating}</span>
                        </span>
                      </div>

                      <div className="product-info">
                        <p className="product-category">{item.category}</p>
                        <p className="product-name">{item.name}</p>

                        <div className="price">
                          <ShoppingBag size={14} />
                          ₹{item.price}
                        </div>

                        <div className={`offer ${hasOffer ? "" : "offer-empty"}`}>
                          {hasOffer ? (
                            <>
                              ₹{item.offerPrice} ({Math.round(((item.price - item.offerPrice) / item.price) * 100)}% off)
                            </>
                          ) : (
                            <span>No live offer</span>
                          )}
                        </div>

                        <div className="product-meta">
                          <span className="product-meta-note">Search match</span>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            const now = Date.now()
                            const lastClick = clickCooldownRef.current[item.id] || 0

                            if (now - lastClick < CLICK_COOLDOWN_MS) {
                              return
                            }

                            clickCooldownRef.current[item.id] = now

                            setOpeningProductId(item.id)

                            void (async () => {
                              try {
                                const activitySaved = await appendUserActivity("clicks", item.id, {
                                  lastActiveAt: now
                                })

                                if (activitySaved) {
                                  const user = getStoredKiwiUser()

                                  if (user?.uid) {
                                    pingEngine(user.uid)
                                  }
                                }
                              } catch (error) {
                                console.log(error)
                              }
                            })()

                            navigate(`/product/${item.id}`, {
                              state: {
                                productNavigationAt: Date.now()
                              }
                            })
                          }}
                          disabled={Boolean(openingProductId)}
                          aria-busy={openingProductId === item.id}
                          className={`product-view-button ${openingProductId === item.id ? "loading" : ""}`}
                        >
                          {openingProductId === item.id ? (
                            <span className="product-view-loading" aria-hidden="true">
                              <span></span>
                              <span></span>
                              <span></span>
                            </span>
                          ) : (
                            <>
                              View Product <ArrowRight size={14} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
