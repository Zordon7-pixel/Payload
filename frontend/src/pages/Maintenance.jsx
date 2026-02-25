import { useEffect, useState } from 'react'
import { Wrench, AlertTriangle, Plus, X, CheckCircle, Calendar, Gauge } from 'lucide-react'
import api from '../lib/api'

const SERVICE_TYPES = ['Oil Change','Tire Rotation','Tire Replacement','Brake Service','Transmission Service','Air Filter','Fuel Filter','Coolant Flush','DOT Inspection','Battery Replacement','Suspension','Other']

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000)
}
function statusBadge(days) {
  if (days === null) return { label: 'Not set', cls: 'text-slate-500 bg-slate-900/30 border-slate-700' }
  if (days < 0)  return { label: `Overdue ${Math.abs(days)}d`, cls: 'text-red-400 bg-red-900/30 border-red-700' }
  if (days < 30) return { label: `Due in ${days}d`, cls: 'text-red-400 bg-red-900/30 border-red-700' }
  if (days < 60) return { label: `Due in ${days}d`, cls: 'text-amber-400 bg-amber-900/30 border-amber-700' }
  return { label: `${days}d`, cls: 'text-emerald-400 bg-emerald-900/30 border-emerald-700' }
}

export default function Maintenance() {
  const [data, setData]     = useState({ logs: [], compliance: [] })
  const [trucks, setTrucks] = useState([])
  const [tab, setTab]       = useState('logs')
  const [showAdd, setShowAdd]   = useState(false)
  const [showComp, setShowComp] = useState(null) // truck for compliance edit
  const [saving, setSaving] = useState(false)

  const emptyLog = { truck_id:'', service_type:'Oil Change', service_date:'', mileage:'', cost:'', vendor:'', notes:'', next_service_date:'', next_service_mileage:'' }
  const emptyComp = { dot_inspection_date:'', registration_expiry:'', insurance_expiry:'', current_mileage:'' }
  const [form, setForm]     = useState(emptyLog)
  const [compForm, setComp] = useState(emptyComp)

  useEffect(() => { load() }, [])
  function load() {
    api.get('/maintenance').then(r => setData(r.data))
    api.get('/trucks').then(r => setTrucks(r.data.trucks || []))
  }

  function set(k,v) { setForm(f => ({...f,[k]:v})) }

  async function saveLog(e) {
    e.preventDefault(); setSaving(true)
    try { await api.post('/maintenance', form); load(); setShowAdd(false); setForm(emptyLog) }
    finally { setSaving(false) }
  }

  function openComp(t) {
    setShowComp(t)
    setComp({ dot_inspection_date: t.dot_inspection_date||'', registration_expiry: t.registration_expiry||'', insurance_expiry: t.insurance_expiry||'', current_mileage: t.current_mileage||'' })
  }

  async function saveComp(e) {
    e.preventDefault(); setSaving(true)
    try { await api.put(`/maintenance/truck/${showComp.id}/compliance`, compForm); load(); setShowComp(null) }
    finally { setSaving(false) }
  }

  const inp = 'w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors'
  const lbl = 'block text-xs font-medium text-slate-400 mb-1.5'

  const totalAlerts = data.compliance.reduce((n, t) => n + (t.flags?.length || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Maintenance</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2.5 rounded-lg text-sm">
          <Plus size={15}/> Log Service
        </button>
      </div>

      {/* Alert Banner */}
      {totalAlerts > 0 && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
            <AlertTriangle size={16}/> {totalAlerts} compliance item{totalAlerts > 1 ? 's' : ''} need attention
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {['logs','compliance'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab===t ? 'bg-amber-500 text-black' : 'bg-[#111827] text-slate-400 border border-[#1f2937] hover:text-white'}`}>
            {t === 'compliance' && totalAlerts > 0 ? `Compliance Alert` : t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {/* Maintenance Logs */}
      {tab === 'logs' && (
        <div>
          {data.logs.length === 0 ? (
            <div className="bg-[#111827] rounded-xl p-8 text-center border border-[#1f2937]">
              <Wrench size={32} className="text-slate-600 mx-auto mb-3"/>
              <p className="text-slate-500 text-sm">No service records yet. Log your first maintenance event.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.logs.map(l => (
                <div key={l.id} className="bg-[#111827] rounded-xl p-4 border border-[#1f2937] flex items-center gap-4">
                  <div className="w-9 h-9 bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wrench size={16} className="text-amber-400"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm">{l.service_type}</div>
                    <div className="text-xs text-slate-500">{l.truck_name} · {l.service_date}</div>
                    {l.vendor && <div className="text-xs text-slate-600">{l.vendor}</div>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-amber-400">${(l.cost||0).toLocaleString()}</div>
                    {l.mileage && <div className="text-xs text-slate-500 flex items-center gap-1 justify-end"><Gauge size={10}/>{l.mileage.toLocaleString()} mi</div>}
                    {l.next_service_date && <div className="text-xs text-slate-500">Next: {l.next_service_date}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Compliance Tracker */}
      {tab === 'compliance' && (
        <div className="grid gap-4">
          {data.compliance.length === 0 ? (
            <div className="bg-[#111827] rounded-xl p-8 text-center border border-[#1f2937]">
              <Calendar size={32} className="text-slate-600 mx-auto mb-3"/>
              <p className="text-slate-500 text-sm">No active trucks found.</p>
            </div>
          ) : data.compliance.map(t => {
            const dotDays  = daysUntil(t.dot_inspection_date)
            const regDays  = daysUntil(t.registration_expiry)
            const insDays  = daysUntil(t.insurance_expiry)
            const dot      = statusBadge(dotDays)
            const reg      = statusBadge(regDays)
            const ins      = statusBadge(insDays)
            return (
              <div key={t.id} className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-white">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.plate} · {t.current_mileage?.toLocaleString() || 0} mi</div>
                  </div>
                  <button onClick={() => openComp(t)} className="text-xs bg-[#0a0f1e] border border-[#1f2937] text-slate-400 hover:text-amber-400 hover:border-amber-500 px-3 py-1.5 rounded-lg transition-colors">
                    Update
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'DOT Inspection', badge: dot, date: t.dot_inspection_date },
                    { label: 'Registration',   badge: reg, date: t.registration_expiry },
                    { label: 'Insurance',      badge: ins, date: t.insurance_expiry },
                  ].map(item => (
                    <div key={item.label} className={`rounded-lg p-3 border ${item.badge.cls.includes('red') ? 'bg-red-900/10 border-red-700/30' : item.badge.cls.includes('amber') ? 'bg-amber-900/10 border-amber-700/30' : 'bg-[#0a0f1e] border-[#1f2937]'}`}>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">{item.label}</div>
                      <div className={`text-xs font-semibold ${item.badge.cls.split(' ')[0]}`}>{item.badge.label}</div>
                      {item.date && <div className="text-[10px] text-slate-600 mt-0.5">{item.date}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Log Service Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] rounded-2xl border border-[#1f2937] w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#1f2937]">
              <h3 className="font-bold text-white">Log Service</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            <form onSubmit={saveLog} className="p-5 space-y-3">
              <div><label className={lbl}>Truck *</label>
                <select className={inp} required value={form.truck_id} onChange={e=>set('truck_id',e.target.value)}>
                  <option value="">— select truck —</option>
                  {trucks.map(t=><option key={t.id} value={t.id}>{t.name} ({t.plate})</option>)}
                </select>
              </div>
              <div><label className={lbl}>Service Type *</label>
                <select className={inp} value={form.service_type} onChange={e=>set('service_type',e.target.value)}>
                  {SERVICE_TYPES.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Date</label><input className={inp} type="date" value={form.service_date} onChange={e=>set('service_date',e.target.value)}/></div>
                <div><label className={lbl}>Mileage</label><input className={inp} type="number" value={form.mileage} onChange={e=>set('mileage',e.target.value)} placeholder="125000"/></div>
                <div><label className={lbl}>Cost ($)</label><input className={inp} type="number" step="0.01" value={form.cost} onChange={e=>set('cost',e.target.value)} placeholder="0.00"/></div>
                <div><label className={lbl}>Vendor</label><input className={inp} value={form.vendor} onChange={e=>set('vendor',e.target.value)} placeholder="Shop name"/></div>
                <div><label className={lbl}>Next Service Date</label><input className={inp} type="date" value={form.next_service_date} onChange={e=>set('next_service_date',e.target.value)}/></div>
                <div><label className={lbl}>Next Service Miles</label><input className={inp} type="number" value={form.next_service_mileage} onChange={e=>set('next_service_mileage',e.target.value)} placeholder="130000"/></div>
              </div>
              <div><label className={lbl}>Notes</label><textarea className={`${inp} resize-none`} rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)}/></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-[#0a0f1e] text-slate-400 rounded-lg py-2.5 text-sm border border-[#1f2937]">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg py-2.5 text-sm disabled:opacity-50">
                  {saving ? 'Saving...' : 'Log Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compliance Update Modal */}
      {showComp && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] rounded-2xl border border-[#1f2937] w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-[#1f2937]">
              <h3 className="font-bold text-white">Update Compliance — {showComp.name}</h3>
              <button onClick={() => setShowComp(null)} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            <form onSubmit={saveComp} className="p-5 space-y-3">
              <div><label className={lbl}>DOT Inspection Date</label><input className={inp} type="date" value={compForm.dot_inspection_date} onChange={e=>setComp(f=>({...f,dot_inspection_date:e.target.value}))}/></div>
              <div><label className={lbl}>Registration Expiry</label><input className={inp} type="date" value={compForm.registration_expiry} onChange={e=>setComp(f=>({...f,registration_expiry:e.target.value}))}/></div>
              <div><label className={lbl}>Insurance Expiry</label><input className={inp} type="date" value={compForm.insurance_expiry} onChange={e=>setComp(f=>({...f,insurance_expiry:e.target.value}))}/></div>
              <div><label className={lbl}>Current Mileage</label><input className={inp} type="number" value={compForm.current_mileage} onChange={e=>setComp(f=>({...f,current_mileage:e.target.value}))}/></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowComp(null)} className="flex-1 bg-[#0a0f1e] text-slate-400 rounded-lg py-2.5 text-sm border border-[#1f2937]">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg py-2.5 text-sm disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
