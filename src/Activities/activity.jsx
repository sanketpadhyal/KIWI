import { useEffect, useState } from "react"
import "./activity.css"

export default function ActivityPage() {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [products, setProducts] = useState([])

  const fetchUsers = async () => {
    try {
      const res = await fetch("https://82c94322-7959-4532-a802-2e36b8acedfb-00-c9sm7uoe1gqw.sisko.replit.dev/engine/users")
      const data = await res.json()

      const safeUsers = (data.users || []).map(u => ({
        ...u,
        activity: u.activity || {},
        airdrop: Array.isArray(u.airdrop) ? u.airdrop : [],
        engine: u.engine || {}
      }))

      const sorted = safeUsers.sort(
        (a, b) => (b.engine?.lastTriggerAt || 0) - (a.engine?.lastTriggerAt || 0)
      )

      setUsers(sorted)
    } catch (err) {
      console.log(err)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch("https://82c94322-7959-4532-a802-2e36b8acedfb-00-c9sm7uoe1gqw.sisko.replit.dev/products")
      const data = await res.json()
      setProducts(data.products || [])
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchProducts()
    const interval = setInterval(fetchUsers, 3000)
    return () => clearInterval(interval)
  }, [])

  const getProductName = (id) => {
    const product = products.find(p => p.id === id)
    return product ? product.name : id
  }

  const activeAirdrop = Array.isArray(selectedUser?.airdrop)
    ? selectedUser.airdrop.find(a => a.expiresAt > Date.now())
    : null

  const safeJoin = (arr) =>
    Array.isArray(arr) && arr.length
      ? arr.map(id => getProductName(id)).join(", ")
      : "None"

  return (
    <div className="activity-container">

      <div className="users-panel">
        <div className="users-header">
          <h3>Live Users</h3>
          <span className="live-dot"></span>
        </div>

        {users.map((u) => (
          <div
            key={u.id}
            className={`user-card ${selectedUser?.id === u.id ? "active" : ""}`}
            onClick={() => setSelectedUser(u)}
          >
            <div className="user-id">User {u.id.slice(0, 6)}</div>
            <div className="user-meta">
              {u.engine?.lastTriggerAt
                ? `${Math.floor((Date.now() - u.engine.lastTriggerAt) / 1000)}s ago`
                : "inactive"}
            </div>
          </div>
        ))}
      </div>

      <div className="activity-panel">

        {!selectedUser && (
          <div className="empty-state">
            Select a user to view live activity
          </div>
        )}

        {selectedUser && (
          <>
            <div className="activity-header">
              <h3>User Activity</h3>
              <span className="badge">Live</span>
            </div>

            <div className="activity-box">
              <p>👁 Views: {safeJoin(selectedUser.activity?.views)}</p>
              <p>🖱 Clicks: {safeJoin(selectedUser.activity?.clicks)}</p>
              <p>🛒 Cart Add: {safeJoin(selectedUser.activity?.cartAdd)}</p>
              <p>❌ Removed: {safeJoin(selectedUser.activity?.cartRemove)}</p>
            </div>

            {activeAirdrop && (
              <div className="airdrop-box">
                <div className="airdrop-title">🎁 Active Offer</div>
                <div>Product: {getProductName(activeAirdrop.productId)}</div>
                <div>Discount: {activeAirdrop.discount}%</div>
                <div>Price: ₹{activeAirdrop.finalPrice}</div>
                <div className="timer">
                  Expires in {Math.max(0, Math.floor((activeAirdrop.expiresAt - Date.now()) / 60000))} min
                </div>
              </div>
            )}
          </>
        )}

      </div>

    </div>
  )
}