import { useEffect, useRef } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X, Loader2 } from 'lucide-react'

const CONFIG = {
  success: {
    icon: CheckCircle,
    iconClass: 'text-green-500',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    btnClass: 'bg-green-600 hover:bg-green-700 text-white',
    titleClass: 'text-green-900',
    barClass: 'bg-green-500',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-red-500',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    btnClass: 'bg-red-600 hover:bg-red-700 text-white',
    titleClass: 'text-red-900',
    barClass: 'bg-red-500',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    titleClass: 'text-amber-900',
    barClass: 'bg-amber-500',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-500',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    titleClass: 'text-blue-900',
    barClass: 'bg-blue-500',
  },
  loading: {
    icon: Loader2,
    iconClass: 'text-blue-500 animate-spin',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    titleClass: 'text-blue-900',
    barClass: 'bg-blue-500',
  }
}

export function ValidationModal({
  isOpen, type = 'info', title, message, detail,
  confirmText = 'OK', cancelText, onConfirm, onCancel,
  autoClose = 0, showProgress = false, list = []
}) {
  const cfg = CONFIG[type] || CONFIG.info
  const Icon = cfg.icon
  const overlayRef = useRef(null)

  useEffect(() => {
    if (!isOpen || !autoClose) return
    const timer = setTimeout(() => { onConfirm?.() }, autoClose)
    return () => clearTimeout(timer)
  }, [isOpen, autoClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current && type !== 'loading') onCancel?.()
  }

  return (
    <div ref={overlayRef} onClick={handleOverlayClick}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div
        className={"w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transform transition-all " + cfg.bgClass + " " + cfg.borderClass}
        style={{ animation: 'modalSlideIn 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}>

        {/* Progress bar for autoClose */}
        {autoClose > 0 && (
          <div className="h-1 bg-gray-200">
            <div className={"h-full " + cfg.barClass}
              style={{ animation: "progressBar " + (autoClose/1000) + "s linear forwards" }} />
          </div>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className={"w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 " + cfg.bgClass} style={{ filter: 'brightness(0.95)' }}>
              <Icon size={26} className={cfg.iconClass} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={"text-lg font-bold leading-tight " + cfg.titleClass}>{title}</h3>
              {message && <p className="text-gray-600 text-sm mt-1 leading-relaxed">{message}</p>}
            </div>
            {type !== 'loading' && (
              <button onClick={onCancel || onConfirm} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
                <X size={18} />
              </button>
            )}
          </div>

          {/* Detail box */}
          {detail && (
            <div className="mt-4 bg-white/80 rounded-xl p-3 border border-gray-200">
              <p className="text-sm text-gray-700 font-mono leading-relaxed">{detail}</p>
            </div>
          )}

          {/* List items */}
          {list.length > 0 && (
            <ul className="mt-4 space-y-2">
              {list.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className={"w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 " + cfg.barClass.replace('bg-','bg-') + " text-white"}>
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          )}

          {/* Actions */}
          {type !== 'loading' && (
            <div className={"flex gap-3 mt-6 " + (cancelText ? 'justify-end' : 'justify-center')}>
              {cancelText && (
                <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                  {cancelText}
                </button>
              )}
              <button onClick={onConfirm} className={"px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors " + cfg.btnClass}>
                {confirmText}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.85) translateY(-20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes progressBar {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  )
}

// Toast-style inline validation banner
export function ValidationBanner({ type = 'error', message, onDismiss, show }) {
  const cfg = CONFIG[type] || CONFIG.error
  const Icon = cfg.icon

  if (!show) return null
  return (
    <div className={"flex items-center gap-3 p-4 rounded-xl border text-sm font-medium " + cfg.bgClass + " " + cfg.borderClass}
      style={{ animation: 'fadeIn 0.2s ease' }}>
      <Icon size={18} className={cfg.iconClass + " flex-shrink-0"} />
      <p className={"flex-1 " + cfg.titleClass}>{message}</p>
      {onDismiss && <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}

// Field-level inline error
export function FieldError({ message, show }) {
  if (!show || !message) return null
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-600 mt-1.5 font-medium"
      style={{ animation: 'fadeIn 0.15s ease' }}>
      <XCircle size={13} className="flex-shrink-0" />
      {message}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </p>
  )
}

// Hook for easy modal management
export function useModal() {
  const [modal, setModal] = require('react').useState({ isOpen: false })

  const show = (config) => setModal({ isOpen: true, ...config })
  const hide = () => setModal(m => ({ ...m, isOpen: false }))

  const success = (title, message, opts = {}) => show({ type: 'success', title, message, ...opts, onConfirm: () => { opts.onConfirm?.(); hide() }, onCancel: hide })
  const error   = (title, message, opts = {}) => show({ type: 'error',   title, message, ...opts, onConfirm: () => { opts.onConfirm?.(); hide() }, onCancel: hide })
  const warning = (title, message, opts = {}) => show({ type: 'warning', title, message, ...opts, onConfirm: () => { opts.onConfirm?.(); hide() }, onCancel: hide })
  const info    = (title, message, opts = {}) => show({ type: 'info',    title, message, ...opts, onConfirm: () => { opts.onConfirm?.(); hide() }, onCancel: hide })
  const loading = (title, message)            => show({ type: 'loading', title, message, onConfirm: hide, onCancel: hide })
  const confirm = (title, message, opts = {}) => new Promise(resolve => {
    show({ type: 'warning', title, message, confirmText: 'Confirm', cancelText: 'Cancel', ...opts,
      onConfirm: () => { hide(); resolve(true) },
      onCancel:  () => { hide(); resolve(false) }
    })
  })

  return { modal, show, hide, success, error, warning, info, loading, confirm, ValidationModal: () => require('react').createElement(ValidationModal, modal) }
}
