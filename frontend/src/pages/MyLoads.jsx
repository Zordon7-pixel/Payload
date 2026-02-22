import { useEffect, useState } from 'react'
import { MapPin, Package, CheckCircle, Truck, Navigation, DollarSign, RefreshCw, BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

// Driver's next-action map — what button to show and what status it sets
const NEXT_ACTION = {
  pending:    null,                               // dispatcher must confirm first
  dispatched: { label: 'Confirm & Load Up',  status: 'loaded',     icon: Package,      cls: 'bg-orange-500 hover:bg-orange-400 text-black' },
  loaded:     { label: 'I\'m On the Road',   status: 'in_transit', icon: Navigation,   cls: 'bg-blue-500 hover:bg-blue-400 text-white' },
  in_transit: { label: 'Mark Delivered',     status: 'delivered',  icon: CheckCircle,  cls: 'bg-emerald-500 hover:bg-emerald-400 text-white' },
  delivered:  null,                               // done — owner handles invoice/paid
  invoiced:   null,
  paid:       null,
}

const STATUS_COLORS = {
  pending:'#64748b', dispatched:'#3b82f6', loaded:'#f97316',
  in_transit:'#eab308', delivered:'#10b981', invoiced:'#a855f7', paid:'#22c55e'
}
const STATUS_LABELS = {
  pending:'Pending', dispatched:'Dispatched — Ready to Load', loaded:'Loaded',
  in_transit:'On the Road', delivered:'Delivered ✓', invoiced:'Invoice Sent', paid:'Paid ✓'
}

function LoadCard({ load, onUpdate }) {
  const [updating, setUpdating] = useState(false)
  const action = NEXT_ACTION[load.status]

  async function doUpdate() {
    if (!action) return
    setUpdating(true)
    try { await api.put(`/loads/${load.id}/status`, { status: action.status }); onUpdate() }
    finally { setUpdating(false) }
  }

  const isActive = ['dispatched','loaded','in_transit'].includes(load.status)

  return (
    <div className={`bg-[#111827] rounded-2xl border overflow-hidden transition-all ${isActive ? 'border-amber-500/40' : 'border-[#1f2937]'}`}>
      {/* Status bar */}
      <div className="px-4 py-2 flex items-center justify-between" style={{background: STATUS_COLORS[load.status]+'22'}}>
        <span className="text-xs font-bold" style={{color: STATUS_COLORS[load.status]}}>{STATUS_LABELS[load.status]}</span>
        <span className="text-xs text-slate-500">{load.load_number}</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Material + truck */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{MATERIAL_EMOJI[load.material] || '📦'}</span>
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

        {/* Route */}
        <div className="bg-[#0a0f1e] rounded-xl p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-900/50 border border-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">Pickup</div>
              <div className="text-sm text-white font-medium">{load.pickup_location || '—'}</div>
            </div>
          </div>
          <div className="ml-2.5 border-l border-dashed border-[#2a2d3e] h-3" />
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-900/50 border border-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">Drop-off</div>
              <div className="text-sm text-white font-medium">{load.dropoff_location || '—'}</div>
            </div>
          </div>
        </div>

        {/* Load details */}
        <div className="flex gap-3 text-xs text-slate-400">
          {load.tons > 0 && <span><span className="text-white font-medium">{load.tons}</span> tons</span>}
          {load.miles > 0 && <span><span className="text-white font-medium">{load.miles}</span> mi</span>}
          {load.customer_name && <span>· {load.customer_name}</span>}
          {load.pickup_date && <span>· {load.pickup_date}</span>}
        </div>

        {/* Action button */}
        {action && (
          <button onClick={doUpdate} disabled={updating}
            className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl text-sm transition-colors disabled:opacity-50 ${action.cls}`}>
            <action.icon size={18} />
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

const MATERIAL_EMOJI = { asphalt:'🛣️', gravel:'🪨', sand:'🏜️', salt:'🧂', dirt:'🌱', mulch:'🌿', topsoil:'🌍', concrete:'🏗️' }

export default function MyLoads() {
  const [loads, setLoads]   = useState([])
  const [loading, setLoad]  = useState(true)
  const navigate = useNavigate()

  function load() {
    setLoad(true)
    api.get('/loads').then(r => setLoads(r.data.loads || [])).finally(() => setLoad(false))
  }
  useEffect(() => { load() }, [])

  const active    = loads.filter(l => ['dispatched','loaded','in_transit'].includes(l.status))
  const pending   = loads.filter(l => l.status === 'pending')
  const completed = loads.filter(l => ['delivered','invoiced','paid'].includes(l.status))

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* Header */}
      <div className="bg-[#111827] border-b border-[#1f2937] px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚛</span>
          <div>
            <div className="font-bold text-white">PAYLOAD</div>
            <div className="text-xs text-slate-500">My Loads</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/logbook')} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors border border-[#1f2937] hover:border-amber-500 px-3 py-1.5 rounded-lg">
            <BookOpen size={13}/> Logbook
          </button>
          <button onClick={load} className="text-slate-400 hover:text-amber-400 transition-colors">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6 max-w-lg mx-auto">

        {loading && loads.length === 0 && (
          <div className="flex items-center justify-center py-16 text-slate-500">Loading your loads...</div>
        )}

        {/* Active loads — top priority */}
        {active.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Active ({active.length})</span>
            </div>
            <div className="space-y-4">
              {active.map(l => <LoadCard key={l.id} load={l} onUpdate={load} />)}
            </div>
          </div>
        )}

        {/* Pending — waiting for dispatch */}
        {pending.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Pending Dispatch ({pending.length})</span>
            </div>
            <div className="space-y-4">
              {pending.map(l => <LoadCard key={l.id} load={l} onUpdate={load} />)}
            </div>
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Completed ({completed.length})</span>
            </div>
            <div className="space-y-4 opacity-70">
              {completed.slice(0,5).map(l => <LoadCard key={l.id} load={l} onUpdate={load} />)}
            </div>
          </div>
        )}

        {!loading && loads.length === 0 && (
          <div className="text-center py-16">
            <Truck size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">No loads assigned to you yet.</p>
            <p className="text-slate-600 text-xs mt-1">Your dispatcher will assign loads here.</p>
          </div>
        )}

        {/* Earnings summary */}
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

        {/* Log out */}
        <button onClick={() => { localStorage.removeItem('hc_token'); window.location.href='/login' }}
          className="w-full py-3 rounded-xl text-sm text-slate-500 border border-[#1f2937] hover:border-slate-500 hover:text-slate-400 transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  )
}
