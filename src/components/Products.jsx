import { ArrowRight, BadgePercent, Megaphone, Plus, ShieldCheck, ShoppingBag, Star } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { auth, db } from "../firebase"
import { addDoc, collection, getDocs, doc, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useLocation, useNavigate } from "react-router-dom"
import { getStoredKiwiUser, KIWI_USER_UPDATED_EVENT } from "../utils/kiwiUser"
import { appendUserActivity } from "../utils/activity"
import { pingEngine } from "../utils/engine"
import AdsPopup from "../ads/adspopup"
import "./Products.css"

const HOME_SCROLL_KEY = "kiwi-home-scroll-state"
const CLICK_COOLDOWN_MS = 2500

const normalizeValue = (value) => String(value || "").trim().toLowerCase()

const matchesGender = (productGender, userGender) => {
  const normalizedProductGender = normalizeValue(productGender)
  const normalizedUserGender = normalizeValue(userGender)

  if (!normalizedProductGender || !normalizedUserGender) {
    return true
  }

  if (["both", "all", "unisex"].includes(normalizedProductGender)) {
    return true
  }

  return normalizedProductGender === normalizedUserGender
}

export default function Products() {
  const navigate = useNavigate()
  const location = useLocation()
  const [allProducts, setAllProducts] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [authLoaded, setAuthLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showAdsPopup, setShowAdsPopup] = useState(false)
  const [user, setUser] = useState(null)
  const [loadedImages, setLoadedImages] = useState({})
  const [openingProductId, setOpeningProductId] = useState(null)
  const clickCooldownRef = useRef({})

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    gender: "",
    price: "",
    offerPrice: "",
    image: "",
    rating: ""
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          setUser({
            ...currentUser,
            ...userSnap.data()
          })
        } else {
          setUser(currentUser)
        }
      } else {
        setUser(null)
      }

      setAuthLoaded(true)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const syncUserPreferences = () => {
      const storedUser = getStoredKiwiUser()

      if (!storedUser) {
        return
      }

      setUser((current) => current ? { ...current, ...storedUser } : storedUser)
    }

    window.addEventListener(KIWI_USER_UPDATED_EVENT, syncUserPreferences)

    return () => {
      window.removeEventListener(KIWI_USER_UPDATED_EVENT, syncUserPreferences)
    }
  }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"))
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))
        setAllProducts(data)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    if (!user?.interestedIn?.length) {
      setProducts(allProducts)
      return
    }

    const selectedCategories = user.interestedIn.map((item) => normalizeValue(item))

    const filteredProducts = allProducts.filter((item) => {
      const categoryMatches = selectedCategories.includes(normalizeValue(item.category))
      const genderMatches = matchesGender(item.gender, user.gender)

      return categoryMatches && genderMatches
    })

    setProducts(filteredProducts.length > 0 ? filteredProducts : allProducts)
  }, [allProducts, user])

  useEffect(() => {
    setLoadedImages({})
  }, [products])

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.image) {
      return
    }

    try {
      const productData = {
        ...newProduct,
        price: Number(newProduct.price),
        offerPrice: newProduct.offerPrice ? Number(newProduct.offerPrice) : null,
        rating: Number(newProduct.rating)
      }

      await addDoc(collection(db, "products"), productData)

      setAllProducts((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...productData
        }
      ])

      setShowForm(false)

      setNewProduct({
        name: "",
        category: "",
        gender: "",
        price: "",
        offerPrice: "",
        image: "",
        rating: ""
      })
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <section className="products-container">

      <div className="products-header">
        <div className="products-header-copy">
          <span className="products-eyebrow">
            {user ? "Recommended for you" : "Explore Kiwi"}
          </span>

          <h2 className="title">
            {user ? "Products For You" : "Our Products"}
          </h2>

          {user && (
            <p className="products-tagline">
              Below items are shown based on your interests dynamically. You can clear your interests from your profile.
            </p>
          )}

          {!user && (
            <p className="products-tagline">
              A curated collection of essentials, fashion picks, and premium finds built for the Kiwi shopping experience.
            </p>
          )}

          {user && (
            <>
              <div className="products-ad-card">
                <button
                  type="button"
                  className="products-ad-button"
                  onClick={() => setShowAdsPopup(true)}
                >
                  <Megaphone size={15} strokeWidth={2.2} />
                  <span>Show Ad</span>
                </button>
                <p className="products-ad-copy">
                  Preview a behavior-based ad recommendation generated from your activity and product signals.
                </p>
              </div>

              <AdsPopup open={showAdsPopup} setOpen={setShowAdsPopup} />
            </>
          )}
        </div>

        <div className="products-header-actions">
          <div className="products-badge">
            <ShieldCheck size={15} />
            <span>Curated daily</span>
          </div>
        </div>

        {/* 🔥 ROLE BASED BUTTON */}
        {authLoaded && user?.role === "admin" && (
          <button
            type="button"
            className="add-product-btn"
            onClick={() => setShowForm(true)}
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="admin-form">
          <input placeholder="Name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
          <input placeholder="Category" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} />
          <input placeholder="Gender" value={newProduct.gender} onChange={(e) => setNewProduct({ ...newProduct, gender: e.target.value })} />
          <input placeholder="Price" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
          <input placeholder="Offer Price" value={newProduct.offerPrice} onChange={(e) => setNewProduct({ ...newProduct, offerPrice: e.target.value })} />
          <input placeholder="Image path" value={newProduct.image} onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })} />
          <input placeholder="Rating" value={newProduct.rating} onChange={(e) => setNewProduct({ ...newProduct, rating: e.target.value })} />

          <button className="admin-form-save" onClick={handleAddProduct}>
            Save
          </button>
        </div>
      )}

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
          products.map((item) => {
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
                    <span className="product-meta-note">Curated pick</span>
                  </div>

                  <button
                    type="button"
                    className="product-view-button"
                    onClick={async () => {
                      const now = Date.now()
                      const lastClick = clickCooldownRef.current[item.id] || 0

                      if (now - lastClick < CLICK_COOLDOWN_MS) {
                        return
                      }

                      clickCooldownRef.current[item.id] = now

                      const scrollState = {
                        from: `${location.pathname}${location.search}`,
                        scrollY: window.scrollY,
                        productNavigationAt: Date.now()
                      }

                      sessionStorage.setItem(HOME_SCROLL_KEY, JSON.stringify(scrollState))
                      setOpeningProductId(item.id)

                      void (async () => {
                        try {
                          const activitySaved = await appendUserActivity("clicks", item.id, {
                            lastActiveAt: now
                          })

                          if (activitySaved && user?.uid) {
                            pingEngine(user.uid)
                          }
                        } catch (error) {
                          console.log(error)
                        }
                      })()

                      navigate(`/product/${item.id}`, {
                        state: scrollState
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

    </section>
  )
}
