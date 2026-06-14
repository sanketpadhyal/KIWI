import { ArrowRight, MonitorSmartphone, Shirt, ShoppingBag, Sparkles, SprayCan, Venus, Mars } from "lucide-react"
import { useState } from "react"
import { db } from "../firebase"
import { doc, updateDoc } from "firebase/firestore"
import Alert from "../components/Alert"
import { setStoredKiwiUser } from "../utils/kiwiUser"
import "./InterestPopup.css"

export default function InterestPopup({ user, open, setOpen }) {
  const [selected, setSelected] = useState([])
  const [gender, setGender] = useState("")
  const [loading, setLoading] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [alertState, setAlertState] = useState({
    open: false,
    tone: "default",
    title: "",
    message: "",
    primaryLabel: "Close"
  })

  if (!open) return null

  const categories = ["Clothing", "Shoes", "Perfumes", "Accessories", "Tech"]
  const minimumSelection = 2

  const categoryIcons = {
    Clothing: <Shirt size={16} strokeWidth={2.1} />,
    Shoes: <ShoppingBag size={16} strokeWidth={2.1} />,
    Perfumes: <SprayCan size={16} strokeWidth={2.1} />,
    Accessories: <Sparkles size={16} strokeWidth={2.1} />,
    Tech: <MonitorSmartphone size={16} strokeWidth={2.1} />
  }

  const toggleCategory = (item) => {
    if (selected.includes(item)) {
      setSelected(selected.filter(i => i !== item))
    } else {
      setSelected([...selected, item])
    }
  }

  const saveData = async () => {
    if (selected.length < minimumSelection || !gender) {
      setShowValidation(true)
      setAlertState({
        open: true,
        tone: "warning",
        title: "Complete your setup",
        message: !gender
          ? "Please select your preference and at least 2 interests to continue with Kiwi."
          : "Please select at least 2 interests to continue with Kiwi.",
        primaryLabel: "Okay"
      })
      return
    }

    try {
      setLoading(true)

      const userRef = doc(db, "users", user.uid)

      await updateDoc(userRef, {
        interestedIn: selected,
        gender: gender
      })

      const updatedUser = {
        ...user,
        interestedIn: selected,
        gender: gender
      }

      setStoredKiwiUser(updatedUser)

      setAlertState({
        open: true,
        tone: "success",
        title: "Preferences saved",
        message: "Your interests have been saved. Your feed will now be based on your interests. If you want to reset them, visit your profile page and refresh the website for the best experience.",
        primaryLabel: "Continue"
      })
    } catch (err) {
      console.log(err)
      setAlertState({
        open: true,
        tone: "danger",
        title: "Save failed",
        message: "We could not save your interests right now. Please try again.",
        primaryLabel: "Close"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="interest-overlay">
      <Alert
        open={alertState.open}
        tone={alertState.tone}
        title={alertState.title}
        message={alertState.message}
        primaryLabel={alertState.primaryLabel}
        secondaryLabel="Dismiss"
        onClose={() => {
          const isSuccess = alertState.tone === "success"

          setAlertState((current) => ({ ...current, open: false }))

          if (isSuccess) {
            setOpen(false)
          }
        }}
      />
      <div className="interest-box">
        <h2>Personalize your Kiwi experience</h2>
        <p className="interest-lead">
          Select your preference and at least two interests for better recommendations.
        </p>

        <div className="interest-gender">
          <p className="interest-source-label">Select your preference</p>
          {showValidation && !gender && (
            <p className="interest-error-text">Please select your preference.</p>
          )}

          <div className="gender-options">
            <button
              type="button"
              className={gender === "Male" ? "active male" : "male"}
              onClick={() => setGender("Male")}
            >
              <span className="gender-button-icon">
                <Mars size={16} strokeWidth={2.1} />
              </span>
              <span>Male</span>
            </button>

            <button
              type="button"
              className={gender === "Female" ? "active female" : "female"}
              onClick={() => setGender("Female")}
            >
              <span className="gender-button-icon">
                <Venus size={16} strokeWidth={2.1} />
              </span>
              <span>Female</span>
            </button>
          </div>
        </div>

        <div className="interest-grid">
          {categories.map(item => (
            <button
              type="button"
              key={item}
              className={`interest-item ${selected.includes(item) ? "active" : ""}`}
              onClick={() => toggleCategory(item)}
            >
              <span className="interest-item-icon">{categoryIcons[item]}</span>
              <span>{item}</span>
            </button>
          ))}
        </div>

        {showValidation && selected.length < minimumSelection && (
          <p className="interest-error-text">Please select at least 2 products.</p>
        )}

        <button
          type="button"
          className="interest-save"
          onClick={saveData}
          disabled={loading}
        >
          <span>{loading ? "Saving your preferences..." : "Continue to Kiwi"}</span>
          {!loading && <ArrowRight size={16} />}
        </button>

      </div>
    </div>
  )
}
