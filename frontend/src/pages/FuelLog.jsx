import { useEffect, useState } from 'react'
import { Fuel, Plus, X, Trash2, TrendingDown, DollarSign, Droplets, MapPin } from 'lucide-react'
import api from '../lib/api'
import { isOwner } from '../lib/auth'

const inp = 'w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors'
const lbl = 'block text-xs font-medium text-slate-400 mb-1.5'

export default function FuelLog() {
  const [logs, setLogs]         = useState([])
  const [summary, setSummary]   = useState([])
  const [totalSpend, setTotal]  = useState(0)
  const [trucks, setTrucks]     = useState([])
  const [drivers, setDrivers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(null)
  const owner = isOwner()

  const today = new Date().toISOString().split('T')[0]
  const emptyForm = { truck_id:'', driver_id:'', log_date:today, gallons:'', price_per_gallon:'', total_cost:'', odometer:'', location:'', notes:'' }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [fuelRes, truckRes, driverRes] = await Promise.all([
        api.get('/fuel'),
        api.get('/trucks'),
        api.get('/drivers').catch(() => ({ data: { drivers: [] } })),
      ])
      setLogs(fuelRes.data.logs || [])
      setSummary(fuelRes.data.summary || [])
      setTotal(fuelRes.data.totalSpend || 0)
      setTrucks(truckRes.data.trucks || [])
      setDrivers(driverRes.data.drivers || [])
    } finally { setLoading(false) }
  }

  function f(v) { setForm(prev => ({ ...prev, ...v }) ) }

  // Auto-calculate total cost when gallons + price change
  useEffect(() => {
    if (form.gallons && form.price_per_gallon) {
      const total = (parseFloat(form.gallons) * parseFloat(form.price_per_gallon)).toFixed(2)
      setForm(prev => ({ ...prev, total_cost: total }))
    }
  }, [form.gallons, form.price_per_gallon])

  async function submit(e) {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/fuel', form)
      loadData(); setShowForm(false); setForm(emptyForm)
    } finally { setSaving(false) }
  }

  async function deleteLog(id) {
    setDeleting(id)
    try { await api.delete(`/fuel/${id}`); loadData() }
    finally { setDeleting(null) }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Fuel size={20} className="text-amber-400"/> Fuel Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Track fill-ups, costs, and efficiency</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2.5 rounded-lg text-sm transition-colors">
          <Plus size={15}/> Log Fill-Up
        </button>
      </div>

      {/* Total Spend Banner */}
      <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-amber-900/30 border border-amber-700/50 flex items-center justify-center">
            <DollarSign size={20} className="text-amber-400"/>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">${totalSpend.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })}</div>
            <div className="text-xs text-slate-500">Total Fuel Spend (all time)</div>
          </div>
        </div>
      </div>

      {/* Per-Truck Summary */}
      {summary.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Per Truck</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {summary.map(t => (
              <div key={t.id} className="bg-[#111827] rounded-2xl border border-[#1f2937] p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-900/30 border border-amber-700/50 flex items-center justify-center text-lg">🚛</div>
                  <div>
                    <div className="font-bold text-white text-sm">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.plate}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#0a0f1e] rounded-xl py-2.5">
                    <div className="text-lg font-bold text-white">{t.fill_ups}</div>
                    <div className="text-[10px] text-slate-500">Fill-Ups</div>
                  </div>
                  <div className="bg-[#0a0f1e] rounded-xl py-2.5">
                    <div className="text-lg font-bold text-amber-400">${parseFloat(t.total_spend).toFixed(0)}</div>
                    <div className="text-[10px] text-slate-500">Total Spent</div>
                  </div>
                  <div className="bg-[#0a0f1e] rounded-xl py-2.5">
                    <div className="text-lg font-bold text-slate-300">${parseFloat(t.avg_price_per_gallon).toFixed(3)}</div>
                    <div className="text-[10px] text-slate-500">Avg/Gal</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500 text-center">
                  {parseFloat(t.total_gallons).toFixed(1)} gallons total
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log Form */}
      {showForm && (
        <div className="bg-[#111827] rounded-2xl border border-amber-500/30 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2"><Fuel size={16} className="text-amber-400"/> Log Fill-Up</h3>
            <button onClick={() => { setShowForm(false); setForm(emptyForm) }} className="text-slate-400 hover:text-white"><X size={18}/></button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={lbl}>Truck *</label>
                <select className={inp} required value={form.truck_id} onChange={e => f({ truck_id:e.target.value })}>
                  <option value="">— select truck —</option>
                  {trucks.map(t => <option key={t.id} value={t.id}>{t.name} · {t.plate}</option>)}
                </select>
              </div>

              {drivers.length > 0 && (
                <div className="col-span-2">
                  <label className={lbl}>Driver</label>
                  <select className={inp} value={form.driver_id} onChange={e => f({ driver_id:e.target.value })}>
                    <option value="">— select driver —</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className={lbl}>Date</label>
                <input type="date" className={inp} value={form.log_date} onChange={e => f({ log_date:e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>Odometer (mi)</label>
                <input type="number" className={inp} value={form.odometer} onChange={e => f({ odometer:e.target.value })} placeholder="e.g. 48200"/>
              </div>

              <div>
                <label className={lbl}>Gallons *</label>
                <input type="number" step="0.001" className={inp} required value={form.gallons} onChange={e => f({ gallons:e.target.value })} placeholder="e.g. 85.4"/>
              </div>
              <div>
                <label className={lbl}>Price per Gallon</label>
                <input type="number" step="0.001" className={inp} value={form.price_per_gallon} onChange={e => f({ price_per_gallon:e.target.value })} placeholder="e.g. 3.899"/>
              </div>

              <div className="col-span-2">
                <label className={lbl}>Total Cost</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input type="number" step="0.01" className={`${inp} pl-7`} value={form.total_cost} onChange={e => f({ total_cost:e.target.value })} placeholder="Auto-calculated or enter manually"/>
                </div>
              </div>

              <div className="col-span-2">
                <label className={lbl}><MapPin size={11} className="inline mr-1"/>Location / Station</label>
                <input type="text" className={inp} value={form.location} onChange={e => f({ location:e.target.value })} placeholder="e.g. Pilot Flying J - Exit 42"/>
              </div>

              <div className="col-span-2">
                <label className={lbl}>Notes</label>
                <textarea className={`${inp} resize-none`} rows={2} value={form.notes} onChange={e => f({ notes:e.target.value })} placeholder="DEF fluid, reefer fuel, receipts reference, etc."/>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm) }}
                className="flex-1 bg-[#0a0f1e] text-slate-400 rounded-lg py-2.5 text-sm border border-[#1f2937] hover:border-slate-500">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg py-2.5 text-sm disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Save Fill-Up'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Log History */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Fill-Up History</h2>
        {loading && logs.length === 0 ? (
          <div className="bg-[#111827] rounded-xl p-8 text-center border border-[#1f2937]">
            <p className="text-slate-500 text-sm">Loading...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-[#111827] rounded-xl p-8 text-center border border-[#1f2937]">
            <Fuel size={32} className="text-slate-600 mx-auto mb-3"/>
            <p className="text-slate-500 text-sm">No fuel logs yet.</p>
            <p className="text-slate-600 text-xs mt-1">Hit "Log Fill-Up" after every fuel stop.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="bg-[#111827] rounded-xl border border-[#1f2937] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-amber-900/30 border border-amber-700/50 flex items-center justify-center flex-shrink-0">
                      <Fuel size={16} className="text-amber-400"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm">{log.truck_name}
                        <span className="text-slate-500 font-normal"> · {log.truck_plate}</span>
                      </div>
                      <div className="text-xs text-slate-500">{log.log_date}
                        {log.location && <span> · 📍 {log.location}</span>}
                        {log.odometer && <span> · {parseInt(log.odometer).toLocaleString()} mi</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-400">${parseFloat(log.total_cost||0).toFixed(2)}</div>
                      <div className="text-xs text-slate-500">{parseFloat(log.gallons).toFixed(1)} gal{log.price_per_gallon > 0 && ` · $${parseFloat(log.price_per_gallon).toFixed(3)}/gal`}</div>
                    </div>
                    {owner && (
                      <button onClick={() => deleteLog(log.id)} disabled={deleting === log.id}
                        className="text-slate-600 hover:text-red-400 transition-colors disabled:opacity-50">
                        <Trash2 size={15}/>
                      </button>
                    )}
                  </div>
                </div>
                {log.notes && (
                  <p className="text-xs text-slate-500 mt-2 pl-12">{log.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
