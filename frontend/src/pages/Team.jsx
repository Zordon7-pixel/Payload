import { useEffect, useState } from 'react'
import { Users, Plus, X, Truck, Shield, User, Trash2 } from 'lucide-react'
import api from '../lib/api'

const ROLE_META = {
  owner:          { label: 'Owner',          icon: Shield, cls: 'text-purple-400 bg-purple-900/30 border-purple-700', desc: 'Full access. Manages business, dispatches loads, sees all financials.' },
  owner_operator: { label: 'Owner-Operator', icon: Truck,  cls: 'text-amber-400  bg-amber-900/30  border-amber-700',  desc: 'Drives their own truck AND runs the business. Full access + driver workflow.' },
  driver:         { label: 'Driver',         icon: User,   cls: 'text-blue-400   bg-blue-900/30   border-blue-700',   desc: 'Road only. Sees their loads, updates status, logs fuel. No financials.' },
}

export default function Team() {
  const [users,   setUsers]   = useState([])
  const [trucks,  setTrucks]  = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const empty = { name:'', email:'', password:'', role:'driver', phone:'', truck_id:'' }
  const [form, setForm] = useState(empty)

  useEffect(() => { load() }, [])
  function load() {
    api.get('/users').then(r => setUsers(r.data.users || []))
    api.get('/trucks').then(r => setTrucks(r.data.trucks || []))
  }

  function set(k,v) { setForm(f=>({...f,[k]:v})) }

  async function save(e) {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/users', { ...form, truck_id: form.truck_id || undefined })
      load(); close()
    } catch(err) { alert(err?.response?.data?.error || 'Error') }
    finally { setSaving(false) }
  }

  async function remove(id, name) {
    if (!confirm(`Remove ${name}?`)) return
    await api.delete(`/users/${id}`)
    load()
  }

  function close() { setShowAdd(false); setForm(empty) }

  const inp = 'w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors'
  const lbl = 'block text-xs font-medium text-slate-400 mb-1.5'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Team</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage your drivers and operators</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2.5 rounded-lg text-sm">
          <Plus size={15}/> Add Member
        </button>
      </div>

      {/* Role breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.entries(ROLE_META).map(([role, meta]) => {
          const Icon = meta.icon
          return (
            <div key={role} className={`rounded-xl p-3 border ${meta.cls}`}>
              <div className={`flex items-center gap-2 text-xs font-semibold mb-1 ${meta.cls.split(' ')[0]}`}>
                <Icon size={12}/> {meta.label}
              </div>
              <p className="text-[11px] text-slate-500">{meta.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Team list */}
      {users.length === 0 ? (
        <div className="bg-[#111827] rounded-xl p-8 text-center border border-[#1f2937]">
          <Users size={32} className="text-slate-600 mx-auto mb-3"/>
          <p className="text-slate-500 text-sm">No team members yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(u => {
            const meta = ROLE_META[u.role] || ROLE_META.driver
            const Icon = meta.icon
            return (
              <div key={u.id} className="bg-[#111827] rounded-xl p-4 border border-[#1f2937] flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0 ${meta.cls}`}>
                  <Icon size={17}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.email}{u.phone ? ` · ${u.phone}` : ''}</div>
                  {u.truck_name && (
                    <div className="text-xs text-amber-400 mt-0.5 flex items-center gap-1">
                      <Truck size={10}/> {u.truck_name} ({u.truck_plate})
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 text-right flex-shrink-0">
                  <div>
                    <div className="text-xs text-slate-500">{u.total_loads || 0} loads</div>
                    {(u.total_earned > 0) && <div className="text-xs text-emerald-400">${(u.total_earned||0).toFixed(0)} earned</div>}
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${meta.cls}`}>
                    {meta.label}
                  </span>
                  <button onClick={() => remove(u.id, u.name)} className="text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 size={15}/>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] rounded-2xl border border-[#1f2937] w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#1f2937]">
              <h3 className="font-bold text-white">Add Team Member</h3>
              <button onClick={close} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className={lbl}>Full Name *</label><input className={inp} required value={form.name} onChange={e=>set('name',e.target.value)} placeholder="John Smith"/></div>
                <div><label className={lbl}>Email *</label><input className={inp} required type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="john@example.com"/></div>
                <div><label className={lbl}>Phone</label><input className={inp} value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="(555) 000-0000"/></div>
                <div className="col-span-2"><label className={lbl}>Password *</label><input className={inp} required type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Temp password"/></div>
              </div>

              <div>
                <label className={lbl}>Role *</label>
                <div className="space-y-2">
                  {Object.entries(ROLE_META).filter(([r])=>r!=='owner').map(([role, meta]) => {
                    const Icon = meta.icon
                    return (
                      <label key={role} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.role===role ? meta.cls : 'border-[#1f2937] bg-[#0a0f1e]'}`}>
                        <input type="radio" className="mt-0.5 accent-amber-500" name="role" value={role} checked={form.role===role} onChange={e=>set('role',e.target.value)}/>
                        <div>
                          <div className={`flex items-center gap-1.5 text-xs font-semibold ${form.role===role ? meta.cls.split(' ')[0] : 'text-slate-400'}`}>
                            <Icon size={11}/> {meta.label}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{meta.desc}</div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {(form.role === 'driver' || form.role === 'owner_operator') && (
                <div>
                  <label className={lbl}>Assigned Truck</label>
                  <select className={inp} value={form.truck_id} onChange={e=>set('truck_id',e.target.value)}>
                    <option value="">— assign a truck (optional) —</option>
                    {trucks.map(t=><option key={t.id} value={t.id}>{t.name} · {t.plate} ({t.year} {t.make} {t.model})</option>)}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={close} className="flex-1 bg-[#0a0f1e] text-slate-400 rounded-lg py-2.5 text-sm border border-[#1f2937]">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg py-2.5 text-sm disabled:opacity-50">
                  {saving ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
