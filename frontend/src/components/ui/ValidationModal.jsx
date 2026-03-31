
import { useEffect, useRef } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X, Loader2 } from 'lucide-react'

const CFG = {
  success: { Icon: CheckCircle, ic: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', btn: 'bg-green-600 hover:bg-green-700 text-white', title: 'text-green-900', bar: '#22c55e' },
  error:   { Icon: XCircle,     ic: 'text-red-500',   bg: 'bg-red-50',   border: 'border-red-200',   btn: 'bg-red-600 hover:bg-red-700 text-white',   title: 'text-red-900',   bar: '#ef4444' },
  warning: { Icon: AlertTriangle,ic:'text-amber-500',  bg: 'bg-amber-50', border: 'border-amber-200', btn: 'bg-amber-600 hover:bg-amber-700 text-white', title: 'text-amber-900', bar: '#f59e0b' },
  info:    { Icon: Info,         ic: 'text-blue-500',  bg: 'bg-blue-50',  border: 'border-blue-200',  btn: 'bg-blue-600 hover:bg-blue-700 text-white',  title: 'text-blue-900',  bar: '#3b82f6' },
  loading: { Icon: Loader2,      ic: 'text-blue-500 animate-spin', bg: 'bg-blue-50', border: 'border-blue-200', btn: 'bg-blue-600 text-white', title: 'text-blue-900', bar: '#3b82f6' },
}

export function ValidationModal({ isOpen, type='info', title, message, detail, confirmText='OK', cancelText, onConfirm, onCancel, autoClose=0, list=[] }) {
  const c = CFG[type] || CFG.info
  const { Icon } = c
  const ref = useRef(null)

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !autoClose) return
    const t = setTimeout(() => onConfirm?.(), autoClose)
    return () => clearTimeout(t)
  }, [isOpen, autoClose])

  if (!isOpen) return null

  const handleOverlay = (e) => {
    if (e.target === ref.current && type !== 'loading') onCancel?.()
  }

  return (
    <div ref={ref} onClick={handleOverlay}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className={"w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden " + c.bg + " " + c.border}
        style={{ animation: 'modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>
        {autoClose > 0 && (
          <div className="h-1 bg-gray-200">
            <div style={{ height:'100%', background: c.bar, animation: 'barShrink ' + (autoClose/1000) + 's linear forwards' }} />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={"w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 " + c.bg} style={{ filter:'brightness(0.93)' }}>
              <Icon size={26} className={c.ic} />
            </div>
            <div className="flex-1">
              <h3 className={"text-lg font-bold " + c.title}>{title}</h3>
              {message && <p className="text-gray-600 text-sm mt-1 leading-relaxed">{message}</p>}
            </div>
            {type !== 'loading' && (
              <button onClick={onCancel || onConfirm} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                <X size={18} />
              </button>
            )}
          </div>
          {detail && (
            <div className="mt-4 bg-white/80 rounded-xl p-3 border border-gray-200">
              <p className="text-sm text-gray-700 font-mono leading-relaxed break-all">{detail}</p>
            </div>
          )}
          {list && list.length > 0 && (
            <ul className="mt-4 space-y-2">
              {list.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 text-white"
                    style={{ background: c.bar }}>{i + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
          {type !== 'loading' && (
            <div className={"flex gap-3 mt-6 " + (cancelText ? 'justify-end' : 'justify-center')}>
              {cancelText && (
                <button onClick={onCancel}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                  {cancelText}
                </button>
              )}
              <button onClick={onConfirm}
                className={"px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors " + c.btn}>
                {confirmText}
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes modalIn {
          from { opacity:0; transform: scale(0.85) translateY(-20px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
        @keyframes barShrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  )
}

export function FieldError({ message, show }) {
  if (!show || !message) return null
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-600 mt-1.5 font-medium">
      <XCircle size={13} className="flex-shrink-0" />
      {message}
    </p>
  )
}

export function ValidationBanner({ type='error', message, onDismiss, show }) {
  const c = CFG[type] || CFG.error
  const { Icon } = c
  if (!show) return null
  return (
    <div className={"flex items-center gap-3 p-3.5 rounded-xl border text-sm font-medium " + c.bg + " " + c.border}>
      <Icon size={17} className={c.ic + " flex-shrink-0"} />
      <p className={"flex-1 " + c.title}>{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
          <X size={15} />
        </button>
      )}
    </div>
  )
}
