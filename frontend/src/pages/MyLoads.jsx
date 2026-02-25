import { useEffect, useState } from 'react'
import {
  MapPin, Package, CheckCircle, Truck, Navigation, DollarSign, RefreshCw,
  ClipboardCheck, XCircle, MinusCircle, AlertTriangle, ChevronDown, ChevronUp,
  ClipboardList, Wrench, Circle, Droplets, Link2, Octagon, Lightbulb, Armchair,
  Hammer, Laptop, Utensils, Sofa, Cog, Trees, Factory, Ruler, Snowflake, Cable
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

// ── Post-Trip Inspection Data ──────────────────────────────────────────────
const POSTTRIP_GROUPS = [
  { group:'Body & Exterior',   icon: Truck, items:[
    { key:'no_new_damage',    label:'No New Body Damage / Dents' },
    { key:'lights_intact',    label:'All Lights Intact' },
    { key:'mirrors_ok',       label:'Mirrors Undamaged' },
    { key:'windshield_ok',    label:'Windshield Undamaged' },
  ]},
  { group:'Mechanical',        icon: Wrench, items:[
    { key:'no_warning_lights',label:'No Warning Lights On' },
    { key:'no_unusual_sounds',label:'No Unusual Sounds / Vibrations' },
    { key:'brakes_ok',        label:'Brakes Felt Normal All Day' },
    { key:'steering_ok',      label:'Steering Felt Normal' },
    { key:'transmission_ok',  label:'Transmission / Shifting Normal' },
  ]},
  { group:'Tires',             icon: Circle, items:[
    { key:'no_blowouts',      label:'No Blowouts or Flats' },
    { key:'tires_after_run',  label:'Tires Look OK After Run' },
  ]},
  { group:'Fluids',            icon: Droplets, items:[
    { key:'no_new_leaks',     label:'No New Leaks Noticed' },
    { key:'oil_ok_postrun',   label:'Oil Level OK After Run' },
    { key:'coolant_ok_postrun',label:'No Overheating / Coolant OK' },
  ]},
  { group:'Equipment & Cargo', icon: Link2, items:[
    { key:'straps_chains_ok', label:'Straps / Chains / Binders Intact' },
    { key:'tarps_ok',         label:'Tarps / Covers OK' },
    { key:'load_area_clear',  label:'Load Area Cleared / Cleaned' },
  ]},
  { group:'End of Shift',      icon: ClipboardList, items:[
    { key:'cab_clean',        label:'Cab Clean & Trash Removed' },
    { key:'windows_secure',   label:'Windows Closed & Secured' },
    { key:'fuel_ok',          label:'Fuel Level Noted / Adequate for Tomorrow' },
  ]},
]
const DEFAULT_POSTTRIP_ITEMS = {}
POSTTRIP_GROUPS.forEach(g => g.items.forEach(i => { DEFAULT_POSTTRIP_ITEMS[i.key] = 'pass' }))

// ── Pre-Trip Inspection Data ───────────────────────────────────────────────
const INSPECTION_GROUPS = [
  { group:'Brakes',       icon: Octagon, items:[{key:'service_brakes',label:'Service Brakes'},{key:'parking_brake',label:'Parking Brake'}] },
  { group:'Lights',       icon: Lightbulb, items:[{key:'headlights',label:'Headlights'},{key:'taillights',label:'Taillights'},{key:'brake_lights',label:'Brake Lights'},{key:'turn_signals',label:'Turn Signals'},{key:'hazard_lights',label:'Hazard Lights'},{key:'marker_lights',label:'Clearance / Marker Lights'}] },
  { group:'Tires & Wheels',icon: Circle,items:[{key:'tire_condition',label:'Tire Condition & Tread'},{key:'tire_inflation',label:'Tire Inflation'},{key:'wheels_rims',label:'Wheels & Rims'},{key:'lug_nuts',label:'Lug Nuts / Fasteners'}] },
  { group:'Exterior',     icon: Truck, items:[{key:'mirrors',label:'Mirrors (both sides)'},{key:'windshield',label:'Windshield (no cracks)'},{key:'wipers_washers',label:'Wipers & Washers'},{key:'horn',label:'Horn'},{key:'reflectors',label:'Reflectors / Reflective Tape'}] },
  { group:'Engine & Fluids',icon: Wrench,items:[{key:'oil_level',label:'Oil Level'},{key:'coolant_level',label:'Coolant Level'},{key:'fuel_level',label:'Fuel Level'},{key:'no_leaks',label:'No Visible Leaks'},{key:'belts_hoses',label:'Belts & Hoses'},{key:'air_pressure',label:'Air Pressure / Gauges'}] },
  { group:'Cab Interior', icon: Armchair, items:[{key:'seatbelt',label:'Seatbelt'},{key:'steering',label:'Steering (no excessive play)'},{key:'gauges_controls',label:'Gauges & Controls'},{key:'emergency_triangles',label:'Emergency Triangles'},{key:'fire_extinguisher',label:'Fire Extinguisher'},{key:'first_aid',label:'First Aid Kit'}] },
  { group:'Body & Frame',  icon: Truck, items:[{key:'body_damage',label:'No New Body Damage'},{key:'doors_secure',label:'Doors & Latches Secure'},{key:'exhaust',label:'Exhaust System'},{key:'suspension',label:'Suspension'}] },
]
const DEFAULT_ITEMS = {}
INSPECTION_GROUPS.forEach(g => g.items.forEach(i => { DEFAULT_ITEMS[i.key] = 'pass' }))

function ItemToggle({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[
        { v:'pass', icon:CheckCircle, cls:'text-emerald-400 bg-emerald-900/40 border-emerald-600' },
        { v:'fail', icon:XCircle,     cls:'text-red-400 bg-red-900/40 border-red-600' },
        { v:'na',   icon:MinusCircle, cls:'text-slate-400 bg-slate-900/40 border-slate-600' },
      ].map(({ v, icon:Icon, cls }) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${value===v ? cls : 'border-[#1f2937] text-slate-600 hover:border-slate-500'}`}>
          <Icon size={15}/>
        </button>
      ))}
    </div>
  )
}

function PostTripSection() {
  const [trucks, setTrucks]           = useState([])
  const [todayInsp, setTodayInsp]     = useState(null)
  const [loadingInsp, setLoadingInsp] = useState(true)
  const [saving, setSaving]           = useState(false)
  const [expanded, setExpanded]       = useState(null)
  const today = new Date().toISOString().split('T')[0]

  const emptyForm = { truck_id:'', odometer:'', defects_noted:'', driver_signature:'', items:{ ...DEFAULT_POSTTRIP_ITEMS } }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    api.get('/trucks').then(r => setTrucks(r.data.trucks || []))
    api.get('/logbook/posttrip').then(r => {
      const all = r.data.inspections || []
      const done = all.find(i => i.inspection_date === today)
      setTodayInsp(done || null)
    }).finally(() => setLoadingInsp(false))
  }, [])

  function setItem(key, val) { setForm(f => ({ ...f, items:{ ...f.items, [key]:val } })) }

  async function submitInsp(e) {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/logbook/posttrip', { ...form, inspection_date: today })
      const r = await api.get('/logbook/posttrip')
      const all = r.data.inspections || []
      setTodayInsp(all.find(i => i.inspection_date === today) || null)
      setForm(emptyForm)
    } finally { setSaving(false) }
  }

  const failCount = Object.values(form.items).filter(v => v === 'fail').length
  const inp = 'w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors'
  const lbl = 'block text-xs font-medium text-slate-400 mb-1.5'

  if (loadingInsp) return (
    <div className="flex items-center justify-center py-16 text-slate-500 text-sm">Loading...</div>
  )

  // ── Already done today ──────────────────────────────────────────────────
  if (todayInsp) {
    const failedItems = Object.entries(todayInsp.items || {}).filter(([,v]) => v === 'fail')
    const isExpanded = expanded === todayInsp.id
    const repairBadge = {
      none:      { label:'All Clear',     cls:'text-emerald-400 bg-emerald-900/20 border-emerald-700/40' },
      pending:   { label:'Repair Needed', cls:'text-red-400 bg-red-900/20 border-red-700/40' },
      scheduled: { label:'Repair Scheduled', cls:'text-amber-400 bg-amber-900/20 border-amber-700/40' },
      repaired:  { label:'Repaired',    cls:'text-emerald-400 bg-emerald-900/20 border-emerald-700/40' },
    }[todayInsp.repair_status] || { label: todayInsp.repair_status, cls: '' }

    return (
      <div className="space-y-4">
        <div className={`bg-[#111827] rounded-2xl border overflow-hidden ${todayInsp.repair_status === 'pending' ? 'border-red-700/50' : 'border-emerald-700/40'}`}>
          <div className={`px-4 py-3 flex items-center gap-3 ${todayInsp.repair_status === 'pending' ? 'bg-red-900/20' : 'bg-emerald-900/20'}`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${todayInsp.repair_status === 'pending' ? 'text-red-400 bg-red-900/30 border-red-700' : 'text-emerald-400 bg-emerald-900/30 border-emerald-700'}`}>
              {todayInsp.repair_status === 'pending' ? <Wrench size={18}/> : <CheckCircle size={18}/>}
            </div>
            <div className="flex-1">
              <div className={`font-bold text-sm ${todayInsp.repair_status === 'pending' ? 'text-red-400' : 'text-emerald-400'}`}>
                {todayInsp.repair_status === 'pending' ? 'Post-trip filed - repairs needed' : "Today's post-trip complete"}
              </div>
              <div className="text-xs text-slate-500">{todayInsp.truck_name} · {todayInsp.truck_plate}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${repairBadge.cls}`}>{repairBadge.label}</span>
              <button onClick={() => setExpanded(isExpanded ? null : todayInsp.id)} className="text-slate-500 hover:text-white">
                {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
              </button>
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
              {todayInsp.defects_noted && (
                <div><div className="text-xs text-slate-500 mb-1">Driver Notes</div><p className="text-xs text-slate-300">{todayInsp.defects_noted}</p></div>
              )}
              {todayInsp.repair_notes && (
                <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-3">
                  <div className="text-xs font-semibold text-amber-400 mb-1">Repair Notes from Owner</div>
                  <p className="text-xs text-amber-300">{todayInsp.repair_notes}</p>
                </div>
              )}
              <div className="text-xs text-slate-500">Signed: <span className="text-white">{todayInsp.driver_signature}</span></div>
              {todayInsp.odometer && <div className="text-xs text-slate-500">End Odometer: <span className="text-white">{parseInt(todayInsp.odometer).toLocaleString()} mi</span></div>}
            </div>
          )}
        </div>
        <p className="text-center text-xs text-slate-600">Post-trip is once per day. Come back tomorrow.</p>
      </div>
    )
  }

  // ── Form ────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={submitInsp} className="space-y-4">
      <div className="bg-[#111827] rounded-2xl border border-amber-500/30 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-900/30 border border-amber-700/50 flex items-center justify-center">
            <ClipboardList size={20} className="text-amber-400"/>
          </div>
          <div>
            <div className="font-bold text-white">Post-Trip Inspection</div>
            <div className="text-xs text-slate-500">End of shift · {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={lbl}>Vehicle *</label>
            <select className={inp} required value={form.truck_id} onChange={e=>setForm(f=>({...f,truck_id:e.target.value}))}>
              <option value="">— select truck —</option>
              {trucks.map(t=><option key={t.id} value={t.id}>{t.name} · {t.plate} ({t.year} {t.make} {t.model})</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>End Odometer</label>
            <input type="number" className={inp} value={form.odometer} onChange={e=>setForm(f=>({...f,odometer:e.target.value}))} placeholder="Ending mileage"/>
          </div>
          <div className="flex items-end pb-1">
            <div className="text-xs text-slate-500">
              Time: <span className="text-white">{new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</span>
            </div>
          </div>
        </div>

        {failCount > 0 && (
          <div className="mt-3 bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-2 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0"/>
            <span className="text-xs text-red-400 font-semibold">
              {failCount} issue{failCount>1?'s':''} flagged — your owner will be notified to schedule repairs.
            </span>
          </div>
        )}
      </div>

      {POSTTRIP_GROUPS.map(group => {
        const GroupIcon = group.icon
        return (
        <div key={group.group} className="bg-[#111827] rounded-2xl border border-[#1f2937] p-4">
          <h4 className="text-sm font-bold text-white mb-3 inline-flex items-center gap-1.5"><GroupIcon size={14} /> {group.group}</h4>
          <div className="space-y-3">
            {group.items.map(item => (
              <div key={item.key} className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-300 flex-1">{item.label}</span>
                <ItemToggle value={form.items[item.key]} onChange={val => setItem(item.key, val)}/>
              </div>
            ))}
          </div>
        </div>
      )})}

      <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-5 space-y-3">
        <div>
          <label className={lbl}>Issues / Notes (describe anything that needs attention)</label>
          <textarea className={`${inp} resize-none`} rows={3}
            value={form.defects_noted}
            onChange={e=>setForm(f=>({...f,defects_noted:e.target.value}))}
            placeholder="Describe any issues, damage, or concerns from today's run..."/>
        </div>
        <div>
          <label className={lbl}>Driver Signature (full name) *</label>
          <input className={inp} required value={form.driver_signature}
            onChange={e=>setForm(f=>({...f,driver_signature:e.target.value}))}
            placeholder="Type your full name to certify this report"/>
        </div>
        <p className="text-[10px] text-slate-500 italic">
          By signing, I certify this vehicle was inspected at end of shift and all issues have been reported above.
        </p>
        <button type="submit"
          disabled={saving || !form.truck_id || !form.driver_signature}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 rounded-xl text-sm disabled:opacity-50 transition-colors">
          {saving ? 'Submitting...' : failCount > 0 ? `Submit - ${failCount} Issue${failCount>1?'s':''} Flagged` : 'Submit Post-Trip Report'}
        </button>
      </div>
    </form>
  )
}

function PreTripSection() {
  const [trucks, setTrucks]         = useState([])
  const [todayInsp, setTodayInsp]   = useState(null)   // already done today?
  const [loadingInsp, setLoadingInsp] = useState(true)
  const [saving, setSaving]         = useState(false)
  const [expanded, setExpanded]     = useState(null)
  const today = new Date().toISOString().split('T')[0]

  const emptyForm = { truck_id:'', odometer:'', defects_noted:'', driver_signature:'', items:{ ...DEFAULT_ITEMS } }
  const [form, setForm]   = useState(emptyForm)

  useEffect(() => {
    api.get('/trucks').then(r => setTrucks(r.data.trucks || []))
    api.get('/logbook/inspections').then(r => {
      const all = r.data.inspections || []
      const done = all.find(i => i.inspection_date === today)
      setTodayInsp(done || null)
    }).finally(() => setLoadingInsp(false))
  }, [])

  function setItem(key, val) { setForm(f => ({ ...f, items:{ ...f.items, [key]:val } })) }

  async function submitInsp(e) {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/logbook/inspections', { ...form, inspection_date: today })
      // re-fetch to confirm
      const r = await api.get('/logbook/inspections')
      const all = r.data.inspections || []
      setTodayInsp(all.find(i => i.inspection_date === today) || null)
      setForm(emptyForm)
    } finally { setSaving(false) }
  }

  const failCount = Object.values(form.items).filter(v => v === 'fail').length
  const inp = 'w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors'
  const lbl = 'block text-xs font-medium text-slate-400 mb-1.5'

  if (loadingInsp) return (
    <div className="flex items-center justify-center py-16 text-slate-500 text-sm">Loading...</div>
  )

  // ── Already done today ──────────────────────────────────────────────────
  if (todayInsp) {
    const failedItems = Object.entries(todayInsp.items || {}).filter(([,v]) => v === 'fail')
    const isExpanded = expanded === todayInsp.id
    return (
      <div className="space-y-4">
        <div className={`bg-[#111827] rounded-2xl border overflow-hidden ${!todayInsp.overall_pass ? 'border-red-700/50' : 'border-emerald-700/40'}`}>
          {/* Done banner */}
          <div className={`px-4 py-3 flex items-center gap-3 ${todayInsp.overall_pass ? 'bg-emerald-900/20' : 'bg-red-900/20'}`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${todayInsp.overall_pass ? 'text-emerald-400 bg-emerald-900/30 border-emerald-700' : 'text-red-400 bg-red-900/30 border-red-700'}`}>
              {todayInsp.overall_pass ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>}
            </div>
            <div className="flex-1">
              <div className={`font-bold text-sm ${todayInsp.overall_pass ? 'text-emerald-400' : 'text-red-400'}`}>
                {todayInsp.overall_pass ? "Today's inspection complete" : "Defects reported today"}
              </div>
              <div className="text-xs text-slate-500">{todayInsp.truck_name} · {todayInsp.truck_plate}</div>
            </div>
            <button onClick={() => setExpanded(isExpanded ? null : todayInsp.id)} className="text-slate-500 hover:text-white">
              {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </button>
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
              {todayInsp.defects_noted && (
                <div><div className="text-xs text-slate-500 mb-1">Notes</div><p className="text-xs text-slate-300">{todayInsp.defects_noted}</p></div>
              )}
              <div className="text-xs text-slate-500">
                Signed: <span className="text-white">{todayInsp.driver_signature}</span>
              </div>
              {todayInsp.odometer && (
                <div className="text-xs text-slate-500">
                  Odometer: <span className="text-white">{parseInt(todayInsp.odometer).toLocaleString()} mi</span>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-600">Pre-trip inspections are once per day. Come back tomorrow.</p>
      </div>
    )
  }

  // ── Not done today — show form ──────────────────────────────────────────
  return (
    <form onSubmit={submitInsp} className="space-y-4">
      {/* Header card */}
      <div className="bg-[#111827] rounded-2xl border border-amber-500/30 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-900/30 border border-amber-700/50 flex items-center justify-center">
            <ClipboardCheck size={20} className="text-amber-400"/>
          </div>
          <div>
            <div className="font-bold text-white">Pre-Trip Inspection</div>
            <div className="text-xs text-slate-500">{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={lbl}>Vehicle *</label>
            <select className={inp} required value={form.truck_id} onChange={e=>setForm(f=>({...f,truck_id:e.target.value}))}>
              <option value="">— select truck —</option>
              {trucks.map(t=><option key={t.id} value={t.id}>{t.name} · {t.plate} ({t.year} {t.make} {t.model})</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Odometer Reading</label>
            <input type="number" className={inp} value={form.odometer} onChange={e=>setForm(f=>({...f,odometer:e.target.value}))} placeholder="Current mileage"/>
          </div>
          <div className="flex items-end pb-1">
            <div className="text-xs text-slate-500">
              Time: <span className="text-white">{new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</span>
            </div>
          </div>
        </div>

        {failCount > 0 && (
          <div className="mt-3 bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-2 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0"/>
            <span className="text-xs text-red-400 font-semibold">
              {failCount} item{failCount>1?'s':''} marked FAIL — vehicle should not be operated until defects are corrected.
            </span>
          </div>
        )}
      </div>

      {/* Inspection groups */}
      {INSPECTION_GROUPS.map(group => {
        const GroupIcon = group.icon
        return (
        <div key={group.group} className="bg-[#111827] rounded-2xl border border-[#1f2937] p-4">
          <h4 className="text-sm font-bold text-white mb-3 inline-flex items-center gap-1.5"><GroupIcon size={14} /> {group.group}</h4>
          <div className="space-y-3">
            {group.items.map(item => (
              <div key={item.key} className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-300 flex-1">{item.label}</span>
                <ItemToggle value={form.items[item.key]} onChange={val => setItem(item.key, val)}/>
              </div>
            ))}
          </div>
        </div>
      )})}

      {/* Defects + signature */}
      <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-5 space-y-3">
        <div>
          <label className={lbl}>Defects / Notes</label>
          <textarea className={`${inp} resize-none`} rows={3}
            value={form.defects_noted}
            onChange={e=>setForm(f=>({...f,defects_noted:e.target.value}))}
            placeholder="Describe any defects, concerns, or issues found..."/>
        </div>
        <div>
          <label className={lbl}>Driver Signature (full name) *</label>
          <input className={inp} required value={form.driver_signature}
            onChange={e=>setForm(f=>({...f,driver_signature:e.target.value}))}
            placeholder="Type your full name to certify this inspection"/>
        </div>
        <p className="text-[10px] text-slate-500 italic">
          By signing, I certify this vehicle has been inspected and is in satisfactory operating condition, or that all defects have been noted above.
        </p>
        <button type="submit"
          disabled={saving || !form.truck_id || !form.driver_signature}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 rounded-xl text-sm disabled:opacity-50 transition-colors">
          {saving ? 'Submitting...' : failCount > 0 ? `Submit with ${failCount} Defect${failCount>1?'s':''}` : 'Submit Inspection'}
        </button>
      </div>
    </form>
  )
}

// ── Load Card ─────────────────────────────────────────────────────────────
const NEXT_ACTION = {
  pending:    null,
  dispatched: { label:'Confirm & Load Up',  status:'loaded',     icon:Package,      cls:'bg-orange-500 hover:bg-orange-400 text-black' },
  loaded:     { label:"I'm On the Road",    status:'in_transit', icon:Navigation,   cls:'bg-blue-500 hover:bg-blue-400 text-white' },
  in_transit: { label:'Mark Delivered',     status:'delivered',  icon:CheckCircle,  cls:'bg-emerald-500 hover:bg-emerald-400 text-white' },
  delivered:  null,
  invoiced:   null,
  paid:       null,
}
const STATUS_COLORS = {
  pending:'#64748b', dispatched:'#3b82f6', loaded:'#f97316',
  in_transit:'#eab308', delivered:'#10b981', invoiced:'#a855f7', paid:'#22c55e'
}
const STATUS_LABELS = {
  pending:'Pending', dispatched:'Dispatched — Ready to Load', loaded:'Loaded',
  in_transit:'On the Road', delivered:'Delivered', invoiced:'Invoice Sent', paid:'Paid'
}
const MATERIAL_ICONS = {
  'General Freight': Package, 'Auto Parts': Wrench, 'Building Materials': Hammer, 'Electronics': Laptop,
  'Food & Beverage': Utensils, 'Furniture / Household': Sofa, 'Hazmat': AlertTriangle, 'Heavy Equipment': Cog,
  'Lumber': Trees, 'Machinery': Factory, 'Oversized / Wide Load': Ruler, 'Palletized Goods': Package,
  'Refrigerated / Reefer': Snowflake, 'Steel / Metal': Cable, 'Other': Truck,
  asphalt: Package, gravel: Package, sand: Package, salt: Package, dirt: Package, topsoil: Package, concrete: Hammer,
  'Packaged Food': Utensils, 'Steel Beams': Cable, 'Lumber / Building Materials': Trees,
  'General Retail Freight': Package, 'Electronics / Palletized': Laptop,
}

function LoadCard({ load, onUpdate }) {
  const [updating, setUpdating] = useState(false)
  const action = NEXT_ACTION[load.status]

  async function doUpdate() {
    if (!action) return
    setUpdating(true)
    try { await api.put(`/loads/${load.id}/status`, { status:action.status }); onUpdate() }
    finally { setUpdating(false) }
  }

  const isActive = ['dispatched','loaded','in_transit'].includes(load.status)

  return (
    <div className={`bg-[#111827] rounded-2xl border overflow-hidden transition-all ${isActive ? 'border-amber-500/40' : 'border-[#1f2937]'}`}>
      <div className="px-4 py-2 flex items-center justify-between" style={{background:STATUS_COLORS[load.status]+'22'}}>
        <span className="text-xs font-bold" style={{color:STATUS_COLORS[load.status]}}>{STATUS_LABELS[load.status]}</span>
        <span className="text-xs text-slate-500">{load.load_number}</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(() => {
              const MaterialIcon = MATERIAL_ICONS[load.material] || Package
              return <MaterialIcon size={20} className="text-amber-400" />
            })()}
            <div>
              <div className="font-bold text-white capitalize">{load.material}</div>
              <div className="text-xs text-slate-500">{load.truck_name} · {load.plate}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Your Pay</div>
            <div className="text-sm font-bold text-amber-400">${(load.driver_pay||0).toFixed(2)}</div>
          </div>
        </div>

        <div className="bg-[#0a0f1e] rounded-xl p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-900/50 border border-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400"/>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">Pickup</div>
              <div className="text-sm text-white font-medium">{load.pickup_location||'—'}</div>
            </div>
          </div>
          <div className="ml-2.5 border-l border-dashed border-[#2a2d3e] h-3"/>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-900/50 border border-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">Drop-off</div>
              <div className="text-sm text-white font-medium">{load.dropoff_location||'—'}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 text-xs text-slate-400">
          {load.tons > 0 && <span><span className="text-white font-medium">{load.tons}</span> tons</span>}
          {load.miles > 0 && <span><span className="text-white font-medium">{load.miles}</span> mi</span>}
          {load.customer_name && <span>· {load.customer_name}</span>}
          {load.pickup_date && <span>· {load.pickup_date}</span>}
        </div>

        {action && (
          <button onClick={doUpdate} disabled={updating}
            className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-50 ${action.cls}`}>
            <action.icon size={18}/>
            {updating ? 'Updating...' : action.label}
          </button>
        )}

        {load.status === 'delivered' && (
          <div className="flex items-center justify-center gap-2 py-3 text-emerald-400 text-sm font-semibold">
            <CheckCircle size={16}/> Load complete — great work!
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function MyLoads() {
  const [tab, setTab]       = useState('loads')
  const [loads, setLoads]   = useState([])
  const [loading, setLoad]  = useState(true)

  function loadData() {
    setLoad(true)
    api.get('/loads').then(r => setLoads(r.data.loads || [])).finally(() => setLoad(false))
  }
  useEffect(() => { loadData() }, [])

  const active    = loads.filter(l => ['dispatched','loaded','in_transit'].includes(l.status))
  const pending   = loads.filter(l => l.status === 'pending')
  const completed = loads.filter(l => ['delivered','invoiced','paid'].includes(l.status))

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* Sticky header */}
      <div className="bg-[#111827] border-b border-[#1f2937] px-4 pt-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Truck size={20} className="text-amber-400" />
            <div>
              <div className="font-bold text-white">PAYLOAD</div>
              <div className="text-xs text-slate-500">Driver View</div>
            </div>
          </div>
          {tab === 'loads' && (
            <button onClick={loadData} className="text-slate-400 hover:text-amber-400 transition-colors">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''}/>
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1">
          <button
            onClick={() => setTab('pretrip')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              tab === 'pretrip'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>
            <ClipboardCheck size={13}/> Pre-Trip
          </button>
          <button
            onClick={() => setTab('loads')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              tab === 'loads'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>
            <Truck size={13}/>
            My Loads
            {active.length > 0 && (
              <span className="bg-amber-500 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {active.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('posttrip')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              tab === 'posttrip'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>
            <ClipboardList size={13}/> Post-Trip
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6 max-w-lg mx-auto">

        {/* ── PRE-TRIP TAB ── */}
        {tab === 'pretrip' && <PreTripSection/>}

        {/* ── POST-TRIP TAB ── */}
        {tab === 'posttrip' && <PostTripSection/>}

        {/* ── MY LOADS TAB ── */}
        {tab === 'loads' && (
          <>
            {loading && loads.length === 0 && (
              <div className="flex items-center justify-center py-16 text-slate-500">Loading your loads...</div>
            )}

            {active.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"/>
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Active ({active.length})</span>
                </div>
                <div className="space-y-4">
                  {active.map(l => <LoadCard key={l.id} load={l} onUpdate={loadData}/>)}
                </div>
              </div>
            )}

            {pending.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Pending Dispatch ({pending.length})</span>
                </div>
                <div className="space-y-4">
                  {pending.map(l => <LoadCard key={l.id} load={l} onUpdate={loadData}/>)}
                </div>
              </div>
            )}

            {completed.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Completed ({completed.length})</span>
                </div>
                <div className="space-y-4 opacity-70">
                  {completed.slice(0,5).map(l => <LoadCard key={l.id} load={l} onUpdate={loadData}/>)}
                </div>
              </div>
            )}

            {!loading && loads.length === 0 && (
              <div className="text-center py-16">
                <Truck size={40} className="text-slate-700 mx-auto mb-3"/>
                <p className="text-slate-500">No loads assigned to you yet.</p>
                <p className="text-slate-600 text-xs mt-1">Your dispatcher will assign loads here.</p>
              </div>
            )}

            {loads.length > 0 && (
              <div className="bg-[#111827] rounded-2xl border border-[#1f2937] p-4">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  <DollarSign size={12} className="text-amber-400"/> My Earnings
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xl font-bold text-white">{loads.length}</div>
                    <div className="text-xs text-slate-500">Total Loads</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-emerald-400">
                      ${loads.filter(l=>['delivered','invoiced','paid'].includes(l.status)).reduce((s,l)=>s+(l.driver_pay||0),0).toFixed(0)}
                    </div>
                    <div className="text-xs text-slate-500">Earned</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-amber-400">
                      ${loads.filter(l=>['dispatched','loaded','in_transit'].includes(l.status)).reduce((s,l)=>s+(l.driver_pay||0),0).toFixed(0)}
                    </div>
                    <div className="text-xs text-slate-500">Pending</div>
                  </div>
                </div>
              </div>
            )}

            <button onClick={() => { localStorage.removeItem('hc_token'); window.location.href='/login' }}
              className="w-full py-3 rounded-xl text-sm text-slate-500 border border-[#1f2937] hover:border-slate-500 hover:text-slate-400 transition-colors">
              Sign Out
            </button>
          </>
        )}

      </div>
    </div>
  )
}
