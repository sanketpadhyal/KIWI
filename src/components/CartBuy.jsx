import { ArrowLeft, CircleAlert, ShieldCheck } from "lucide-react"
import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import Navbar from "./Navbar"
import "./ProductBuy.css"

export default function CartBuy() {
  const navigate = useNavigate()
  const location = useLocation()
  const itemCount = location.state?.itemCount || 0
  const totalAmount = location.state?.totalAmount || 0
  const sessionToken = location.state?.sessionToken || "Not available"

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
              <h1>Cart checkout is currently unavailable</h1>
              <p className="product-buy-copy">
                This is a hackathon build, so full cart checkout is not supported right now. You can still explore the complete Kiwi cart and product flow.
              </p>
            </div>
          </div>

          <div className="product-buy-info">
            <div className="product-buy-row">
              <span className="product-buy-label">Items in cart</span>
              <strong>{itemCount}</strong>
            </div>

            <div className="product-buy-row">
              <span className="product-buy-label">Estimated total</span>
              <strong>₹{totalAmount}</strong>
            </div>

            <div className="product-buy-row">
              <span className="product-buy-label">Cart session</span>
              <strong>{sessionToken}</strong>
            </div>
          </div>

          <div className="product-buy-note">
            <ShieldCheck size={16} strokeWidth={2.2} />
            <span>Kiwi is safe to browse and this page is part of the demo checkout flow for your cart.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
