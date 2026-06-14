import { AlertCircle, ArrowRight, CheckCircle2, Info, TriangleAlert, X } from "lucide-react"
import "./Alert.css"

const toneConfig = {
  default: {
    icon: Info,
    badge: "Notice"
  },
  success: {
    icon: CheckCircle2,
    badge: "Success"
  },
  warning: {
    icon: TriangleAlert,
    badge: "Warning"
  },
  danger: {
    icon: AlertCircle,
    badge: "Alert"
  }
}

export default function Alert({
  open = false,
  tone = "default",
  title = "Kiwi alert",
  message = "",
  badge,
  onClose,
  primaryLabel = "Continue",
  onPrimary,
  secondaryLabel = "Close",
  onSecondary,
  children
}) {
  if (!open) {
    return null
  }

  const config = toneConfig[tone] || toneConfig.default
  const Icon = config.icon

  return (
    <div className="alert-overlay" onClick={onClose}>
      <div
        className={`alert-box alert-${tone}`}
        onClick={(event) => event.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
      >
        <button type="button" className="alert-close" onClick={onClose} aria-label="Close alert">
          <X size={17} />
        </button>

        <div className="alert-head">
          <span className="alert-icon-wrap">
            <Icon size={18} strokeWidth={2.3} />
          </span>

          <div className="alert-copy">
            <span className="alert-badge">{badge || config.badge}</span>
            <h3>{title}</h3>
            {message ? <p>{message}</p> : null}
          </div>
        </div>

        {children ? <div className="alert-body">{children}</div> : null}

        <div className="alert-actions">
          <button type="button" className="alert-secondary" onClick={onSecondary || onClose}>
            {secondaryLabel}
          </button>
          <button type="button" className="alert-primary" onClick={onPrimary || onClose}>
            <span>{primaryLabel}</span>
            <ArrowRight size={15} strokeWidth={2.3} />
          </button>
        </div>
      </div>
    </div>
  )
}
