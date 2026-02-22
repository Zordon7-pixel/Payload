import { useEffect, useState } from 'react'
import { BookOpen, ClipboardCheck, ClipboardList, Plus, X, CheckCircle, XCircle, MinusCircle, AlertTriangle, ChevronDown, ChevronUp, Wrench, CheckSquare } from 'lucide-react'
import api from '../lib/api'
import { isOwner } from '../lib/auth'

const POSTTRIP_GROUPS = [
  { group:'Body & Exterior',   icon:'🚛', items:[{key:'no_new_damage',label:'No New Body Damage'},{key:'lights_intact',label:'All Lights Intact'},{key:'mirrors_ok',label:'Mirrors Undamaged'},{key:'windshield_ok',label:'Windshield Undamaged'}] },
  { group:'Mechanical',        icon:'🔧', items:[{key:'no_warning_lights',label:'No Warning Lights'},{key:'no_unusual_sounds',label:'No Unusual Sounds'},{key:'brakes_ok',label:'Brakes Normal'},{key:'steering_ok',label:'Steering Normal'},{key:'transmission_ok',label:'Transmission Normal'}] },
  { group:'Tires',             icon:'🔘', items:[{key:'no_blowouts',label:'No Blowouts'},{key:'tires_after_run',label:'Tires OK After Run'}] },
  { group:'Fluids',            icon:'💧', items:[{key:'no_new_leaks',label:'No New Leaks'},{key:'oil_ok_postrun',label:'Oil OK'},{key:'coolant_ok_postrun',label:'No Overheating'}] },
  { group:'Equipment & Cargo', icon:'⛓️', items:[{key:'straps_chains_ok',label:'Straps / Chains OK'},{key:'tarps_ok',label:'Tarps OK'},{key:'load_area_clear',label:'Load Area Cleared'}] },
  { group:'End of Shift',      icon:'📋', items:[{key:'cab_clean',label:'Cab Clean'},{key:'windows_secure',label:'Windows Secured'},{key:'fuel_ok',label:'Fuel OK for Tomorrow'}] },
]

// ── Pre-Trip Inspection Items ──────────────────────────────────────────────
const INSPECTION_GROUPS = [
  {
    group: 'Brakes',
    icon: '🛑',
    items: [
      { key: 'service_brakes',  label: 'Service Brakes' },
      { key: 'parking_brake',   label: 'Parking Brake' },
    ],
  },
  {
    group: 'Lights',
    icon: '💡',
    items: [
      { key: 'headlights',      label: 'Headlights' },
      { key: 'taillights',      label: 'Taillights' },
      { key: 'brake_lights',    label: 'Brake Lights' },
      { key: 'turn_signals',    label: 'Turn Signals' },
      { key: 'hazard_lights',   label: 'Hazard Lights' },
      { key: 'marker_lights',   label: 'Clearance / Marker Lights' },
    ],
  },
  {
    group: 'Tires & Wheels',
    icon: '🔘',
    items: [
      { key: 'tire_condition',  label: 'Tire Condition & Tread' },
      { key: 'tire_inflation',  label: 'Tire Inflation' },
      { key: 'wheels_rims',     label: 'Wheels & Rims' },
      { key: 'lug_nuts',        label: 'Lug Nuts / Fasteners' },
    ],
  },
  {
    group: 'Exterior',
    icon: '🪞',
    items: [
      { key: 'mirrors',         label: 'Mirrors (both sides)' },
      { key: 'windshield',      label: 'Windshield (no cracks)' },
      { key: 'wipers_washers',  label: 'Wipers & Washers' },
      { key: 'horn',            label: 'Horn' },
      { key: 'reflectors',      label: 'Reflectors / Reflective Tape' },
    ],
  },
  {
    group: 'Engine & Fluids',
    icon: '🔧',
    items: [
      { key: 'oil_level',       label: 'Oil Level' },
      { key: 'coolant_level',   label: 'Coolant Level' },
      { key: 'fuel_level',      label: 'Fuel Level' },
      { key: 'no_leaks',        label: 'No Visible Leaks' },
      { key: 'belts_hoses',     label: 'Belts & Hoses' },
      { key: 'air_pressure',    label: 'Air Pressure / Gauges' },
    ],
  },
  {
    group: 'Cab Interior',
    icon: '🪑',
    items: [
      { key: 'seatbelt',        label: 'Seatbelt' },
      { key: 'steering',        label: 'Steering (no excessive play)' },
      { key: 'gauges_controls', label: 'Gauges & Controls' },
      { key: 'emergency_triangles', label: 'Emergency Triangles' },
      { key: 'fire_extinguisher',   label: 'Fire Extinguisher' },
      { key: 'first_aid',       label: 'First Aid Kit' },
    ],
  },
  {
    group: 'Body & Frame',
    icon: '🚛',
    items: [
      { key: 'body_damage',     label: 'No New Body Damage' },
      { key: 'doors_secure',    label: 'Doors & Latches Secure' },
      { key: 'exhaust',         label: 'Exhaust System' },
      { key: 'suspension',      label: 'Suspension' },
    ],
  },
]

const DEFAULT_ITEMS = {}
INSPECTION_GROUPS.forEach(g => g.items.forEach(i => { DEFAULT_ITEMS[i.key] = 'pass' }))

const WEATHER_OPTIONS = ['Clear', 'Cloudy', 'Rain', 'Heavy Rain', 'Fog', 'Snow', 'Ice', 'Wind']

function ItemToggle({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[
        { v: 'pass', icon: CheckCircle,  cls: 'text-emerald-400 bg-emerald-900/40 border-emerald-600' },
        { v: 'fail', icon: XCircle,      cls: 'text-red-400 bg-red-900/40 border-red-600' },
        { v: 'na',   icon: MinusCircle,  cls: 'text-slate-400 bg-slate-900/40 border-slate-600' },
      ].map(({ v, icon: Icon, cls }) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${value === v ? cls : 'border-[#1f2937] text-slate-600 hover:border-slate-500'}`}>
          <Icon size={14} />
        </button>
      ))}
    </div>
  )
}

export default function Logbook() {
  const [tab, setTab] = useState('log')
  const [logs, setLogs]               = useState([])
  const [inspections, setInspections] = useState([])
  const [posttrips, setPosttrips]     = useState([])
  const [trucks, setTrucks]           = useState([])
  const [showLogForm, setShowLogForm] = useState(false)
  const [showInspForm, setShowInspForm] = useState(false)
  const [saving, setSaving]           = useState(false)
  const [expandedInsp, setExpandedInsp] = useState(null)
  const [expandedPost, setExpandedPost] = useState(null)
  const [repairSaving, setRepairSaving] = useState(null)
  const owner = isOwner()

  // Daily log form
  const emptyLog = { truck_id:'', log_date: new Date().toISOString().split('T')[0], start_mileage:'', end_mileage:'', loads_completed:'', weather:'Clear', notes:'', incidents:'' }
  const [logForm, setLogForm] = useState(emptyLog)
  const [repairForms, setRepairForms] = useState({}) // {id: {repair_status, repair_notes}}

  // Pre-trip form
  const [inspForm, setInspForm] = useState({
    truck_id:'', odometer:'', defects_noted:'', driver_signature:'',
    items: { ...DEFAULT_ITEMS },
  })

  useEffect(() => { loadData() }, [])
  function loadData() {
    api.get('/logbook/logs').then(r => setLogs(r.data.logs || []))
    api.get('/logbook/inspections').then(r => setInspections(r.data.inspections || []))
    api.get('/logbook/posttrip').then(r => setPosttrips(r.data.inspections || []))
    api.get('/trucks').then(r => setTrucks(r.data.trucks || []))
  }

  async function saveRepair(id) {
    const f = repairForms[id] || {}
    if (!f.repair_status) return
    setRepairSaving(id)
    try {
      await api.patch(`/logbook/posttrip/${id}/repair`, { repair_status: f.repair_status, repair_notes: f.repair_notes || '' })
      loadData()
    } finally { setRepairSaving(null) }
  }

  // ── Daily Log Submit ──
  async function submitLog(e) {
    e.preventDefault(); setSaving(true)
    try { await api.post('/logbook/logs', logForm); loadData(); setShowLogForm(false); setLogForm(emptyLog) }
    finally { setSaving(false) }
  }

  // ── Inspection Submit ──
  async function submitInsp(e) {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/logbook/inspections', {
        ...inspForm,
        inspection_date: new Date().toISOString().split('T')[0],
      })
      loadData(); setShowInspForm(false)
      setInspForm({ truck_id:'', odometer:'', defects_noted:'', driver_signature:'', items:{ ...DEFAULT_ITEMS } })
    } finally { setSaving(false) }
  }

  function setItem(key, val) { setInspForm(f => ({ ...f, items: { ...f.items, [key]: val } })) }

  const failCount = Object.values(inspForm.items).filter(v => v === 'fail').length

  const inp = 'w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors'
  const lbl = 'block text-xs font-medium text-slate-400 mb-1.5'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Logbook</h1>
          <p className="text-xs text-slate-500 mt-0.5">Daily logs & pre-trip inspections</p>
        </div>
        <div className="flex gap-2">
          {tab === 'log' && (
            <button onClick={() => setShowLogForm(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2.5 rounded-lg text-sm">
              <Plus size={15}/> Log Day
            </button>
          )}
          {tab === 'inspection' && !showInspForm && (
            <button onClick={() => setShowInspForm(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2.5 rounded-lg text-sm">
              <Plus size={15}/> Start Inspection
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setTab('log')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab==='log' ? 'bg-amber-500 text-black' : 'bg-[#111827] text-slate-400 border border-[#1f2937] hover:text-white'}`}>
          <BookOpen size={14}/> Daily Log
        </button>
        <button onClick={() => setTab('inspection')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab==='inspection' ? 'bg-amber-500 text-black' : 'bg-[#111827] text-slate-400 border border-[#1f2937] hover:text-white'}`}>
          <ClipboardCheck size={14}/> Pre-Trip
        </button>
        <button onClick={() => setTab('posttrip')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab==='posttrip' ? 'bg-amber-500 text-black' : 'bg-[#111827] text-slate-400 border border-[#1f2937] hover:text-white'}`}>
          <ClipboardList size={14}/> Post-Trip
          {posttrips.filter(p => p.repair_status === 'pending').length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {posttrips.filter(p => p.repair_status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* ── DAILY LOG TAB ── */}
      {tab === 'log' && (
        <>
          {showLogForm && (
            <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Log Today's Work</h3>
                <button onClick={() => setShowLogForm(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
              </div>
              <form onSubmit={submitLog} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Date</label><input type="date" className={inp} value={logForm.log_date} onChange={e=>setLogForm(f=>({...f,log_date:e.target.value}))}/></div>
                  <div>
                    <label className={lbl}>Truck</label>
                    <select className={inp} value={logForm.truck_id} onChange={e=>setLogForm(f=>({...f,truck_id:e.target.value}))}>
                      <option value="">— select —</option>
                      {trucks.map(t=><option key={t.id} value={t.id}>{t.name} · {t.plate}</option>)}
                    </select>
                  </div>
                  <div><label className={lbl}>Start Mileage</label><input type="number" className={inp} value={logForm.start_mileage} onChange={e=>setLogForm(f=>({...f,start_mileage:e.target.value}))} placeholder="e.g. 45200"/></div>
                  <div><label className={lbl}>End Mileage</label><input type="number" className={inp} value={logForm.end_mileage} onChange={e=>setLogForm(f=>({...f,end_mileage:e.target.value}))} placeholder="e.g. 45480"/></div>
                  <div><label className={lbl}>Loads Completed</label><input type="number" min="0" className={inp} value={logForm.loads_completed} onChange={e=>setLogForm(f=>({...f,loads_completed:e.target.value}))} placeholder="0"/></div>
                  <div>
                    <label className={lbl}>Weather</label>
                    <select className={inp} value={logForm.weather} onChange={e=>setLogForm(f=>({...f,weather:e.target.value}))}>
                      {WEATHER_OPTIONS.map(w=><option key={w}>{w}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className={lbl}>Work Summary / Notes</label><textarea className={`${inp} resize-none`} rows={3} value={logForm.notes} onChange={e=>setLogForm(f=>({...f,notes:e.target.value}))} placeholder="Describe today's jobs, routes, or anything worth noting..."/></div>
                <div><label className={lbl}>Incidents / Issues</label><textarea className={`${inp} resize-none`} rows={2} value={logForm.incidents} onChange={e=>setLogForm(f=>({...f,incidents:e.target.value}))} placeholder="Any incidents, near-misses, mechanical issues, or concerns..."/></div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowLogForm(false)} className="flex-1 bg-[#0a0f1e] text-slate-400 rounded-lg py-2.5 text-sm border border-[#1f2937]">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg py-2.5 text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save Log'}</button>
                </div>
              </form>
            </div>
          )}

          {logs.length === 0 ? (
            <div className="bg-[#111827] rounded-xl p-8 text-center border border-[#1f2937]">
              <BookOpen size={32} className="text-slate-600 mx-auto mb-3"/>
              <p className="text-slate-500 text-sm">No log entries yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map(l => (
                <div key={l.id} className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-white text-sm">{l.log_date}</div>
                      {owner && l.driver_name && <div className="text-xs text-amber-400">{l.driver_name}</div>}
                      <div className="text-xs text-slate-500 mt-0.5">{l.truck_name} · {l.truck_plate} · {l.weather}</div>
                    </div>
                    <div className="flex gap-4 text-right text-xs flex-shrink-0">
                      {l.loads_completed > 0 && <div><div className="text-white font-bold">{l.loads_completed}</div><div className="text-slate-500">loads</div></div>}
                      {l.start_mileage && l.end_mileage && (
                        <div><div className="text-white font-bold">{(l.end_mileage - l.start_mileage).toLocaleString()}</div><div className="text-slate-500">miles</div></div>
                      )}
                    </div>
                  </div>
                  {l.notes && <p className="text-xs text-slate-400 mt-2 leading-relaxed">{l.notes}</p>}
                  {l.incidents && (
                    <div className="mt-2 bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">
                      <span className="text-[10px] text-red-400 font-semibold uppercase tracking-wide">⚠️ Incident: </span>
                      <span className="text-xs text-red-300">{l.incidents}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── POST-TRIP / REPAIR QUEUE TAB ── */}
      {tab === 'posttrip' && (
        <>
          {posttrips.length === 0 ? (
            <div className="bg-[#111827] rounded-xl p-8 text-center border border-[#1f2937]">
              <ClipboardList size={32} className="text-slate-600 mx-auto mb-3"/>
              <p className="text-slate-500 text-sm">No post-trip reports yet.</p>
              <p className="text-slate-600 text-xs mt-1">Drivers submit these at end of each shift.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posttrips.map(insp => {
                const failedItems = Object.entries(insp.items || {}).filter(([,v]) => v === 'fail')
                const isExpanded = expandedPost === insp.id
                const rf = repairForms[insp.id] || { repair_status: insp.repair_status, repair_notes: insp.repair_notes || '' }
                const repairColor = { none:'border-emerald-700/40', pending:'border-red-700/50', scheduled:'border-amber-700/40', repaired:'border-emerald-700/40' }[insp.repair_status] || 'border-[#1f2937]'
                const repairBg    = { none:'', pending:'bg-red-900/10', scheduled:'bg-amber-900/10', repaired:'' }[insp.repair_status] || ''

                return (
                  <div key={insp.id} className={`bg-[#111827] rounded-xl border overflow-hidden ${repairColor}`}>
                    <div className={`p-4 flex items-center justify-between gap-3 cursor-pointer ${repairBg}`} onClick={() => setExpandedPost(isExpanded ? null : insp.id)}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${insp.repair_status === 'pending' ? 'text-red-400 bg-red-900/30 border-red-700' : insp.repair_status === 'scheduled' ? 'text-amber-400 bg-amber-900/30 border-amber-700' : 'text-emerald-400 bg-emerald-900/30 border-emerald-700'}`}>
                          {insp.repair_status === 'pending' ? <AlertTriangle size={18}/> : insp.repair_status === 'scheduled' ? <Wrench size={18}/> : <CheckCircle size={18}/>}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm flex items-center gap-2">
                            {insp.inspection_date}
                            {insp.repair_status === 'pending' && <span className="text-[10px] bg-red-900/40 text-red-400 border border-red-700/40 px-2 py-0.5 rounded-full">REPAIR NEEDED</span>}
                            {insp.repair_status === 'scheduled' && <span className="text-[10px] bg-amber-900/40 text-amber-400 border border-amber-700/40 px-2 py-0.5 rounded-full">SCHEDULED</span>}
                            {insp.repair_status === 'repaired' && <span className="text-[10px] bg-emerald-900/40 text-emerald-400 border border-emerald-700/40 px-2 py-0.5 rounded-full">REPAIRED ✓</span>}
                          </div>
                          <div className="text-xs text-slate-500">{insp.truck_name} · {insp.truck_plate}{owner && insp.driver_name ? ` · ${insp.driver_name}` : ''}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="text-xs">{failedItems.length > 0 ? `${failedItems.length} issue${failedItems.length>1?'s':''}` : 'All clear'}</span>
                        {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-[#1f2937] pt-3 space-y-3">
                        {failedItems.length > 0 && (
                          <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-3">
                            <div className="text-xs font-semibold text-red-400 mb-1">Issues Reported</div>
                            {failedItems.map(([key]) => {
                              const item = POSTTRIP_GROUPS.flatMap(g=>g.items).find(i=>i.key===key)
                              return <div key={key} className="text-xs text-red-300">• {item?.label || key}</div>
                            })}
                          </div>
                        )}
                        {insp.defects_noted && (
                          <div><div className="text-xs text-slate-500 mb-1">Driver Notes</div><p className="text-xs text-slate-300">{insp.defects_noted}</p></div>
                        )}
                        <div className="text-xs text-slate-500">Signed: <span className="text-white">{insp.driver_signature}</span></div>
                        {insp.odometer && <div className="text-xs text-slate-500">End Odometer: <span className="text-white">{parseInt(insp.odometer).toLocaleString()} mi</span></div>}

                        {/* Owner repair control */}
                        {owner && (
                          <div className="bg-[#0a0f1e] rounded-xl p-3 space-y-2 border border-[#1f2937]">
                            <div className="text-xs font-semibold text-amber-400 mb-2">🔧 Repair Status (Owner)</div>
                            <div className="flex gap-2">
                              {[{v:'pending',label:'Needs Repair',cls:'border-red-600 text-red-400'},{v:'scheduled',label:'Scheduled',cls:'border-amber-600 text-amber-400'},{v:'repaired',label:'Repaired ✓',cls:'border-emerald-600 text-emerald-400'}].map(opt => (
                                <button key={opt.v} type="button"
                                  onClick={() => setRepairForms(f => ({...f, [insp.id]:{ ...rf, repair_status: opt.v }}))}
                                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all ${rf.repair_status === opt.v ? opt.cls + ' bg-opacity-20' : 'border-[#1f2937] text-slate-500 hover:border-slate-500'}`}>
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                            <input
                              className="w-full bg-[#111827] border border-[#1f2937] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                              placeholder="Repair notes (optional)..."
                              value={rf.repair_notes || ''}
                              onChange={e => setRepairForms(f => ({...f, [insp.id]:{ ...rf, repair_notes: e.target.value }}))}
                            />
                            <button
                              onClick={() => saveRepair(insp.id)}
                              disabled={repairSaving === insp.id}
                              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 rounded-lg text-xs disabled:opacity-50">
                              {repairSaving === insp.id ? 'Saving...' : 'Save Repair Status'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── PRE-TRIP INSPECTION TAB ── */}
      {tab === 'inspection' && (
        <>
          {showInspForm ? (
            <form onSubmit={submitInsp} className="space-y-4">
              {/* Truck + Odometer */}
              <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white">Pre-Trip Inspection</h3>
                  <button type="button" onClick={() => setShowInspForm(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={lbl}>Vehicle *</label>
                    <select className={inp} required value={inspForm.truck_id} onChange={e=>setInspForm(f=>({...f,truck_id:e.target.value}))}>
                      <option value="">— select truck —</option>
                      {trucks.map(t=><option key={t.id} value={t.id}>{t.name} · {t.plate} ({t.year} {t.make} {t.model})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Odometer Reading</label>
                    <input type="number" className={inp} value={inspForm.odometer} onChange={e=>setInspForm(f=>({...f,odometer:e.target.value}))} placeholder="Current mileage"/>
                  </div>
                  <div className="flex items-end">
                    <div className="text-xs text-slate-500">
                      Date: <span className="text-white">{new Date().toLocaleDateString()}</span><br/>
                      Time: <span className="text-white">{new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</span>
                    </div>
                  </div>
                </div>

                {failCount > 0 && (
                  <div className="mt-3 bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-2 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-400 flex-shrink-0"/>
                    <span className="text-xs text-red-400 font-semibold">{failCount} item{failCount>1?'s':''} marked as FAIL — vehicle should not be operated until defects are corrected.</span>
                  </div>
                )}
              </div>

              {/* Inspection Groups */}
              {INSPECTION_GROUPS.map(group => (
                <div key={group.group} className="bg-[#111827] rounded-2xl border border-[#1f2937] p-4">
                  <h4 className="text-sm font-bold text-white mb-3">{group.icon} {group.group}</h4>
                  <div className="space-y-3">
                    {group.items.map(item => (
                      <div key={item.key} className="flex items-center justify-between gap-3">
                        <span className="text-sm text-slate-300 flex-1">{item.label}</span>
                        <ItemToggle
                          value={inspForm.items[item.key]}
                          onChange={val => setItem(item.key, val)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Defects & Signature */}
              <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-5 space-y-3">
                <div>
                  <label className={lbl}>Defects / Notes</label>
                  <textarea className={`${inp} resize-none`} rows={3}
                    value={inspForm.defects_noted}
                    onChange={e=>setInspForm(f=>({...f,defects_noted:e.target.value}))}
                    placeholder="Describe any defects, concerns, or issues found..."/>
                </div>
                <div>
                  <label className={lbl}>Driver Signature (full name) *</label>
                  <input className={inp} required value={inspForm.driver_signature}
                    onChange={e=>setInspForm(f=>({...f,driver_signature:e.target.value}))}
                    placeholder="Type your full name to certify this inspection"/>
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  By signing, I certify this vehicle has been inspected and is in satisfactory operating condition, or that all defects have been noted above.
                </p>
                <button type="submit" disabled={saving || !inspForm.truck_id || !inspForm.driver_signature}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3.5 rounded-xl text-sm disabled:opacity-50 transition-colors">
                  {saving ? 'Submitting...' : failCount > 0 ? `⚠️ Submit with ${failCount} Defect${failCount>1?'s':''}` : '✓ Submit Inspection'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {inspections.length === 0 ? (
                <div className="bg-[#111827] rounded-xl p-8 text-center border border-[#1f2937]">
                  <ClipboardCheck size={32} className="text-slate-600 mx-auto mb-3"/>
                  <p className="text-slate-500 text-sm">No inspections on record yet.</p>
                  <p className="text-slate-600 text-xs mt-1">Complete a pre-trip inspection before every shift.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inspections.map(insp => {
                    const failedItems = Object.entries(insp.items || {}).filter(([,v]) => v === 'fail')
                    const isExpanded = expandedInsp === insp.id
                    return (
                      <div key={insp.id} className={`bg-[#111827] rounded-xl border overflow-hidden ${!insp.overall_pass ? 'border-red-700/50' : 'border-[#1f2937]'}`}>
                        <div className="p-4 flex items-center justify-between gap-3 cursor-pointer" onClick={() => setExpandedInsp(isExpanded ? null : insp.id)}>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${insp.overall_pass ? 'text-emerald-400 bg-emerald-900/30 border-emerald-700' : 'text-red-400 bg-red-900/30 border-red-700'}`}>
                              {insp.overall_pass ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>}
                            </div>
                            <div>
                              <div className="font-semibold text-white text-sm flex items-center gap-2">
                                {insp.inspection_date}
                                {!insp.overall_pass && <span className="text-[10px] bg-red-900/40 text-red-400 border border-red-700/40 px-2 py-0.5 rounded-full">DEFECTS</span>}
                              </div>
                              <div className="text-xs text-slate-500">{insp.truck_name} · {insp.truck_plate}{owner && insp.driver_name ? ` · ${insp.driver_name}` : ''}</div>
                              {insp.inspection_time && <div className="text-[10px] text-slate-600">{insp.inspection_time}</div>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <span className="text-xs">{failedItems.length > 0 ? `${failedItems.length} fail` : 'All pass'}</span>
                            {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-[#1f2937] pt-3 space-y-3">
                            {failedItems.length > 0 && (
                              <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-3">
                                <div className="text-xs font-semibold text-red-400 mb-1">Failed Items</div>
                                {failedItems.map(([key]) => {
                                  const item = INSPECTION_GROUPS.flatMap(g=>g.items).find(i=>i.key===key)
                                  return <div key={key} className="text-xs text-red-300">• {item?.label || key}</div>
                                })}
                              </div>
                            )}
                            {insp.defects_noted && (
                              <div><div className="text-xs text-slate-500 mb-1">Notes</div><p className="text-xs text-slate-300">{insp.defects_noted}</p></div>
                            )}
                            <div className="text-xs text-slate-500">Signed by: <span className="text-white">{insp.driver_signature}</span></div>
                            {insp.odometer && <div className="text-xs text-slate-500">Odometer: <span className="text-white">{parseInt(insp.odometer).toLocaleString()} mi</span></div>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
