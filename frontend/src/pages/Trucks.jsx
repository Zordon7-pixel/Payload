import { useEffect, useState } from 'react'
import { Truck, Plus, X, AlertTriangle } from 'lucide-react'
import api from '../lib/api'

export default function Trucks() {
  const [trucks, setTrucks] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    truck_number: '',
    make: '',
    model: '',
    year: '',
    plate: '',
    state: '',
    dot_number: '',
    registration_expiry: '',
    dot_inspection_expiry: '',
  })

  const load = () => api.get('/trucks').then(r => setTrucks(r.data.trucks || []))
  useEffect(() => { load() }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const inp = 'w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500'
  const lbl = 'block text-xs font-medium text-slate-400 mb-1'

  function getExpiryStatus(date) {
    if (!date) return { cls: 'text-slate-400', warn: false, expired: false }
    const diff = Math.ceil((new Date(date) - new Date()) / 86400000)
    if (diff < 0) return { cls: 'text-red-400', warn: false, expired: true }
    if (diff <= 30) return { cls: 'text-amber-400', warn: true, expired: false }
    return { cls: 'text-slate-300', warn: false, expired: false }
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!form.truck_number.trim()) return setError('Truck number is required.')
    if (form.year && !/^\d{4}$/.test(form.year)) return setError('Year must be 4 digits.')
    setSaving(true)
    try {
      const { data } = await api.post('/trucks', {
        name: form.truck_number.trim(),
        year: form.year || null,
        make: form.make || null,
        model: form.model || null,
        plate: form.plate || null,
        vin: form.dot_number || null,
        truck_number: form.truck_number.trim(),
        state: form.state || null,
        dot_number: form.dot_number || null,
        registration_expiry: form.registration_expiry || null,
        dot_inspection_expiry: form.dot_inspection_expiry || null,
      })

      if (data?.id && (form.registration_expiry || form.dot_inspection_expiry)) {
        await api.put(`/maintenance/truck/${data.id}/compliance`, {
          registration_expiry: form.registration_expiry || null,
          dot_inspection_date: form.dot_inspection_expiry || null,
        })
      }
      setShowAdd(false)
      setForm({
        truck_number: '', make: '', model: '', year: '', plate: '', state: '', dot_number: '', registration_expiry: '', dot_inspection_expiry: '',
      })
      load()
    } catch {
      setError('Could not add truck.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Fleet</h1>
          <p className="text-slate-500 text-sm">{trucks.length} trucks</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Add Truck
        </button>
      </div>

      <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1f2937] text-slate-400">
              <th className="text-left px-4 py-3">Truck</th>
              <th className="text-left px-4 py-3">Plate</th>
              <th className="text-left px-4 py-3">Loads</th>
              <th className="text-left px-4 py-3">Revenue</th>
              <th className="text-left px-4 py-3">DOT Expiry</th>
              <th className="text-left px-4 py-3">Reg Expiry</th>
            </tr>
          </thead>
          <tbody>
            {trucks.map(t => {
              const dotDate = t.dot_inspection_expiry || t.dot_inspection_date
              const regDate = t.registration_expiry
              const dot = getExpiryStatus(dotDate)
              const reg = getExpiryStatus(regDate)
              return (
                <tr key={t.id} className="border-b border-[#1f2937]/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Truck size={16} className="text-amber-400" />
                      <div>
                        <div className="font-semibold text-white">{t.name}</div>
                        <div className="text-xs text-slate-500">{t.year} {t.make} {t.model}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{t.plate || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{t.total_loads || 0}</td>
                  <td className="px-4 py-3 text-emerald-400">${parseFloat(t.total_revenue || 0).toFixed(0)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 ${dot.cls}`}>
                      {dot.expired && <AlertTriangle size={13} />}
                      {dotDate || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 ${reg.cls}`}>
                      {reg.expired && <AlertTriangle size={13} />}
                      {regDate || '—'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] rounded-2xl border border-[#1f2937] w-full max-w-xl">
            <div className="flex items-center justify-between p-5 border-b border-[#1f2937]">
              <h2 className="font-bold text-white">Add Truck</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={submit} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Truck Number *</label><input className={inp} value={form.truck_number} onChange={e => set('truck_number', e.target.value)} /></div>
                <div><label className={lbl}>Year</label><input className={inp} value={form.year} onChange={e => set('year', e.target.value)} placeholder="2026" /></div>
                <div><label className={lbl}>Make</label><input className={inp} value={form.make} onChange={e => set('make', e.target.value)} /></div>
                <div><label className={lbl}>Model</label><input className={inp} value={form.model} onChange={e => set('model', e.target.value)} /></div>
                <div><label className={lbl}>Plate</label><input className={inp} value={form.plate} onChange={e => set('plate', e.target.value)} /></div>
                <div><label className={lbl}>State</label><input className={inp} value={form.state} onChange={e => set('state', e.target.value)} /></div>
                <div><label className={lbl}>DOT Number</label><input className={inp} value={form.dot_number} onChange={e => set('dot_number', e.target.value)} /></div>
                <div><label className={lbl}>Registration Expiry</label><input className={inp} type="date" value={form.registration_expiry} onChange={e => set('registration_expiry', e.target.value)} /></div>
                <div><label className={lbl}>DOT Inspection Expiry</label><input className={inp} type="date" value={form.dot_inspection_expiry} onChange={e => set('dot_inspection_expiry', e.target.value)} /></div>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex gap-2 justify-end pt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white text-sm px-3 py-2">Cancel</button>
                <button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : 'Add Truck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
