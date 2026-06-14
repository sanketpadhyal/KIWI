import { useEffect, useState } from "react"
import { auth, db } from "../../firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import Navbar from "../../components/Navbar"
import Alert from "../../components/Alert"
import { ShieldCheck, Sparkles, UserRound, RotateCcw, Mail, PencilLine, Phone, MapPin, LocateFixed } from "lucide-react"
import { getStoredKiwiUser, setStoredKiwiUser } from "../../utils/kiwiUser"
import "./Profile.css"

export default function Profile() {
  const [user, setUser] = useState(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [alertState, setAlertState] = useState({
    open: false,
    tone: "default",
    title: "",
    message: "",
    primaryLabel: "Close"
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        const storedUser = localStorage.getItem("kiwiUser")

        if (storedUser) {
          const parsedUser = getStoredKiwiUser()

          if (!parsedUser) {
            setLoading(false)
            return
          }

          setUser(parsedUser)
          setName(parsedUser.name || "")
          setPhone(parsedUser.phone || "")
          setAddress(parsedUser.address || "")
        }

        setLoading(false)
        return
      }

      const userRef = doc(db, "users", currentUser.uid)
      const snap = await getDoc(userRef)

      if (snap.exists()) {
        const data = snap.data()
        setUser(data)
        setName(data.name || "")
        setPhone(data.phone || currentUser.phoneNumber || "")
        setAddress(data.address || "")
      } else {
        const fallbackUser = {
          uid: currentUser.uid,
          name: currentUser.displayName || "",
          email: currentUser.email || "",
          phone: currentUser.phoneNumber || "",
          address: "",
          interestedIn: []
        }

        setUser(fallbackUser)
        setName(fallbackUser.name)
        setPhone(fallbackUser.phone)
        setAddress(fallbackUser.address)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const updateProfile = async () => {
    if (!name.trim()) {
      setAlertState({
        open: true,
        tone: "warning",
        title: "Name required",
        message: "Please enter your name before updating your Kiwi profile.",
        primaryLabel: "Okay"
      })
      return
    }

    if (!auth.currentUser) {
      setAlertState({
        open: true,
        tone: "danger",
        title: "Unable to save",
        message: "You need to be signed in to update your profile.",
        primaryLabel: "Close"
      })
      return
    }

    try {
      setSaving(true)

      const userRef = doc(db, "users", auth.currentUser.uid)

      await updateDoc(userRef, {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim()
      })

      const updated = {
        ...user,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim()
      }
      setUser(updated)
      setStoredKiwiUser(updated)
      setAlertState({
        open: true,
        tone: "success",
        title: "Profile saved",
        message: "Your Kiwi profile details were updated successfully.",
        primaryLabel: "Done"
      })
    } catch (err) {
      console.log(err)
      setAlertState({
        open: true,
        tone: "danger",
        title: "Update failed",
        message: "We could not save your profile right now. Please try again.",
        primaryLabel: "Close"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      setAlertState({
        open: true,
        tone: "warning",
        title: "Location unavailable",
        message: "Your browser does not support location detection on this device.",
        primaryLabel: "Okay"
      })
      return
    }

    setDetectingLocation(true)

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0
        })
      })

      const { latitude, longitude, accuracy } = position.coords
      const fallbackAddress = `Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)}`
      let detectedAddress = fallbackAddress

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
        )

        if (response.ok) {
          const data = await response.json()
          detectedAddress = data.display_name || fallbackAddress
        }
      } catch (error) {
        console.log(error)
      }

      setAddress(detectedAddress)

      const detectedPhone = phone.trim() || user?.phone || auth.currentUser?.phoneNumber || ""

      if (detectedPhone) {
        setPhone(detectedPhone)
      }

      setAlertState({
        open: true,
        tone: "success",
        title: "Location detected",
        message: `Your current location was filled in using the best available device accuracy (${Math.round(accuracy)}m).`,
        primaryLabel: "Done"
      })
    } catch (error) {
      console.log(error)
      setAlertState({
        open: true,
        tone: "danger",
        title: "Location detect failed",
        message: "We could not detect your current location right now. Please allow location access and try again.",
        primaryLabel: "Close"
      })
    } finally {
      setDetectingLocation(false)
    }
  }

  const resetInterests = async () => {
    try {
      if (!auth.currentUser) {
        setAlertState({
          open: true,
          tone: "danger",
          title: "Unable to reset",
          message: "You need to be signed in to reset your interests.",
          primaryLabel: "Close"
        })
        return
      }

      const userRef = doc(db, "users", auth.currentUser.uid)

      await updateDoc(userRef, {
        interestedIn: []
      })

      const updated = { ...user, interestedIn: [] }
      setUser(updated)
      setStoredKiwiUser(updated)
      setAlertState({
        open: true,
        tone: "success",
        title: "Interests cleared",
        message: "Your saved interests were reset successfully. Kiwi will rebuild your feed from fresh activity.",
        primaryLabel: "Done"
      })
    } catch (err) {
      console.log(err)
      setAlertState({
        open: true,
        tone: "danger",
        title: "Reset failed",
        message: "We could not reset your interests right now. Please try again.",
        primaryLabel: "Close"
      })
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <Navbar />
        <div className="profile-container">
          <div className="profile-hero profile-skeleton-block"></div>
          <div className="profile-card profile-skeleton-block"></div>
          <div className="profile-card profile-skeleton-block"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
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

      <div className="profile-container">
        <div className="profile-hero">
          <div className="profile-hero-main">
            <div className="profile-avatar">
              <UserRound size={24} strokeWidth={2.1} />
            </div>

            <div className="profile-hero-copy">
              <div className="profile-badge">
                <Sparkles size={14} />
                <span>Profile</span>
              </div>

              <h1 className="profile-title">{user?.name || "Kiwi User"}</h1>
              <p className="profile-subtitle">Manage your Kiwi identity, keep your interests fresh, and shape a cleaner personalized storefront.</p>
              <p className="profile-note">Your activity may be used to shape product recommendations and ads, and everything stays safe with Kiwi.</p>

              <div className="profile-meta">
                <div className="profile-meta-pill">
                  <ShieldCheck size={15} strokeWidth={2.2} />
                  <span>Profile synced</span>
                </div>
                <div className="profile-meta-pill">
                  <Sparkles size={15} strokeWidth={2.2} />
                  <span>{user?.interestedIn?.length || 0} interests saved</span>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-hero-aside">
            <div className="profile-aside-row">
              <span className="profile-aside-label">Account</span>
              <strong>{user?.email || "No email available"}</strong>
            </div>
            <div className="profile-aside-row">
              <span className="profile-aside-label">Experience</span>
              <strong>Personalized Kiwi feed</strong>
            </div>
          </div>
        </div>

        <div className="profile-grid">
          <div className="profile-card profile-card-edit">
            <div className="profile-card-head">
              <span className="profile-card-icon profile-card-icon-blue">
                <UserRound size={16} />
              </span>
              <div>
                <span className="profile-card-label">Identity</span>
                <span className="profile-card-title">Edit Profile</span>
              </div>
            </div>

            <p className="profile-card-copy">Keep your account name current so your shopping flow, sign-in experience, and profile identity stay consistent.</p>

            <div className="profile-info-row">
              <span className="profile-info-icon">
                <Mail size={14} />
              </span>
              <div>
                <span className="profile-info-label">Email</span>
                <p className="profile-info-value">{user?.email || "No email available"}</p>
              </div>
            </div>

            <div className="profile-info-row">
              <span className="profile-info-icon">
                <Phone size={14} />
              </span>
              <div>
                <span className="profile-info-label">Phone</span>
                <p className="profile-info-value">{phone || auth.currentUser?.phoneNumber || "No phone saved yet"}</p>
              </div>
            </div>

            <input
              className="profile-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
            />

            <input
              className="profile-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              inputMode="tel"
            />

            <div className="profile-location-head">
              <span className="profile-location-label">
                <MapPin size={14} />
                Address
              </span>
              <button
                type="button"
                className="profile-location-detect"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
              >
                <LocateFixed size={14} />
                {detectingLocation ? "Detecting..." : "Use Current Location"}
              </button>
            </div>

            <textarea
              className="profile-input profile-textarea"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address or use current location"
              rows={4}
            />

            <p className="profile-field-note">Current location uses the best available browser/device accuracy and may vary slightly by signal.</p>

            <button className="profile-save" onClick={updateProfile}>
              <PencilLine size={14} />
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>

          <div className="profile-card profile-card-interests">
            <div className="profile-card-head">
              <span className="profile-card-icon profile-card-icon-rose">
                <Sparkles size={16} />
              </span>
              <div>
                <span className="profile-card-label">Feed Logic</span>
                <span className="profile-card-title">Your Interests</span>
              </div>
            </div>

            <p className="profile-card-copy">These interests shape the products and recommendations you see across the Kiwi shopping flow.</p>

            <div className="profile-interests">
              {user?.interestedIn?.length > 0 ? (
                user.interestedIn.map((item) => (
                  <span key={item} className="interest-chip">
                    {item}
                  </span>
                ))
              ) : (
                <p className="empty-text">No interests selected</p>
              )}
            </div>

            <button className="profile-reset" onClick={resetInterests}>
              <RotateCcw size={14} />
              Reset Interests
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
