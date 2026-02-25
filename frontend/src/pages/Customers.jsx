import { Fragment, useEffect, useMemo, useState } from 'react'
import { Plus, X, Building2 } from 'lucide-react'
import api from '../lib/api'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loads, setLoads] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', type: 'broker', contact_name: '', email: '', phone: '' })

  const loadData = async () => {
    const [customerRes, loadRes] = await Promise.all([
      api.get('/customers'),
      api.get('/loads'),
    ])
    setCustomers(customerRes.data.customers || [])
    setLoads(loadRes.data.loads || [])
  }

  useEffect(() => {
    loadData().catch(() => {})
  }, [])

  const totalsByCustomer = useMemo(() => {
    const map = new Map()
    loads.forEach(l => {
      const key = l.customer_id
      if (!key) return
      if (!map.has(key)) map.set(key, { loads: 0, revenue: 0 })
      const row = map.get(key)
      row.loads += 1
      row.revenue += Number(l.gross_revenue || 0)
    })
    return map
  }, [loads])

  const inp = 'w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500'
  const lbl = 'block text-xs font-medium text-slate-400 mb-1'

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Customer name is required.')
    setSaving(true)
    try {
      await api.post('/customers', {
        name: form.name.trim(),
        source: form.type,
        contact_name: form.contact_name || null,
        email: form.email || null,
        phone: form.phone || null,
      })
      setShowAdd(false)
      setForm({ name: '', type: 'broker', contact_name: '', email: '', phone: '' })
      await loadData()
    } catch {
      setError('Could not add customer.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Customers</h1>
          <p className="text-slate-500 text-sm">{customers.length} customers</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1f2937] text-slate-400">
              <th className="text-left px-4 py-3">Customer Name</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Contact</th>
              <th className="text-left px-4 py-3">Total Loads</th>
              <th className="text-left px-4 py-3">Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => {
              const totals = totalsByCustomer.get(c.id) || { loads: 0, revenue: 0 }
              const isExpanded = expanded === c.id
              const history = loads.filter(l => l.customer_id === c.id)
              return (
                <Fragment key={c.id}>
                  <tr onClick={() => setExpanded(isExpanded ? null : c.id)} className="border-b border-[#1f2937]/60 cursor-pointer hover:bg-[#0a0f1e]">
                    <td className="px-4 py-3 text-white">{c.name}</td>
                    <td className="px-4 py-3 text-slate-300 capitalize">{(c.source || 'direct') === 'direct' ? 'direct' : 'broker'}</td>
                    <td className="px-4 py-3 text-slate-300">{c.contact_name || c.phone || c.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-300">{totals.loads}</td>
                    <td className="px-4 py-3 text-emerald-400">${totals.revenue.toLocaleString()}</td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-b border-[#1f2937]/60">
                      <td colSpan={5} className="px-4 py-3 bg-[#0a0f1e]">
                        <div className="text-xs text-slate-400 mb-2">Load History</div>
                        {history.length === 0 ? (
                          <p className="text-xs text-slate-500">No loads found for this customer.</p>
                        ) : (
                          <div className="space-y-1">
                            {history.map(l => (
                              <div key={l.id} className="text-xs text-slate-300 flex items-center justify-between">
                                <span>{l.load_number} · {l.pickup_location || '—'} to {l.dropoff_location || '—'}</span>
                                <span className="text-amber-400">${Number(l.gross_revenue || 0).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] rounded-2xl border border-[#1f2937] w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-[#1f2937]">
              <h2 className="font-bold text-white inline-flex items-center gap-2"><Building2 size={16} className="text-amber-400" /> Add Customer</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={submit} className="p-5 space-y-3">
              <div><label className={lbl}>Name *</label><input className={inp} value={form.name} onChange={e => set('name', e.target.value)} /></div>
              <div><label className={lbl}>Type</label>
                <select className={inp} value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="broker">broker</option>
                  <option value="direct">direct</option>
                </select>
              </div>
              <div><label className={lbl}>Contact Name</label><input className={inp} value={form.contact_name} onChange={e => set('contact_name', e.target.value)} /></div>
              <div><label className={lbl}>Email</label><input className={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
              <div><label className={lbl}>Phone</label><input className={inp} value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex gap-2 justify-end pt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white text-sm px-3 py-2">Cancel</button>
                <button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Add Customer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
