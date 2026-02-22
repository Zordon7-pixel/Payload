import { useEffect, useState } from 'react'
import { Phone, CreditCard, AlertTriangle, Plus, X, CheckCircle, DollarSign } from 'lucide-react'
import api from '../lib/api'

const PAY_TYPES = ['percent','per_ton','per_mile','flat_per_load']
const PAY_LABELS = { percent:'% of Gross', per_ton:'Per Ton', per_mile:'Per Mile', flat_per_load:'Flat Per Load' }

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000)
}
function expiryColor(days) {
  if (days === null) return 'text-slate-500'
  if (days < 0)  return 'text-red-400'
  if (days < 30) return 'text-red-400'
  if (days < 60) return 'text-amber-400'
  return 'text-emerald-400'
}
function expiryLabel(dateStr) {
  const d = daysUntil(dateStr)
  if (d === null) return '—'
  if (d < 0)  return `Expired ${Math.abs(d)}d ago`
  if (d === 0) return 'Expires today!'
  return `${d}d left`
}

export default function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const empty = { name:'', phone:'', cdl_number:'', cdl_expiry:'', medical_card_expiry:'', pay_type:'percent', pay_rate:25, notes:'' }
  const [form, setForm] = useState(empty)

  useEffect(() => { load() }, [])
  function load() { api.get('/drivers').then(r => setDrivers(r.data.drivers)) }

  function set(k,v) { setForm(f => ({...f, [k]:v})) }

  async function save(e) {
    e.preventDefault(); setSaving(true)
    try {
      if (selected) { await api.put(`/drivers/${selected.id}`, form) }
      else { await api.post('/drivers', form) }
      load(); close()
    } finally { setSaving(false) }
  }

  function open(d) {
    setSelected(d || null)
    setForm(d ? { name:d.name, phone:d.phone||'', cdl_number:d.cdl_number||'', cdl_expiry:d.cdl_expiry||'', medical_card_expiry:d.medical_card_expiry||'', pay_type:d.pay_type, pay_rate:d.pay_rate, notes:d.notes||'' } : empty)
    setShowAdd(true)
  }
  function close() { setShowAdd(false); setSelected(null); setForm(empty) }

  const inp = 'w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors'
  const lbl = 'block text-xs font-medium text-slate-400 mb-1.5'

  const alerts = drivers.filter(d => {
    const cdl = daysUntil(d.cdl_expiry)
    const med = daysUntil(d.medical_card_expiry)
    return (cdl !== null && cdl < 60) || (med !== null && med < 60)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Drivers</h1>
        </div>
        <button onClick={() => open(null)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2.5 rounded-lg text-sm transition-colors">
          <Plus size={15} /> Add Driver
        </button>
      </div>

      {/* Compliance Alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-sm mb-2">
            <AlertTriangle size={16} /> Compliance Alerts ({alerts.length})
          </div>
          <div className="space-y-1">
            {alerts.map(d => (
              <div key={d.id} className="flex items-center gap-4 text-xs text-slate-300">
                <span className="font-medium w-32">{d.name}</span>
                {daysUntil(d.cdl_expiry) !== null && daysUntil(d.cdl_expiry) < 60 && (
                  <span className={`${expiryColor(daysUntil(d.cdl_expiry))}`}>CDL: {expiryLabel(d.cdl_expiry)}</span>
                )}
                {daysUntil(d.medical_card_expiry) !== null && daysUntil(d.medical_card_expiry) < 60 && (
                  <span className={`${expiryColor(daysUntil(d.medical_card_expiry))}`}>Medical: {expiryLabel(d.medical_card_expiry)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Driver List */}
      {drivers.length === 0 ? (
        <div className="bg-[#111827] rounded-xl p-8 text-center border border-[#1f2937]">
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <img src="/empty-drivers.png" alt="" className="w-40 h-40 opacity-90 object-contain" />
            <p className="text-slate-400 text-sm font-medium">No drivers on file yet. Add your team.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {drivers.map(d => {
            const cdlDays = daysUntil(d.cdl_expiry)
            const medDays = daysUntil(d.medical_card_expiry)
            const hasAlert = (cdlDays !== null && cdlDays < 60) || (medDays !== null && medDays < 60)
            return (
              <div key={d.id} onClick={() => open(d)}
                className="bg-[#111827] rounded-xl p-4 border border-[#1f2937] hover:border-amber-500/30 cursor-pointer transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${hasAlert ? 'bg-red-900/50 text-red-400' : 'bg-amber-900/30 text-amber-400'}`}>
                      {d.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{d.name}</div>
                      {d.phone && <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Phone size={10}/>{d.phone}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right flex-wrap">
                    <div>
                      <div className="text-xs text-slate-500">Pay Rate</div>
                      <div className="text-sm font-semibold text-amber-400">
                        {d.pay_type === 'percent' ? `${d.pay_rate}%` : `$${d.pay_rate}`}
                        <span className="text-xs text-slate-500 ml-1">{PAY_LABELS[d.pay_type]}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Loads</div>
                      <div className="text-sm font-semibold text-white">{d.total_loads || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Total Earned</div>
                      <div className="text-sm font-semibold text-emerald-400">${(d.total_pay||0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">CDL</div>
                      <div className={`text-xs font-medium ${expiryColor(cdlDays)}`}>{expiryLabel(d.cdl_expiry)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Medical</div>
                      <div className={`text-xs font-medium ${expiryColor(medDays)}`}>{expiryLabel(d.medical_card_expiry)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] rounded-2xl border border-[#1f2937] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#1f2937]">
              <h3 className="font-bold text-white">{selected ? 'Edit Driver' : 'Add Driver'}</h3>
              <button onClick={close} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className={lbl}>Full Name *</label><input className={inp} required value={form.name} onChange={e=>set('name',e.target.value)} placeholder="John Smith" /></div>
                <div><label className={lbl}>Phone</label><input className={inp} value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="(555) 000-0000" /></div>
                <div><label className={lbl}>CDL Number</label><input className={inp} value={form.cdl_number} onChange={e=>set('cdl_number',e.target.value)} placeholder="CDL123456" /></div>
                <div><label className={lbl}>CDL Expiry</label><input className={`${inp}`} type="date" value={form.cdl_expiry} onChange={e=>set('cdl_expiry',e.target.value)} /></div>
                <div><label className={lbl}>Medical Card Expiry</label><input className={inp} type="date" value={form.medical_card_expiry} onChange={e=>set('medical_card_expiry',e.target.value)} /></div>
              </div>

              <div className="bg-[#0a0f1e] rounded-xl p-4 space-y-3">
                <div className="text-xs font-semibold text-amber-400 uppercase tracking-widest flex items-center gap-2"><DollarSign size={12}/> Pay Structure</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Pay Type</label>
                    <select className={inp} value={form.pay_type} onChange={e=>set('pay_type',e.target.value)}>
                      {PAY_TYPES.map(t=><option key={t} value={t}>{PAY_LABELS[t]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>{form.pay_type === 'percent' ? 'Percentage (%)' : 'Rate ($)'}</label>
                    <input className={inp} type="number" step="0.1" min="0" value={form.pay_rate} onChange={e=>set('pay_rate',e.target.value)} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">
                  {form.pay_type === 'percent' && `Driver earns ${form.pay_rate}% of gross revenue per load`}
                  {form.pay_type === 'per_ton'  && `Driver earns $${form.pay_rate} per ton hauled`}
                  {form.pay_type === 'per_mile' && `Driver earns $${form.pay_rate} per mile driven`}
                  {form.pay_type === 'flat_per_load' && `Driver earns $${form.pay_rate} flat per load`}
                </p>
              </div>

              <div><label className={lbl}>Notes</label><textarea className={`${inp} resize-none`} rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Any notes about this driver..." /></div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={close} className="flex-1 bg-[#0a0f1e] text-slate-400 rounded-lg py-2.5 text-sm border border-[#1f2937] hover:border-slate-500 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : (selected ? 'Save Changes' : 'Add Driver')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
