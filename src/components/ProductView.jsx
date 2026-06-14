import { ArrowLeft, BadgePercent, ShieldCheck, ShoppingBag, Star, Truck, WalletCards } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import Navbar from "./Navbar"
import { auth, db } from "../firebase"
import LoginPopup from "../auth/LoginPopup"
import Alert from "./Alert"
import { getStoredKiwiUser, KIWI_USER_UPDATED_EVENT } from "../utils/kiwiUser"
import { appendUserActivity } from "../utils/activity"
import { pingEngine } from "../utils/engine"
import "./ProductView.css"

const CART_UPDATED_EVENT = "kiwi-cart-updated"
const CLICK_COOLDOWN_MS = 2500

export default function ProductView() {
  const navigate = useNavigate()
  const location = useLocation()
  const { productId } = useParams()
  const productNavigationAt = location.state?.productNavigationAt || location.key
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [openLogin, setOpenLogin] = useState(false)
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const [relatedImagesLoaded, setRelatedImagesLoaded] = useState({})
  const [relatedImagesFailed, setRelatedImagesFailed] = useState({})
  const [alreadyAdded, setAlreadyAdded] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const mainImageRef = useRef(null)
  const clickCooldownRef = useRef({})
  const [alertState, setAlertState] = useState({
    open: false,
    tone: "default",
    title: "",
    message: "",
    primaryLabel: "Close"
  })

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "auto"
    })
    setLoading(true)
    setProduct(null)
    setRelatedProducts([])
    setImageLoaded(false)
    setImageFailed(false)
    setRelatedImagesLoaded({})
    setRelatedImagesFailed({})
    setAlreadyAdded(false)
    setCartLoading(false)
  }, [productId, productNavigationAt])

  useEffect(() => {
    setImageLoaded(false)
    setImageFailed(false)
    setRelatedImagesLoaded({})
    setRelatedImagesFailed({})
  }, [productId, productNavigationAt])

  useEffect(() => {
    if (!product?.image) {
      return
    }

    const imageElement = mainImageRef.current

    if (imageElement?.complete) {
      if (imageElement.naturalWidth > 0) {
        setImageLoaded(true)
      } else {
        setImageFailed(true)
        setImageLoaded(true)
      }
    }
  }, [product])

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
    const syncCartState = async () => {
      const localUser = getStoredKiwiUser()
      const currentUser = auth.currentUser

      if (!localUser || !productId || !currentUser || currentUser.uid !== localUser.uid) {
        setAlreadyAdded(false)
        return
      }

      try {
        const userRef = doc(db, "users", localUser.uid)
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
          setAlreadyAdded(false)
          return
        }

        const data = userSnap.data()
        const cartItems = data.cart || []
        setAlreadyAdded(cartItems.some((item) => item.productId === productId))
      } catch (error) {
        console.log(error)
        setAlreadyAdded(false)
      }
    }

    syncCartState()
  }, [productId, productNavigationAt, isLoggedIn])

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productRef = doc(db, "products", productId)
        const productSnap = await getDoc(productRef)

        if (productSnap.exists()) {
          const currentProduct = {
            id: productSnap.id,
            ...productSnap.data()
          }

          setProduct(currentProduct)

          const relatedSnapshot = await getDocs(collection(db, "products"))
          const relatedData = relatedSnapshot.docs
            .map((itemDoc) => ({
              id: itemDoc.id,
              ...itemDoc.data()
            }))
            .filter((item) => item.id !== productId && item.category === currentProduct.category)
            .slice(0, 4)

          setRelatedProducts(relatedData)
        } else {
          setProduct(null)
          setRelatedProducts([])
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId, productNavigationAt])

  useEffect(() => {
    const trackView = async () => {
      if (!productId) {
        return
      }

      try {
        const activitySaved = await appendUserActivity("views", productId, {
          lastActiveAt: Date.now()
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
    }

    trackView()
  }, [productId, productNavigationAt])

  useEffect(() => {
    if (!loading && product && !isLoggedIn) {
      setOpenLogin(true)
    }
  }, [loading, product, isLoggedIn])

  if (loading) {
    return (
      <div className="product-view-page">
        <Navbar />
        <div className="product-view-shell">
          <div className="product-view-main product-view-loading">
            <div className="product-view-gallery product-view-loading-card">
              <div className="product-view-skeleton-button"></div>
              <div className="product-view-skeleton-image"></div>
            </div>

            <div className="product-view-details product-view-loading-card">
              <div className="product-view-skeleton-line short"></div>
              <div className="product-view-skeleton-line title"></div>
              <div className="product-view-skeleton-line medium"></div>
              <div className="product-view-skeleton-line long"></div>

              <div className="product-view-skeleton-price-block">
                <div className="product-view-skeleton-line price"></div>
                <div className="product-view-skeleton-pills">
                  <div className="product-view-skeleton-pill"></div>
                  <div className="product-view-skeleton-pill"></div>
                </div>
              </div>

              <div className="product-view-skeleton-actions">
                <div className="product-view-skeleton-action"></div>
                <div className="product-view-skeleton-action dark"></div>
              </div>

              <div className="product-view-skeleton-info">
                <div className="product-view-skeleton-info-card"></div>
                <div className="product-view-skeleton-info-card"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="product-view-page">
        <Navbar />
        <div className="product-view-empty">
          <span className="product-view-empty-badge">Not found</span>
          <h1>Product unavailable</h1>
          <p>This product could not be found right now. Please return to the main collection and try another item.</p>
          <button type="button" className="product-view-back" onClick={() => navigate("/home")}>
            <ArrowLeft size={16} strokeWidth={2.2} />
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const hasOffer = product.offerPrice && product.offerPrice < product.price
  const discount = hasOffer ? Math.round(((product.price - product.offerPrice) / product.price) * 100) : 0
  const requireLogin = (callback) => {
    if (!isLoggedIn) {
      setOpenLogin(true)
      return
    }

    callback()
  }

  const handleAddToCart = async () => {
    if (alreadyAdded) {
      setAlertState({
        open: true,
        tone: "warning",
        title: "Already added",
        message: `${product.name} is already in your cart.`,
        primaryLabel: "Okay"
      })
      return
    }

    const localUser = getStoredKiwiUser()
    const currentUser = auth.currentUser

    if (!localUser || !currentUser || currentUser.uid !== localUser.uid) {
      setOpenLogin(true)
      return
    }

    try {
      setCartLoading(true)
      const userRef = doc(db, "users", localUser.uid)
      const userSnap = await getDoc(userRef)
      const data = userSnap.exists() ? userSnap.data() : {}
      const existingCart = data.cart || []
      const updatedCart = [
        ...existingCart,
        {
          productId: product.id,
          name: product.name,
          category: product.category || "",
          image: product.image || "",
          price: product.price || 0,
          offerPrice: product.offerPrice || null,
          rating: product.rating || ""
        }
      ]

      await updateDoc(userRef, {
        cart: updatedCart,
        "activity.cart": [...(data.activity?.cart || []), product.id],
        lastActiveAt: Date.now()
      })

      pingEngine(localUser.uid)

      window.dispatchEvent(
        new CustomEvent(CART_UPDATED_EVENT, {
          detail: {
            count: updatedCart.length
          }
        })
      )

      setAlreadyAdded(true)
      setAlertState({
        open: true,
        tone: "success",
        title: "Added to cart",
        message: `${product.name} added to cart successfully.`,
        primaryLabel: "Done"
      })
    } catch (error) {
      console.log(error)
      setAlertState({
        open: true,
        tone: "danger",
        title: "Cart update failed",
        message: "We could not add this product to your cart right now. Please try again.",
        primaryLabel: "Close"
      })
    } finally {
      setCartLoading(false)
    }
  }

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from, {
        state: {
          restoreScrollY: location.state.scrollY || 0
        }
      })
      return
    }

    navigate(-1)
  }

  if (!isLoggedIn) {
    return (
      <div className="product-view-page">
        <Navbar />
        <Alert
          open={alertState.open}
          tone={alertState.tone}
          title={alertState.title}
          message={alertState.message}
          primaryLabel={alertState.primaryLabel}
          secondaryLabel="Dismiss"
          onClose={() => setAlertState((current) => ({ ...current, open: false }))}
        />

        <div className="product-view-shell">
          <div className="product-view-locked">
            <span className="product-view-empty-badge">Login required</span>
            <h1>Sign in to view this product</h1>
            <p>Login or sign up to open product details, explore related items, and continue with the Kiwi shopping flow.</p>
            <div className="product-view-locked-actions">
              <button type="button" className="product-view-back" onClick={handleBack}>
                <ArrowLeft size={16} strokeWidth={2.2} />
                Back
              </button>
              <button type="button" className="product-view-buy product-view-login-trigger" onClick={() => setOpenLogin(true)}>
                <WalletCards size={16} strokeWidth={2.2} />
                Login / Signup
              </button>
            </div>
          </div>
        </div>

        <LoginPopup open={openLogin} setOpen={setOpenLogin} />
      </div>
    )
  }

  return (
    <div className="product-view-page">
      <Navbar />
      <Alert
        open={alertState.open}
        tone={alertState.tone}
        title={alertState.title}
        message={alertState.message}
        primaryLabel={alertState.primaryLabel}
        secondaryLabel="Dismiss"
        onClose={() => setAlertState((current) => ({ ...current, open: false }))}
      />

      <div className="product-view-shell">
        <div className="product-view-main">
          <div className="product-view-gallery">
            <button type="button" className="product-view-back" onClick={handleBack}>
              <ArrowLeft size={16} strokeWidth={2.2} />
              Back
            </button>

            <div className="product-view-image-stage">
              {!imageLoaded && !imageFailed && <div className="product-view-image-skeleton" aria-hidden="true"></div>}
              <div className="product-view-image-frame">
                {!imageFailed ? (
                  <img
                    ref={mainImageRef}
                    src={product.image}
                    alt={product.name}
                    className={imageLoaded ? "loaded" : ""}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => {
                      setImageFailed(true)
                      setImageLoaded(true)
                    }}
                  />
                ) : (
                  <div className="product-view-image-fallback">
                    <ShoppingBag size={34} strokeWidth={2.1} />
                    <span>Image unavailable</span>
                  </div>
                )}
              </div>

              {hasOffer && (
                <span className="product-view-offer-chip">
                  <BadgePercent size={14} strokeWidth={2.2} />
                  Offer live
                </span>
              )}

              <span className="product-view-rating-chip">
                <Star size={14} strokeWidth={2.2} />
                {product.rating}
              </span>
            </div>
          </div>

          <div className="product-view-details">
            <span className="product-view-eyebrow">{product.category || "Kiwi product"}</span>
            <h1>{product.name}</h1>
            <p className="product-view-copy">
              Crafted for a cleaner Kiwi shopping experience with refined styling, smoother browsing, and a more premium everyday fit.
            </p>

            <div className="product-view-price-block">
              <div className="product-view-price-row">
                <span className="product-view-price">
                  ₹{hasOffer ? product.offerPrice : product.price}
                </span>
                {hasOffer && <span className="product-view-original">₹{product.price}</span>}
              </div>

              <div className="product-view-support">
                {hasOffer ? (
                  <span className="product-view-discount">{discount}% off live now</span>
                ) : (
                  <span className="product-view-discount neutral">No live discount on this product</span>
                )}
                <span className="product-view-tax">Inclusive of taxes</span>
              </div>
              </div>

            <div className="product-view-actions">
              <button
                type="button"
                className={`product-view-cart ${alreadyAdded ? "added" : ""}`}
                onClick={() => requireLogin(handleAddToCart)}
                disabled={cartLoading}
              >
                {cartLoading ? (
                  <span className="product-view-cart-loading" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                ) : (
                  <ShoppingBag size={16} strokeWidth={2.2} />
                )}
                {cartLoading ? "Adding to Cart" : alreadyAdded ? "Already Added" : "Add to Cart"}
              </button>
              <button
                type="button"
                className="product-view-buy"
                onClick={() => requireLogin(() => navigate(`/product/${productId}/buy`))}
              >
                <WalletCards size={16} strokeWidth={2.2} />
                Buy Now
              </button>
            </div>

            <div className="product-view-info-grid">
              <div className="product-view-info-card">
                <span className="product-view-info-icon">
                  <ShieldCheck size={16} strokeWidth={2.2} />
                </span>
                <div>
                  <strong>Verified listing</strong>
                  <p>Checked and shown inside the Kiwi product feed.</p>
                </div>
              </div>

              <div className="product-view-info-card">
                <span className="product-view-info-icon">
                  <Truck size={16} strokeWidth={2.2} />
                </span>
                <div>
                  <strong>Smooth delivery flow</strong>
                  <p>Designed for a clean add-to-cart and purchase experience.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="product-view-related">
            <div className="product-view-related-head">
              <span className="product-view-related-eyebrow">More in {product.category}</span>
              <h2>Related Products</h2>
              <p>Explore more curated picks from the same category with the same Kiwi product feel.</p>
            </div>

            <div className="product-view-related-grid">
              {relatedProducts.map((item) => {
                const hasOfferOnItem = item.offerPrice && item.offerPrice < item.price

                return (
                  <button
                    type="button"
                    key={item.id}
                    className="product-view-related-card"
                    onClick={() => requireLogin(async () => {
                      const now = Date.now()
                      const lastClick = clickCooldownRef.current[item.id] || 0

                      if (now - lastClick < CLICK_COOLDOWN_MS) {
                        return
                      }

                      clickCooldownRef.current[item.id] = now

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

                      navigate(`/product/${item.id}`, {
                        state: {
                          from: `${location.pathname}${location.search}`,
                          scrollY: window.scrollY,
                          productNavigationAt: Date.now()
                        }
                      })
                    })}
                  >
                    <div className="product-view-related-image">
                      {!relatedImagesLoaded[item.id] && !relatedImagesFailed[item.id] && (
                        <div className="product-view-related-skeleton" aria-hidden="true"></div>
                      )}
                      {!relatedImagesFailed[item.id] ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className={relatedImagesLoaded[item.id] ? "loaded" : ""}
                          onLoad={() =>
                            setRelatedImagesLoaded((current) => ({
                              ...current,
                              [item.id]: true
                            }))
                          }
                          onError={() => {
                            setRelatedImagesFailed((current) => ({
                              ...current,
                              [item.id]: true
                            }))
                            setRelatedImagesLoaded((current) => ({
                              ...current,
                              [item.id]: true
                            }))
                          }}
                        />
                      ) : (
                        <div className="product-view-related-fallback">
                          <ShoppingBag size={22} strokeWidth={2.1} />
                          <span>Preview unavailable</span>
                        </div>
                      )}
                    </div>

                    <div className="product-view-related-copy">
                      <span className="product-view-related-category">{item.category}</span>
                      <strong>{item.name}</strong>
                      <div className="product-view-related-meta">
                        <span>₹{hasOfferOnItem ? item.offerPrice : item.price}</span>
                        <span className="product-view-related-rating">
                          <Star size={12} strokeWidth={2.2} />
                          {item.rating}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <LoginPopup open={openLogin} setOpen={setOpenLogin} />
    </div>
  )
}
