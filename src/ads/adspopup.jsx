import { ArrowRight, BadgePercent, ShoppingBag, Star, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { db } from "../firebase"
import { ENGINE_URL } from "../utils/engine"
import { getStoredKiwiUser } from "../utils/kiwiUser"
import "./adspopup.css"

export default function AdsPopup({ open = false, setOpen = () => {} }) {
  const navigate = useNavigate()
  const imageRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const [featuredProduct, setFeaturedProduct] = useState(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setLoading(true)
    setImageLoaded(false)
    setImageFailed(false)
    setFeaturedProduct(null)

    const fetchAd = async () => {
      const user = getStoredKiwiUser()

      if (!user) {
        setLoading(false)
        return
      }

      try {
        const loadFeaturedProduct = async (productId, state, extraData = {}) => {
          if (!productId) {
            return false
          }

          const productSnap = await getDoc(doc(db, "products", productId))

          if (!productSnap.exists()) {
            return false
          }

          const product = productSnap.data()
          const discount = Number(extraData.discount || 0)
          const basePrice =
            product.offerPrice !== undefined &&
            product.offerPrice !== null
              ? product.offerPrice
              : product.price

          setFeaturedProduct({
            ...product,
            state,
            id: productId,
            discount,
            dynamicPrice: discount
              ? Math.round(basePrice - (basePrice * discount) / 100)
              : basePrice,
            message: extraData.message || null
          })

          return true
        }

        const response = await fetch(ENGINE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId: user.uid
          })
        })

        const data = await response.json()

        if (!data || data.type === "safe-fallback") {
          setFeaturedProduct({
            state: "safe-fallback",
            id: null,
            name: "Engine stabilizing",
            category: "AdSync",
            message: "Try again in a moment",
            price: 0,
            rating: "—"
          })
          return
        }

        if (data.type === "incomplete-cycle") {
          setFeaturedProduct({
            state: "incomplete-cycle",
            id: null,
            name: "Complete 5 actions",
            category: "AdSync",
            message: data.message,
            price: 0,
            rating: "—"
          })
          return
        }

        if (data.type === "active-airdrop") {
          const userSnap = await getDoc(doc(db, "users", user.uid))
          const userData = userSnap.exists() ? userSnap.data() : {}
          const airdropEntries = Array.isArray(userData.airdrop)
            ? userData.airdrop
            : userData.airdrop?.productId
              ? [userData.airdrop]
              : []
          const activeAirdrop = airdropEntries.find((item) => (
            item?.productId && (!item.expiresAt || item.expiresAt > Date.now()) && item.active !== false
          )) || airdropEntries[0]
          const activeProductId = activeAirdrop?.productId || userData.engine?.lastRecommendedProduct || data.productId
          const activeDiscount = activeAirdrop?.discount ?? userData.engine?.lastDiscount ?? data.discount ?? 0

          if (await loadFeaturedProduct(activeProductId, "active-airdrop", {
            discount: activeDiscount,
            message: "You already have an active offer waiting. Open it now."
          })) {
            return
          }

          setFeaturedProduct({
            state: "active-airdrop",
            id: null,
            name: "Active offer already available",
            category: "AdSync",
            message: "You already have an active offer in your airdrop. Visit cart to view it.",
            price: 0,
            rating: "—"
          })
          return
        }

        if (data.type === "success" && data.productId) {
          await loadFeaturedProduct(data.productId, "success", {
            discount: data.discount
          })
        }
      } catch (error) {
        console.log(error)
      } finally {
        setLoading(false)
      }
    }

    fetchAd()
  }, [open])

  useEffect(() => {
    setImageLoaded(false)
    setImageFailed(false)
  }, [featuredProduct])

  useEffect(() => {
    if (!featuredProduct?.image) {
      return
    }

    const imageElement = imageRef.current

    if (imageElement?.complete && imageElement.naturalWidth > 0) {
      setImageLoaded(true)
    }
  }, [featuredProduct, open])

  if (!open) {
    return null
  }

  const hasProduct = Boolean(featuredProduct?.id)
  const isLocked = featuredProduct?.state === "incomplete-cycle"
  const isActiveOffer = featuredProduct?.state === "active-airdrop"
  const statusText = featuredProduct?.state === "active-airdrop"
    ? "An active airdrop offer is already waiting"
    : featuredProduct?.state === "safe-fallback"
      ? "AdSync is preparing your next recommendation"
      : "Unlock after 5 completed actions"
  const hasOffer = featuredProduct?.discount > 0
  const displayPrice = featuredProduct?.dynamicPrice || (featuredProduct?.offerPrice && featuredProduct.offerPrice < featuredProduct.price ? featuredProduct.offerPrice : featuredProduct?.price)

  const handleDecline = async () => {
    const user = getStoredKiwiUser()

    if (!user || !featuredProduct?.id) {
      setOpen(false)
      return
    }

    try {
      const userRef = doc(db, "users", user.uid)
      const snap = await getDoc(userRef)

      if (!snap.exists()) {
        setOpen(false)
        return
      }

      const data = snap.data()
      const filteredAirdrop = (data.airdrop || []).filter(
        (item) => item.productId !== featuredProduct.id
      )

      await updateDoc(userRef, {
        airdrop: filteredAirdrop,
        "engine.lastRecommendedProduct": null,
        "engine.lastDiscount": 0,
        "engine.lastTriggerAt": null,
        "engine.cycleActive": false
      })
    } catch (error) {
      console.log(error)
    } finally {
      setOpen(false)
    }
  }

  const handleSkip = () => {
    setOpen(false)
  }

  return (
    <div className="ads-popup-overlay" onClick={() => setOpen(false)}>
      <div className="ads-popup-card" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="ads-popup-close"
          aria-label="Close ad"
          onClick={() => setOpen(false)}
        >
          <X size={16} strokeWidth={2.2} />
        </button>

        <div className="ads-popup-scroll">
          <div className="ads-popup-head">
            <span className="ads-popup-kicker">Smart Pick for You</span>
            <p className="ads-popup-headline">Selected by the AdSync engine after analyzing your recent interactions and interest patterns.</p>
          </div>
          {loading || !featuredProduct ? (
            <div className="ads-popup-loading">
              <div className="ads-popup-skeleton image"></div>
              <div className="ads-popup-skeleton short"></div>
              <div className="ads-popup-skeleton title"></div>
              <div className="ads-popup-skeleton line"></div>
              <div className="ads-popup-skeleton line"></div>
            </div>
          ) : (
            <>
              {hasProduct ? (
                <div className="ads-popup-image-wrap">
                  {!imageLoaded && !imageFailed && <div className="ads-popup-image-skeleton" aria-hidden="true"></div>}
                  {!imageFailed ? (
                    <img
                      key={featuredProduct.id}
                      ref={imageRef}
                      src={featuredProduct.image}
                      alt={featuredProduct.name}
                      className={imageLoaded ? "loaded" : ""}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => {
                        setImageFailed(true)
                        setImageLoaded(true)
                      }}
                    />
                  ) : (
                    <div className="ads-popup-image-fallback">
                      <ShoppingBag size={30} strokeWidth={2.1} />
                      <span>Preview unavailable</span>
                    </div>
                  )}

                  {hasOffer && (
                    <span className="ads-popup-offer-chip">
                      <BadgePercent size={13} strokeWidth={2.2} />
                      Special Price for You
                    </span>
                  )}
                </div>
              ) : (
                <div className="ads-popup-status" role="status" aria-live="polite">
                  <ShoppingBag size={18} strokeWidth={2.1} />
                  <span>{statusText}</span>
                </div>
              )}

              <div className="ads-popup-copy">
                <span className="ads-popup-category">{featuredProduct.category || "Kiwi product"}</span>
                <h3>{featuredProduct.name}</h3>
                <p>This recommendation was generated by the AdSync engine using your browsing behavior, shopping intent, and product interaction signals.</p>
                {featuredProduct?.message && (
                  <p className="ads-popup-warning">
                    {featuredProduct.message}
                  </p>
                )}

                {hasProduct && (
                  <div className="ads-popup-meta">
                    <div className="ads-popup-price">
                      <ShoppingBag size={14} strokeWidth={2.2} />
                      <span>₹{displayPrice}</span>
                    </div>
                    <div className="ads-popup-rating">
                      <Star size={13} strokeWidth={2.2} />
                      <span>{featuredProduct.rating || "4.8"}</span>
                    </div>
                  </div>
                )}
                {hasProduct && (
                  <p className="ads-timer">
                    Offer valid for 1 hour
                  </p>
                )}

                {hasProduct && !isLocked && !isActiveOffer ? (
                  <div className="ads-popup-actions">
                    <button type="button" className="ads-popup-secondary" onClick={handleDecline}>
                      Decline offer
                    </button>
                    <button type="button" className="ads-popup-secondary" onClick={handleSkip}>
                      Skip
                    </button>
                    <button
                      type="button"
                    className="ads-popup-primary"
                    onClick={() => {
                      navigate(`/product/${featuredProduct.id}`, {
                        state: {
                          from: window.location.pathname + window.location.search,
                          scrollY: window.scrollY,
                          productNavigationAt: Date.now()
                        }
                      })
                    }}
                  >
                      <span>View Product</span>
                      <ArrowRight size={15} strokeWidth={2.2} />
                    </button>
                  </div>
                ) : hasProduct && isActiveOffer ? (
                  <div className="ads-popup-actions ads-popup-actions-single">
                    <button
                      type="button"
                    className="ads-popup-primary"
                    onClick={() => {
                      navigate(`/product/${featuredProduct.id}`, {
                        state: {
                          from: window.location.pathname + window.location.search,
                          scrollY: window.scrollY,
                          productNavigationAt: Date.now()
                        }
                      })
                    }}
                  >
                      <span>View Offer</span>
                      <ArrowRight size={15} strokeWidth={2.2} />
                    </button>
                  </div>
                ) : isLocked ? (
                  <div className="ads-popup-actions ads-popup-actions-single">
                    <button type="button" className="ads-popup-disabled" disabled>
                      Complete 5 actions to unlock
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
