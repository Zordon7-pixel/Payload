import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight } from 'lucide-react'
import api from '../lib/api'
import AddLoadModal from '../components/AddLoadModal'

export const STATUS_COLORS = { pending:'#64748b', dispatched:'#3b82f6', loaded:'#f97316', in_transit:'#eab308', delivered:'#10b981', invoiced:'#a855f7', paid:'#22c55e' }
export const STATUS_LABELS = { pending:'Pending', dispatched:'Dispatched', loaded:'Loaded', in_transit:'In Transit', delivered:'Delivered', invoiced:'Invoiced', paid:'Paid' }
const STAGES = ['pending','dispatched','loaded','in_transit','delivered','invoiced','paid']
const MATERIAL_ICONS = { salt:'🧂', sand:'🏜️', gravel:'🪨', asphalt:'🛣️', dirt:'🌱', mulch:'🌿' }

export default function Loads() {
  const [loads, setLoads] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const navigate = useNavigate()

  const load = () => api.get('/loads').then(r => setLoads(r.data.loads))
  useEffect(() => { load() }, [])

  async function advance(l, e) {
    e.stopPropagation()
    const idx = STAGES.indexOf(l.status)
    if (idx < STAGES.length - 1) {
      await api.put(`/loads/${l.id}/status`, { status: STAGES[idx + 1] })
      load()
    }
  }

  const byStatus = stage => loads.filter(l => l.status === stage)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Loads</h1>
          <p className="text-slate-500 text-sm">{loads.length} total · {loads.filter(l=>!['paid','delivered'].includes(l.status)).length} active</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> New Load
        </button>
      </div>

      <div className="pipeline-scroll">
        <div className="flex gap-3 min-w-max pb-2">
          {STAGES.map(stage => (
            <div key={stage} className="w-56 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{background: STATUS_COLORS[stage]}} />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">{STATUS_LABELS[stage]}</span>
                <span className="ml-auto text-xs bg-[#1f2937] text-slate-400 px-2 py-0.5 rounded-full">{byStatus(stage).length}</span>
              </div>
              <div className="space-y-2">
                {byStatus(stage).map(l => (
                  <div key={l.id} onClick={() => navigate(`/loads/${l.id}`)}
                    className="bg-[#111827] border border-[#1f2937] hover:border-amber-500/50 rounded-xl p-3 cursor-pointer transition-all group"
                    style={{borderLeft: `3px solid ${STATUS_COLORS[stage]}`}}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-amber-400">{l.load_number}</span>
                      <span className="text-sm">{MATERIAL_ICONS[l.material] || '📦'}</span>
                    </div>
                    <div className="text-sm font-bold text-white capitalize">{l.material}</div>
                    <div className="text-xs text-slate-300 truncate">{l.customer_name}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{l.truck_name} · {l.tons}t · {l.miles}mi</div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-sm font-bold text-amber-400">${parseFloat(l.gross_revenue||0).toFixed(0)}</span>
                      {l.paid ? <span className="text-[9px] bg-emerald-900/40 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">PAID</span>
                               : <span className="text-[9px] bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded-full font-bold">UNPAID</span>}
                    </div>
                    {stage !== 'paid' && (
                      <button onClick={e => advance(l, e)}
                        className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] text-slate-500 hover:text-amber-400 hover:bg-amber-900/20 rounded-lg py-1 transition-all opacity-0 group-hover:opacity-100">
                        → {STATUS_LABELS[STAGES[STAGES.indexOf(stage)+1]]} <ChevronRight size={10} />
                      </button>
                    )}
                  </div>
                ))}
                {byStatus(stage).length === 0 && (
                  <div className="text-center text-slate-600 text-xs py-8 border border-dashed border-[#1f2937] rounded-xl leading-relaxed">
                    <div className="text-lg mb-1">🚛</div>
                    No loads here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAdd && <AddLoadModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load() }} />}
    </div>
  )
}
