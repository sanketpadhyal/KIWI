import { ArrowLeft, ArrowRight, BadgePercent, ShieldCheck, ShoppingBag, Star } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { db } from "../firebase"
import { appendUserActivity } from "../utils/activity"
import { getStoredKiwiUser } from "../utils/kiwiUser"
import { pingEngine } from "../utils/engine"
import "../components/Products.css"
import "../new-arrivals/NewArrivals.css"

const normalizeValue = (value) => String(value || "").trim().toLowerCase()
const CLICK_COOLDOWN_MS = 2500

export default function KidsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadedImages, setLoadedImages] = useState({})
  const [openingProductId, setOpeningProductId] = useState(null)
  const clickCooldownRef = useRef({})

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"))
        const data = querySnapshot.docs
          .map((itemDoc) => ({
            id: itemDoc.id,
            ...itemDoc.data()
          }))
          .filter((item) => normalizeValue(item.category) === "kids")

        setProducts(data)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    setLoadedImages({})
  }, [products])

  return (
    <div className="new-arrivals-page">
      <Navbar />

      <section className="products-container new-arrivals-section">
        <div className="new-arrivals-shell">
          <div className="new-arrivals-topbar">
            <button type="button" className="new-arrivals-back" onClick={() => navigate("/home")}>
              <ArrowLeft size={15} strokeWidth={2.2} />
              Back to Home
            </button>
          </div>

          <div className="products-header">
            <div>
              <span className="products-eyebrow">Kids Edit</span>
              <h1 className="title">Kids</h1>
              <p className="products-tagline">
                Explore all kids items from the Kiwi catalog in one clean page, without any gender filtering.
              </p>
            </div>

            <div className="products-badge">
              <ShieldCheck size={15} />
              <span>Kids category only</span>
            </div>
          </div>

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
                            setLoadedImages((current) => current[item.id] ? current : {
                              ...current,
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
                          setLoadedImages((current) => ({
                            ...current,
                            [item.id]: true
                          }))
                        }}
                        onError={() => {
                          setLoadedImages((current) => ({
                            ...current,
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
                        {hasOffer ? `₹${item.offerPrice} (${Math.round(((item.price - item.offerPrice) / item.price) * 100)}% off)` : <span>No live offer</span>}
                      </div>

                      <div className="product-meta">
                        <span className="product-meta-note">Kids pick</span>
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
        </div>
      </section>
    </div>
  )
}
