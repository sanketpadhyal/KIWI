import { ArrowLeft, ShieldCheck, ShoppingBag, Star, Trash2, ShoppingCart, ThumbsDown } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useLocation, useNavigate } from "react-router-dom"
import Navbar from "./Navbar"
import Alert from "./Alert"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { getStoredKiwiUser } from "../utils/kiwiUser"
import "./Cart.css"

const CART_SESSION_TOKEN_KEY = "kiwiCartSessionToken"
const CART_AUTH_TOKEN_KEY = "kiwiCartAuthToken"
const CART_UPDATED_EVENT = "kiwi-cart-updated"

const getAirdropEntries = (airdrop) => {
  if (Array.isArray(airdrop)) {
    return airdrop
  }

  if (airdrop?.productId) {
    return [airdrop]
  }

  return []
}

const formatCountdown = (expiresAt, now) => {
  if (!expiresAt) {
    return "Limited-time offer"
  }

  const remainingMs = Math.max(expiresAt - now, 0)
  const totalSeconds = Math.floor(remainingMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} left`
}

export default function Cart() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [airdropOffer, setAirdropOffer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cartSessionToken, setCartSessionToken] = useState("")
  const [countdownNow, setCountdownNow] = useState(Date.now())
  const [alertState, setAlertState] = useState({
    open: false,
    tone: "default",
    title: "",
    message: "",
    primaryLabel: "Close"
  })

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdownNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const storedUser = getStoredKiwiUser()

      if (!currentUser || !storedUser || currentUser.uid !== storedUser.uid) {
        sessionStorage.removeItem(CART_SESSION_TOKEN_KEY)
        sessionStorage.removeItem(CART_AUTH_TOKEN_KEY)
        setCartSessionToken("")
        setUser(null)
        setCartItems([])
        setAirdropOffer(null)
        setLoading(false)
        return
      }

      setUser(storedUser)

      try {
        const userRef = doc(db, "users", currentUser.uid)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          const data = userSnap.data()
          const now = Date.now()
          const validCart = (data.cart || []).filter(
            (item) => !item.expiresAt || item.expiresAt > now
          )
          const airdropEntries = getAirdropEntries(data.airdrop)
          const activeAirdrop = airdropEntries.find((item) => (
            item?.productId && (!item.expiresAt || item.expiresAt > now) && item.active !== false
          )) || null

          setCartItems(validCart)

          if (activeAirdrop?.productId) {
            const productSnap = await getDoc(doc(db, "products", activeAirdrop.productId))

            if (productSnap.exists()) {
              const product = productSnap.data()
              const discount = Number(activeAirdrop.discount || data.engine?.lastDiscount || 0)
              const basePrice =
                product.offerPrice !== undefined &&
                product.offerPrice !== null
                  ? product.offerPrice
                  : product.price

              setAirdropOffer({
                ...product,
                productId: activeAirdrop.productId,
                expiresAt: activeAirdrop.expiresAt || null,
                discount,
                basePrice,
                displayPrice: discount
                  ? Math.round(basePrice - (basePrice * discount) / 100)
                  : basePrice
              })
            } else {
              setAirdropOffer(null)
            }
          } else {
            setAirdropOffer(null)
          }
        } else {
          setCartItems([])
          setAirdropOffer(null)
        }
      } catch (error) {
        console.log(error)
        setCartItems([])
        setAirdropOffer(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const syncCartSession = async () => {
      if (!user?.uid || !auth.currentUser) {
        sessionStorage.removeItem(CART_SESSION_TOKEN_KEY)
        sessionStorage.removeItem(CART_AUTH_TOKEN_KEY)
        setCartSessionToken("")
        return
      }

      const existingSessionToken = sessionStorage.getItem(CART_SESSION_TOKEN_KEY)
      const nextSessionToken = existingSessionToken || crypto.randomUUID()
      sessionStorage.setItem(CART_SESSION_TOKEN_KEY, nextSessionToken)
      setCartSessionToken(nextSessionToken)

      try {
        const token = await auth.currentUser.getIdToken()
        sessionStorage.setItem(CART_AUTH_TOKEN_KEY, token)
      } catch (error) {
        console.log(error)
        sessionStorage.removeItem(CART_AUTH_TOKEN_KEY)
      }
    }

    syncCartSession()
  }, [user])

  useEffect(() => {
    if (!cartSessionToken) {
      return
    }

    const params = new URLSearchParams(location.search)

    if (params.get("session") === cartSessionToken) {
      return
    }

    params.set("session", cartSessionToken)
    navigate(`${location.pathname}?${params.toString()}`, { replace: true })
  }, [cartSessionToken, location.pathname, location.search, navigate])

  const totalAmount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.offerPrice || item.price || 0), 0),
    [cartItems]
  )

  const airdropCountdown = useMemo(
    () => formatCountdown(airdropOffer?.expiresAt, countdownNow),
    [airdropOffer?.expiresAt, countdownNow]
  )

  useEffect(() => {
    const syncExpiredCartItems = async () => {
      if (!user?.uid || loading) {
        return
      }

      const hasExpiredItems = cartItems.some((item) => item.expiresAt && item.expiresAt <= countdownNow)

      if (!hasExpiredItems) {
        return
      }

      const updatedCart = cartItems.filter((item) => !item.expiresAt || item.expiresAt > countdownNow)

      try {
        const userRef = doc(db, "users", user.uid)
        await updateDoc(userRef, {
          cart: updatedCart
        })

        setCartItems(updatedCart)
        window.dispatchEvent(
          new CustomEvent(CART_UPDATED_EVENT, {
            detail: {
              count: updatedCart.length
            }
          })
        )
      } catch (error) {
        console.log(error)
      }
    }

    syncExpiredCartItems()
  }, [cartItems, countdownNow, loading, user?.uid])

  const removeFromCart = async (productId) => {
    if (!user?.uid) {
      return
    }

    const updatedCart = cartItems.filter((item) => item.productId !== productId)

    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        cart: updatedCart
      })

      setCartItems(updatedCart)
      window.dispatchEvent(
        new CustomEvent(CART_UPDATED_EVENT, {
          detail: {
            count: updatedCart.length
          }
        })
      )
      setAlertState({
        open: true,
        tone: "success",
        title: "Cart updated",
        message: "The item was removed from your cart successfully.",
        primaryLabel: "Done"
      })
    } catch (error) {
      console.log(error)
      setAlertState({
        open: true,
        tone: "danger",
        title: "Unable to update cart",
        message: "We could not remove that item right now. Please try again.",
        primaryLabel: "Close"
      })
    }
  }

  const declineAirdropOffer = async () => {
    if (!user?.uid || !airdropOffer?.productId) {
      return
    }

    try {
      const userRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        return
      }

      const data = userSnap.data()
      const updatedAirdrop = getAirdropEntries(data.airdrop).filter(
        (item) => item.productId !== airdropOffer.productId
      )

      await updateDoc(userRef, {
        airdrop: updatedAirdrop,
        "engine.lastRecommendedProduct": null,
        "engine.lastDiscount": 0,
        "engine.lastTriggerAt": null,
        "engine.cycleActive": false
      })

      setAirdropOffer(null)
      setAlertState({
        open: true,
        tone: "success",
        title: "Offer removed",
        message: "Removed offer denied.",
        primaryLabel: "Done"
      })
    } catch (error) {
      console.log(error)
      setAlertState({
        open: true,
        tone: "danger",
        title: "Unable to decline offer",
        message: "We could not remove that airdrop offer right now. Please try again.",
        primaryLabel: "Close"
      })
    }
  }

  const moveAirdropToCart = async () => {
    if (!user?.uid || !airdropOffer?.productId) {
      return
    }

    try {
      const userRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        return
      }

      const data = userSnap.data()
      const existingCart = data.cart || []
      const updatedAirdrop = getAirdropEntries(data.airdrop).filter(
        (item) => item.productId !== airdropOffer.productId
      )
      const cartItem = {
        productId: airdropOffer.productId,
        name: airdropOffer.name,
        category: airdropOffer.category || "",
        image: airdropOffer.image || "",
        price: airdropOffer.price || 0,
        offerPrice: airdropOffer.displayPrice || airdropOffer.offerPrice || airdropOffer.price || 0,
        rating: airdropOffer.rating || "",
        expiresAt: airdropOffer.expiresAt || null
      }
      const updatedCart = [...existingCart, cartItem]

      await updateDoc(userRef, {
        cart: updatedCart,
        airdrop: updatedAirdrop,
        "activity.cart": [...(data.activity?.cart || []), airdropOffer.productId]
      })

      setCartItems(updatedCart)
      setAirdropOffer(null)
      window.dispatchEvent(
        new CustomEvent(CART_UPDATED_EVENT, {
          detail: {
            count: updatedCart.length
          }
        })
      )
      setAlertState({
        open: true,
        tone: "success",
        title: "Offer added to cart",
        message: "The airdrop offer moved to your cart successfully.",
        primaryLabel: "Done"
      })
    } catch (error) {
      console.log(error)
      setAlertState({
        open: true,
        tone: "danger",
        title: "Unable to move offer",
        message: "We could not move that airdrop offer to your cart right now. Please try again.",
        primaryLabel: "Close"
      })
    }
  }

  if (loading) {
    return (
      <div className="cart-page">
        <Navbar />
        <div className="cart-shell">
          <div className="cart-loading-head">
            <div className="cart-top-back cart-top-back-skeleton cart-skeleton-block"></div>
            <div className="cart-loading-head-row">
              <div className="cart-loading-copy">
                <div className="cart-skeleton-block cart-loading-badge"></div>
                <div className="cart-skeleton-block cart-loading-title"></div>
                <div className="cart-skeleton-block cart-loading-line"></div>
                <div className="cart-skeleton-block cart-loading-line short"></div>
              </div>
              <div className="cart-skeleton-block cart-loading-summary-badge"></div>
            </div>
          </div>

          <div className="cart-layout cart-layout-loading">
            <div className="cart-list cart-list-loading">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="cart-item cart-item-loading">
                  <div className="cart-skeleton-block cart-item-image cart-item-image-skeleton"></div>

                  <div className="cart-item-copy cart-item-copy-loading">
                    <div className="cart-skeleton-block cart-item-line category"></div>
                    <div className="cart-skeleton-block cart-item-line title"></div>
                    <div className="cart-skeleton-block cart-item-line title short"></div>
                    <div className="cart-item-meta cart-item-meta-loading">
                      <div className="cart-skeleton-block cart-meta-pill price"></div>
                      <div className="cart-skeleton-block cart-meta-pill rating"></div>
                    </div>
                  </div>

                  <div className="cart-skeleton-block cart-item-remove cart-item-remove-skeleton"></div>
                </div>
              ))}
            </div>

            <div className="cart-total-card cart-total-card-loading">
              <div className="cart-skeleton-block cart-loading-badge"></div>
              <div className="cart-skeleton-block cart-total-title-skeleton"></div>
              <div className="cart-skeleton-block cart-total-row-skeleton"></div>
              <div className="cart-skeleton-block cart-total-row-skeleton"></div>
              <div className="cart-skeleton-block cart-checkout-skeleton"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="cart-page">
        <Navbar />
        <div className="cart-shell">
          <div className="cart-empty">
            <span className="cart-badge">Cart</span>
            <h1>Sign in to view your cart</h1>
            <p>Your saved cart items will appear here once you log in and start adding products from Kiwi.</p>
            <button type="button" className="cart-back" onClick={() => navigate("/home")}>
              <ArrowLeft size={16} strokeWidth={2.2} />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
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

      <div className="cart-shell">
        <button type="button" className="cart-top-back" aria-label="Back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} strokeWidth={2.2} />
        </button>

        <div className="cart-head">
          <div>
            <span className="cart-badge">Cart</span>
            <h1>Your Cart</h1>
            <p>Review your saved Kiwi picks and continue building your shopping flow.</p>
          </div>

          <div className="cart-summary-badge">
            <ShieldCheck size={15} strokeWidth={2.2} />
            <span>{cartItems.length} items saved</span>
          </div>
        </div>

        {airdropOffer && (
          <div className="cart-airdrop-card">
            <div className="cart-airdrop-copy">
              <span className="cart-badge">Airdrop</span>
              <h2>Special offer waiting for you</h2>
              <p>
                This active airdrop stays live for a limited time. Add it to cart now or decline it from here.
              </p>
              <div className="cart-airdrop-savings">
                <div className="cart-airdrop-savings-main">
                  <span className="cart-airdrop-now">₹{airdropOffer.displayPrice || airdropOffer.offerPrice || airdropOffer.price}</span>
                  {Number(airdropOffer.basePrice || airdropOffer.offerPrice || airdropOffer.price || 0) > Number(airdropOffer.displayPrice || airdropOffer.offerPrice || airdropOffer.price || 0) && (
                    <span className="cart-airdrop-was">₹{airdropOffer.basePrice || airdropOffer.offerPrice || airdropOffer.price}</span>
                  )}
                </div>
                {Number(airdropOffer.basePrice || airdropOffer.offerPrice || airdropOffer.price || 0) > Number(airdropOffer.displayPrice || airdropOffer.offerPrice || airdropOffer.price || 0) && (
                  <span className="cart-airdrop-save">
                    Save {Math.round(((Number(airdropOffer.basePrice || airdropOffer.offerPrice || airdropOffer.price || 0) - Number(airdropOffer.displayPrice || airdropOffer.offerPrice || airdropOffer.price || 0)) / Number(airdropOffer.basePrice || airdropOffer.offerPrice || airdropOffer.price || 1)) * 100)}%
                  </span>
                )}
              </div>
              <div className="cart-airdrop-meta">
                <span className="cart-airdrop-price">Special airdrop price</span>
                <span className="cart-airdrop-rating">
                  <Star size={12} strokeWidth={2.2} />
                  {airdropOffer.rating || "4.8"}
                </span>
                <span className="cart-airdrop-timer">{airdropCountdown}</span>
              </div>
              <div className="cart-airdrop-actions">
                <button type="button" className="cart-airdrop-secondary" onClick={declineAirdropOffer}>
                  <ThumbsDown size={15} style={{ marginRight: 6 }} />
                  Decline offer
                </button>
                <button type="button" className="cart-airdrop-primary" onClick={moveAirdropToCart}>
                  <ShoppingCart size={15} style={{ marginRight: 6 }} />
                  Add to Cart
                </button>
              </div>
            </div>

            <button
              type="button"
              className="cart-airdrop-image"
              onClick={() => navigate(`/product/${airdropOffer.productId}`, {
                state: {
                  productNavigationAt: Date.now()
                }
              })}
            >
              <img src={airdropOffer.image} alt={airdropOffer.name} />
            </button>
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <span className="cart-badge">{airdropOffer ? "Cart Empty" : "Empty"}</span>
            <h1>Your cart is empty</h1>
            <p>
              {airdropOffer
                ? "Your active airdrop is shown above. Add it to cart or keep browsing to save more products here."
                : "Browse products and add them to cart from the product view page to see them here."}
            </p>
            <button type="button" className="cart-back" onClick={() => navigate("/home")}>
              <ArrowLeft size={16} strokeWidth={2.2} />
              Back to Home
            </button>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-list">
              {cartItems.map((item) => (
                <div key={item.productId} className="cart-item">
                  <button
                    type="button"
                    className="cart-item-image"
                    onClick={() => navigate(`/product/${item.productId}`, {
                      state: {
                        productNavigationAt: Date.now()
                      }
                    })}
                  >
                    <img src={item.image} alt={item.name} />
                  </button>

                  <div className="cart-item-copy">
                    <span className="cart-item-category">{item.category || "Kiwi product"}</span>
                    <h3>{item.name}</h3>
                    <div className="cart-item-meta">
                      <span className="cart-item-price">₹{item.offerPrice || item.price}</span>
                      <span className="cart-item-rating">
                        <Star size={12} strokeWidth={2.2} />
                        {item.rating || "4.8"}
                      </span>
                      {item.expiresAt && (
                        <p className="cart-timer">
                          {formatCountdown(item.expiresAt, countdownNow)}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="cart-item-remove"
                    onClick={() => removeFromCart(item.productId)}
                  >
                    <Trash2 size={15} strokeWidth={2.2} />
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-total-card">
              <span className="cart-badge">Summary</span>
              <h2>Cart Total</h2>
              <div className="cart-total-row">
                <span>Total items</span>
                <strong>{cartItems.length}</strong>
              </div>
              <div className="cart-total-row">
                <span>Estimated total</span>
                <strong>₹{totalAmount}</strong>
              </div>
              <button
                type="button"
                className="cart-checkout"
                onClick={() =>
                  navigate("/cart/buy", {
                    state: {
                      itemCount: cartItems.length,
                      totalAmount,
                      sessionToken: cartSessionToken
                    }
                  })
                }
              >
                <ShoppingBag size={16} strokeWidth={2.2} />
                CheckOut
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
