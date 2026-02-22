import { useEffect, useMemo, useState } from 'react'
import { Fuel, Plus, X, Trash2 } from 'lucide-react'
import api from '../lib/api'

const inp = 'w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors'
const lbl = 'block text-xs font-medium text-slate-400 mb-1.5'

const money = (v) => `$${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const num = (v, d = 1) => Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })

export default function FuelLog() {
  const [logs, setLogs] = useState([])
  const [summaryMap, setSummaryMap] = useState({})
  const [totalSpend, setTotalSpend] = useState(0)
  const [trucks, setTrucks] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const today = new Date().toISOString().slice(0, 10)
  const emptyForm = {
    truck_id: '',
    driver_id: '',
    log_date: today,
    gallons: '',
    price_per_gallon: '',
    odometer: '',
    location: '',
    notes: ''
  }
  const [form, setForm] = useState(emptyForm)

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => new Date(b.log_date) - new Date(a.log_date)),
    [logs]
  )

  const summaryRows = useMemo(() => {
    if (Array.isArray(summaryMap)) return summaryMap
    return Object.entries(summaryMap || {}).map(([truckId, row]) => ({ truck_id: truckId, ...row }))
  }, [summaryMap])

  const totalGallons = useMemo(
    () => summaryRows.reduce((acc, s) => acc + Number(s.total_gallons || 0), 0),
    [summaryRows]
  )

  const fillUps = useMemo(
    () => summaryRows.reduce((acc, s) => acc + Number(s.fill_count || 0), 0),
    [summaryRows]
  )

  const avgPrice = useMemo(() => {
    if (!totalGallons) return 0
    return Number(totalSpend || 0) / totalGallons
  }, [totalSpend, totalGallons])

  const previewTotal = useMemo(() => {
    const g = Number(form.gallons || 0)
    const p = Number(form.price_per_gallon || 0)
    return g * p
  }, [form.gallons, form.price_per_gallon])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [fuelRes, trucksRes, driversRes] = await Promise.all([
        api.get('/fuel'),
        api.get('/trucks').catch(() => ({ data: { trucks: [] } })),
        api.get('/drivers').catch(() => ({ data: { drivers: [] } }))
      ])

      setLogs(fuelRes.data?.logs || [])
      setSummaryMap(fuelRes.data?.summary || {})
      setTotalSpend(Number(fuelRes.data?.totalSpend || 0))
      setTrucks(trucksRes.data?.trucks || [])
      setDrivers(driversRes.data?.drivers || [])
    } finally {
      setLoading(false)
    }
  }

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function closeModal() {
    setShowForm(false)
    setForm({ ...emptyForm, log_date: new Date().toISOString().slice(0, 10) })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/fuel', {
        ...form,
        driver_id: form.driver_id || null,
        odometer: form.odometer || null,
        location: form.location || null,
        notes: form.notes || null
      })
      closeModal()
      await loadData()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    setDeletingId(id)
    try {
      await api.delete(`/fuel/${id}`)
      await loadData()
    } catch (err) {
      if (err?.response?.status === 404) {
        alert('Delete endpoint is not available yet on backend (404). UI is wired and ready.')
      } else {
        alert('Failed to delete fuel log. Please try again.')
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Fuel size={20} className="text-amber-500" /> Fuel Log
          </h1>
          <p className="text-slate-400 text-sm">Track fuel spend across your fleet</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Plus size={16} /> Add Fill-Up
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card title="Total Spend" value={money(totalSpend)} />
        <Card title="Total Gallons" value={`${num(totalGallons, 1)} gal`} />
        <Card title="Fill-ups" value={Number(fillUps || 0).toLocaleString('en-US')} />
        <Card title="Avg Price/Gal" value={money(avgPrice)} />
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-3">Per-Truck Breakdown</h2>
        {summaryRows.length === 0 ? (
          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 text-slate-500 text-sm">No truck summary yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summaryRows.map((s) => (
              <div key={s.truck_id} className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-white">{s.truck_name || 'Unknown Truck'}</div>
                    <div className="text-xs text-slate-400">{s.truck_plate || '—'}</div>
                  </div>
                  <div className="text-amber-500 text-xs font-semibold">Truck Summary</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <MiniStat label="Total Spend" value={money(s.total_spend)} />
                  <MiniStat label="Total Gallons" value={`${num(s.total_gallons, 1)} gal`} />
                  <MiniStat label="Fill Count" value={Number(s.fill_count || 0).toLocaleString('en-US')} />
                  <MiniStat label="Avg $/Gal" value={money(s.avg_price_per_gallon)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-[#0f172a]">
              <tr className="text-left text-xs uppercase tracking-wider text-amber-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Truck</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Gallons</th>
                <th className="px-4 py-3">$/Gal</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Odometer</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3"> </th>
              </tr>
            </thead>
            <tbody>
              {loading && sortedLogs.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">Loading your fleet data...</td></tr>
              ) : sortedLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6">
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                      <img src="/empty-fuel.png" alt="" className="w-40 h-40 opacity-90 object-contain" />
                      <p className="text-slate-400 text-sm font-medium">Tank's empty. Log your first fill-up.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedLogs.map((log) => (
                  <tr key={log.id} className="border-t border-[#1f2937] text-sm">
                    <td className="px-4 py-3 text-slate-200">{log.log_date ? new Date(log.log_date).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-slate-200">{log.truck_name || '—'} <span className="text-slate-500">{log.truck_plate ? `(${log.truck_plate})` : ''}</span></td>
                    <td className="px-4 py-3 text-slate-300">{log.driver_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-300">{num(log.gallons, 2)}</td>
                    <td className="px-4 py-3 text-slate-300">{money(log.price_per_gallon)}</td>
                    <td className="px-4 py-3 text-amber-400 font-semibold">{money(log.total_cost)}</td>
                    <td className="px-4 py-3 text-slate-300">{log.odometer ? Number(log.odometer).toLocaleString('en-US') : '—'}</td>
                    <td className="px-4 py-3 text-slate-300">{log.location || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        title="Delete"
                        onClick={() => handleDelete(log.id)}
                        disabled={deletingId === log.id}
                        className="text-slate-500 hover:text-red-400 disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#111827] border border-[#1f2937] rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#1f2937]">
              <h3 className="font-bold text-white">Add Fill-Up</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className={lbl}>Truck *</label>
                  <select className={inp} required value={form.truck_id} onChange={(e) => setField('truck_id', e.target.value)}>
                    <option value="">Select truck</option>
                    {trucks.map((t) => (
                      <option key={t.id} value={t.id}>{t.name || t.truck_name || `Truck ${t.id}`} {t.plate ? `(${t.plate})` : t.truck_plate ? `(${t.truck_plate})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={lbl}>Driver (optional)</label>
                  <select className={inp} value={form.driver_id} onChange={(e) => setField('driver_id', e.target.value)}>
                    <option value="">No driver</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name || `${d.first_name || ''} ${d.last_name || ''}`.trim() || `Driver ${d.id}`}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={lbl}>Date *</label>
                  <input type="date" required className={inp} value={form.log_date} onChange={(e) => setField('log_date', e.target.value)} />
                </div>

                <div>
                  <label className={lbl}>Gallons *</label>
                  <input type="number" step="0.001" min="0" required className={inp} value={form.gallons} onChange={(e) => setField('gallons', e.target.value)} />
                </div>

                <div>
                  <label className={lbl}>Price per Gallon *</label>
                  <input type="number" step="0.001" min="0" required className={inp} value={form.price_per_gallon} onChange={(e) => setField('price_per_gallon', e.target.value)} />
                </div>

                <div>
                  <label className={lbl}>Odometer (optional)</label>
                  <input type="number" min="0" className={inp} value={form.odometer} onChange={(e) => setField('odometer', e.target.value)} />
                </div>

                <div>
                  <label className={lbl}>Location (optional)</label>
                  <input type="text" className={inp} value={form.location} onChange={(e) => setField('location', e.target.value)} />
                </div>

                <div className="md:col-span-2">
                  <label className={lbl}>Notes (optional)</label>
                  <textarea rows={3} className={`${inp} resize-none`} value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
                </div>
              </div>

              <div className="bg-[#0a0f1e] border border-[#1f2937] rounded-lg p-3 text-sm">
                <span className="text-slate-400">Total: </span>
                <span className="text-amber-500 font-bold">{money(previewTotal)}</span>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 bg-[#0a0f1e] border border-[#1f2937] hover:border-slate-500 rounded-lg py-2.5 text-slate-300 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg py-2.5 text-sm disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Fill-Up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Card({ title, value }) {
  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
      <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">{title}</div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-[#0a0f1e] border border-[#1f2937] rounded-lg p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-amber-500">{value}</div>
    </div>
  )
}
