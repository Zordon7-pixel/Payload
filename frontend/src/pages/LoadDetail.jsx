import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, DollarSign, AlertTriangle, CheckCircle, Edit, X, Save } from 'lucide-react'
import api from '../lib/api'
import { STATUS_COLORS, STATUS_LABELS } from './Loads'
import { getTokenPayload } from '../lib/auth'

const STAGES = ['pending','dispatched','loaded','in_transit','delivered','invoiced','paid']

export default function LoadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [load, setLoad] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    miles: '',
    rate: '',
    pickup_date: '',
    delivery_date: '',
    origin: '',
    destination: '',
  })
  const [notes, setNotes] = useState([])
  const [noteText, setNoteText] = useState('')
  const fetch = () => api.get(`/loads/${id}`).then(r => setLoad(r.data))
  useEffect(() => { fetch() }, [id])
  useEffect(() => {
    if (!load) return
    setEditForm({
      miles: load.miles || '',
      rate: load.rate_per_mile || load.flat_rate || load.rate_per_ton || load.rate || '',
      pickup_date: load.pickup_date || '',
      delivery_date: load.delivery_date || '',
      origin: load.pickup_location || load.origin || '',
      destination: load.dropoff_location || load.destination || '',
    })
  }, [load])
  useEffect(() => {
    if (!load) return
    loadNotes()
  }, [load?.id])

  if (!load) return <div className="flex items-center justify-center h-64 text-slate-500">Loading...</div>

  const currentIdx = STAGES.indexOf(load.status)

  async function advance() {
    if (currentIdx < STAGES.length - 1) {
      await api.put(`/loads/${id}/status`, { status: STAGES[currentIdx + 1] })
      fetch()
    }
  }

  const gross = parseFloat(load.gross_revenue || 0)
  const net = parseFloat(load.net_profit || 0)
  const margin = gross > 0 ? Math.round((net / gross) * 100) : 0
  const token = getTokenPayload()

  function parseNotes(raw) {
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed
      } catch {}
      return [{ author: 'System', timestamp: load.updated_at || new Date().toISOString(), text: raw }]
    }
    return []
  }

  async function loadNotes() {
    try {
      const { data } = await api.get(`/loads/${id}/notes`)
      setNotes(Array.isArray(data?.notes) ? data.notes : [])
    } catch {
      setNotes(parseNotes(load.notes))
    }
  }

  async function saveEdit() {
    setSaving(true)
    try {
      const payload = {
        miles: Number(editForm.miles || 0),
        pickup_date: editForm.pickup_date || null,
        delivery_date: editForm.delivery_date || null,
        pickup_location: editForm.origin || null,
        dropoff_location: editForm.destination || null,
      }
      if (load.rate_type === 'per_mile') payload.rate_per_mile = Number(editForm.rate || 0)
      else if (load.rate_type === 'flat_rate') payload.flat_rate = Number(editForm.rate || 0)
      else if (load.rate_type === 'per_ton') payload.rate_per_ton = Number(editForm.rate || 0)
      else payload.rate = Number(editForm.rate || 0)
      await api.put(`/loads/${id}`, payload)
      await fetch()
      setEditMode(false)
    } finally {
      setSaving(false)
    }
  }

  async function addNote() {
    if (!noteText.trim()) return
    const note = {
      author: token?.name || token?.email || 'User',
      timestamp: new Date().toISOString(),
      text: noteText.trim(),
    }
    try {
      await api.post(`/loads/${id}/notes`, { note: note.text, author: note.author })
      setNoteText('')
      loadNotes()
    } catch {
      const nextNotes = [...notes, note]
      await api.put(`/loads/${id}`, { notes: JSON.stringify(nextNotes) })
      setNotes(nextNotes)
      setNoteText('')
      fetch()
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/loads')} className="text-slate-400 hover:text-white transition-colors"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-xl font-bold text-white">{load.load_number}</h1>
          <p className="text-slate-500 text-sm capitalize">{load.material} · {load.truck?.name} · {load.customer?.name}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <span className="text-xs px-3 py-1.5 rounded-full font-bold uppercase" style={{background: STATUS_COLORS[load.status]+'22', color: STATUS_COLORS[load.status]}}>
            {STATUS_LABELS[load.status]}
          </span>
          {currentIdx < STAGES.length - 1 && (
            <button onClick={advance} className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
              → {STATUS_LABELS[STAGES[currentIdx + 1]]}
            </button>
          )}
          {['delivered','invoiced','paid'].includes(load.status) && (
            <button onClick={() => navigate(`/invoice/${load.id}`)}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
              <FileText size={12}/> Invoice
            </button>
          )}
          <button
            onClick={() => { setEditMode(v => !v); if (editMode) fetch() }}
            className="flex items-center gap-1 bg-[#1f2937] hover:bg-[#293548] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            {editMode ? <X size={12} /> : <Edit size={12} />}{editMode ? 'Cancel' : 'Edit'}
          </button>
          {editMode && (
            <button onClick={saveEdit} disabled={saving} className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
              <Save size={12} /> {saving ? 'Saving...' : 'Save'}
            </button>
          )}
          {!load.paid && ['delivered','invoiced'].includes(load.status) && (
            <button onClick={async () => { await api.put(`/loads/${load.id}`, { paid: 1 }); fetch() }}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
              <CheckCircle size={12} /> Mark Paid
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-4">
        <div className="flex gap-1 mb-3">
          {STAGES.map((s, i) => (
            <div key={s} className="flex-1 h-1.5 rounded-full" style={{background: i <= currentIdx ? STATUS_COLORS[s] : '#1f2937'}} />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>Pending</span><span>Paid</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Load Details</h2>
          <div className="space-y-2">
            {[
              ['Freight Type', load.material],
              ['From', editMode ? <input value={editForm.origin} onChange={e => setEditForm(f => ({ ...f, origin: e.target.value }))} className="bg-[#0a0f1e] border border-[#1f2937] rounded px-2 py-1 text-xs text-white w-44" /> : load.pickup_location],
              ['To', editMode ? <input value={editForm.destination} onChange={e => setEditForm(f => ({ ...f, destination: e.target.value }))} className="bg-[#0a0f1e] border border-[#1f2937] rounded px-2 py-1 text-xs text-white w-44" /> : load.dropoff_location],
              load.tons > 0 ? ['Weight', `${load.tons} tons`] : null,
              ['Miles', editMode ? <input type="number" value={editForm.miles} onChange={e => setEditForm(f => ({ ...f, miles: e.target.value }))} className="bg-[#0a0f1e] border border-[#1f2937] rounded px-2 py-1 text-xs text-white w-24" /> : (load.miles > 0 ? `${load.miles} mi` : '—')],
              ['Source', load.source],
              ['Pickup Date', editMode ? <input type="date" value={editForm.pickup_date} onChange={e => setEditForm(f => ({ ...f, pickup_date: e.target.value }))} className="bg-[#0a0f1e] border border-[#1f2937] rounded px-2 py-1 text-xs text-white" /> : load.pickup_date],
              ['Delivered', editMode ? <input type="date" value={editForm.delivery_date} onChange={e => setEditForm(f => ({ ...f, delivery_date: e.target.value }))} className="bg-[#0a0f1e] border border-[#1f2937] rounded px-2 py-1 text-xs text-white" /> : (load.delivery_date || '—')],
            ].filter(Boolean).map(([k,v]) => (
              <div key={k} className="flex justify-between text-xs">
                <span className="text-slate-500">{k}</span>
                <span className="text-white font-medium capitalize">{v || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 inline-flex items-center gap-1.5"><DollarSign size={12} /> Financials</h2>
          <div className="space-y-2">
            {[
              ['Rate Type', ({ per_mile:'Per Mile', flat_rate:'Flat Rate', per_ton:'Per Ton' })[load.rate_type] || load.rate_type],
              ['Rate', editMode ? <input type="number" value={editForm.rate} onChange={e => setEditForm(f => ({ ...f, rate: e.target.value }))} className="bg-[#0a0f1e] border border-[#1f2937] rounded px-2 py-1 text-xs text-white w-24" /> : `$${(load.rate_per_mile || load.flat_rate || load.rate_per_ton || load.rate || 0)}`],
              ['Gross Revenue', `$${gross.toFixed(2)}`],
              ['Fuel Cost', `-$${parseFloat(load.fuel_cost||0).toFixed(2)}`],
              ['Driver Pay', `-$${parseFloat(load.driver_pay||0).toFixed(2)}`],
              ['Other Expenses', `-$${parseFloat(load.other_expenses||0).toFixed(2)}`],
            ].filter(Boolean).map(([k,v]) => (
              <div key={k} className="flex justify-between text-xs">
                <span className="text-slate-500">{k}</span>
                <span className={`font-medium ${v?.startsWith('-') ? 'text-red-400' : 'text-white'}`}>{v}</span>
              </div>
            ))}
            <div className="border-t border-[#1f2937] pt-2 flex justify-between text-sm font-bold">
              <span className="text-emerald-400">Net Profit</span>
              <span className={net >= 0 ? 'text-emerald-400' : 'text-red-400'}>${net.toFixed(2)} ({margin}%)</span>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${load.paid ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
              {load.paid ? <span className="inline-flex items-center gap-1"><CheckCircle size={10} /> PAID</span> : <span className="inline-flex items-center gap-1"><AlertTriangle size={10} /> UNPAID</span>}
            </span>
            <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${load.invoice_sent ? 'bg-blue-900/40 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
              {load.invoice_sent ? <span className="inline-flex items-center gap-1"><CheckCircle size={10} /> INVOICED</span> : 'INVOICE PENDING'}
            </span>
          </div>
        </div>

        <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Truck</h2>
          <div className="space-y-2">
            {[
              ['Name', load.truck?.name],
              ['Year/Make/Model', `${load.truck?.year} ${load.truck?.make} ${load.truck?.model}`],
              ['Plate', load.truck?.plate],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between text-xs">
                <span className="text-slate-500">{k}</span>
                <span className="text-white font-medium">{v || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-4 md:col-span-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Notes</h2>
          <div className="space-y-2 mb-3">
            {notes.length === 0 ? (
              <p className="text-xs text-slate-500">No notes yet.</p>
            ) : notes.map((n, i) => (
              <div key={`${n.timestamp || i}-${i}`} className="bg-[#0a0f1e] border border-[#1f2937] rounded-lg p-2">
                <div className="text-[10px] text-slate-500">{n.author || 'User'} · {n.timestamp ? new Date(n.timestamp).toLocaleString() : '—'}</div>
                <div className="text-xs text-slate-200 mt-1 whitespace-pre-wrap">{n.text || n.note || ''}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note" className="flex-1 bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500" />
            <button onClick={addNote} className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-3 py-2 rounded-lg transition-colors">Add Note</button>
          </div>
        </div>
      </div>
    </div>
  )
}
