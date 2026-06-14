import { useEffect, useState } from "react"
import { FcGoogle } from "react-icons/fc"
import { FiX } from "react-icons/fi"
import { auth, db } from "../firebase"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { setStoredKiwiUser } from "../utils/kiwiUser"
import "./LoginPopup.css"

const LOGO_CACHE_KEY = "zenty-logo-loaded"

export default function LoginPopup({ open, setOpen }) {
  const navigate = useNavigate()
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [error, setError] = useState("")
  const [logoLoaded, setLogoLoaded] = useState(() => localStorage.getItem(LOGO_CACHE_KEY) === "true")

  useEffect(() => {
    if (!open || logoLoaded) {
      return
    }

    const image = new window.Image()
    image.src = "/assets/logo.png"
    image.onload = () => {
      setLogoLoaded(true)
      localStorage.setItem(LOGO_CACHE_KEY, "true")
    }
  }, [logoLoaded, open])

  if (!open) return null

  const loginWithGoogle = async () => {
    try {
      setLoadingGoogle(true)
      setError("")

      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const firebaseUser = result.user

      const userRef = doc(db, "users", firebaseUser.uid)
      const userSnap = await getDoc(userRef)

      let userData

      if (userSnap.exists()) {
        userData = userSnap.data()
      } else {
        userData = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          photo: firebaseUser.photoURL,

          interestedIn: [],

          activity: {
            views: [],
            clicks: [],
            cart: []
          },

          score: 0,

          lastActiveAt: Date.now(),

          engine: {
            lastRecommendedProduct: null,
            lastDiscount: 0,
            lastTriggerAt: null,
            cycleActive: false
          },

          airdrop: {
            productId: null,
            price: 0,
            expiresAt: null,
            active: false
          },

          cart: []
        }

        await setDoc(userRef, userData)
      }

      setStoredKiwiUser(userData)

      setOpen(false)
      window.scrollTo(0, 0)
      navigate("/home", { replace: true })

    } catch (err) {
      console.log(err)
      setError("Login failed. Try again.")
    } finally {
      setLoadingGoogle(false)
    }
  }

  return (
    <div className="login-overlay" onClick={() => setOpen(false)}>
      <div className="login-box" onClick={(e) => e.stopPropagation()}>

        <button className="login-close" onClick={() => setOpen(false)}>
          <FiX size={18} />
        </button>

        <div className="login-brand">
          <img
            src="/assets/logo.png"
            alt="Kiwi logo"
            className={`login-logo ${logoLoaded ? "loaded" : ""}`}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            onLoad={() => {
              setLogoLoaded(true)
              localStorage.setItem(LOGO_CACHE_KEY, "true")
            }}
          />
        </div>

        <div className="login-copy">
          <h2 className="login-title">Login to Kiwi</h2>
          <p className="login-subtitle">
            Continue with Google for a faster and secure experience.
          </p>
        </div>

        <button
          className="login-google-btn login-google-btn-primary"
          onClick={loginWithGoogle}
          disabled={loadingGoogle}
        >
          {loadingGoogle ? (
            <span className="login-google-loading">
              <span></span>
              <span></span>
              <span></span>
            </span>
          ) : (
            <>
              <FcGoogle size={18} />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {error && <p className="login-error">{error}</p>}

        <p className="login-note">Your data is safe with Kiwi Auth System.</p>

      </div>
    </div>
  )
}
