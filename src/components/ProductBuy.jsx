import { ArrowLeft, CircleAlert, ShieldCheck } from "lucide-react"
import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Navbar from "./Navbar"
import "./ProductBuy.css"

export default function ProductBuy() {
  const navigate = useNavigate()
  const { productId } = useParams()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="product-buy-page">
      <Navbar />

      <div className="product-buy-shell">
        <div className="product-buy-card">
          <button type="button" className="product-buy-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} strokeWidth={2.2} />
            Back
          </button>

          <div className="product-buy-head">
            <div className="product-buy-icon">
              <CircleAlert size={24} strokeWidth={2.2} />
            </div>

            <div>
              <span className="product-buy-label">Checkout status</span>
              <h1>Buying is currently unavailable</h1>
              <p className="product-buy-copy">
                This is a hackathon build, so direct purchasing is not supported right now. You can still explore the complete Kiwi product experience.
              </p>
            </div>
          </div>

          <div className="product-buy-info">
            <div className="product-buy-row">
              <span className="product-buy-label">Product ID</span>
              <strong>{productId}</strong>
            </div>

            <div className="product-buy-row">
              <span className="product-buy-label">Purchase support</span>
              <strong>Disabled for demo</strong>
            </div>
          </div>

          <div className="product-buy-note">
            <ShieldCheck size={16} strokeWidth={2.2} />
            <span>Kiwi is safe to browse and this page is part of the demo product flow.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
