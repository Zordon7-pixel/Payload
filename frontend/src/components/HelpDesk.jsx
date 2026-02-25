import { useState } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'

export default function HelpDesk() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [healing, setHealing] = useState(false)
  const [diag, setDiag] = useState(null)
  const [actions, setActions] = useState([])
  const [error, setError] = useState('')

  const loadDiagnostics = async () => {
    setLoading(true)
    setError('')
    setActions([])
    try {
      const res = await fetch('/api/diagnostics', {
        headers: { Authorization: `Bearer ${localStorage.getItem('hc_token') || ''}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to run diagnostics')
      setDiag(data)
    } catch (e) {
      setError(e.message || 'Failed to run diagnostics')
      setDiag(null)
    } finally {
      setLoading(false)
    }
  }

  const openModal = async () => {
    setOpen(true)
    await loadDiagnostics()
  }

  const runHeal = async () => {
    setHealing(true)
    setError('')
    try {
      const res = await fetch('/api/diagnostics/heal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('hc_token') || ''}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Auto-fix failed')
      setActions(data.actions || [])
      await loadDiagnostics()
    } catch (e) {
      setError(e.message || 'Auto-fix failed')
    } finally {
      setHealing(false)
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full text-xl font-bold shadow-lg"
        style={{ background: '#f59e0b', color: '#000' }}
        title="HelpDesk"
      >
        ?
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-3xl rounded-xl border p-5" style={{ background: '#1a1d2e', borderColor: '#2a2d3e' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: '#f59e0b' }}>PAYLOAD HelpDesk</h2>
              <button onClick={() => setOpen(false)} className="text-slate-300 hover:text-white"><X size={16} /></button>
            </div>

            {loading ? (
              <div className="py-10 text-center text-slate-300">
                <div className="inline-block w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-2" />
                <div>Running diagnostics...</div>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm font-semibold" style={{ color: diag?.ok ? '#22c55e' : '#ef4444' }}>
                  {diag?.ok ? 'All systems healthy' : 'Issues detected'}
                </div>

                {!!error && <div className="mb-4 text-red-400 text-sm">{error}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                  {(diag?.checks || []).map((c, i) => (
                    <div key={`${c.name}-${i}`} className="rounded-lg border p-3" style={{ borderColor: '#2a2d3e', background: '#121525' }}>
                      <div className="font-medium text-sm text-white inline-flex items-center gap-1.5">{c.ok ? <CheckCircle size={13} className="text-emerald-400" /> : <XCircle size={13} className="text-red-400" />} {c.name}</div>
                      <div className="text-xs text-slate-400 mt-1">{c.detail}</div>
                    </div>
                  ))}
                </div>

                {actions.length > 0 && (
                  <div className="mb-4 rounded-lg border p-3" style={{ borderColor: '#2a2d3e', background: '#121525' }}>
                    <div className="text-sm font-semibold mb-2" style={{ color: '#f59e0b' }}>Auto-Fix Actions</div>
                    <ul className="list-disc pl-5 text-sm text-slate-200 space-y-1">
                      {actions.map((a, i) => <li key={`${a}-${i}`}>{a}</li>)}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={runHeal}
                    disabled={healing || loading}
                    className="px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
                    style={{ background: '#f59e0b', color: '#000' }}
                  >
                    {healing ? 'Running Auto-Fix...' : 'Run Auto-Fix'}
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 rounded-lg border text-slate-200"
                    style={{ borderColor: '#2a2d3e' }}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
