import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, Package, Wrench, Hammer, Laptop, Utensils, Sofa, AlertTriangle, Cog, Trees, Factory, Ruler, Snowflake, Cable, Truck, ClipboardList, Radio, FileText, DollarSign, HelpCircle, X } from 'lucide-react'
import api from '../lib/api'
import AddLoadModal from '../components/AddLoadModal'

export const STATUS_COLORS = { pending:'#64748b', dispatched:'#3b82f6', loaded:'#f97316', in_transit:'#eab308', delivered:'#10b981', invoiced:'#a855f7', paid:'#22c55e' }
export const STATUS_LABELS = { pending:'Pending', dispatched:'Dispatched', loaded:'Loaded', in_transit:'In Transit', delivered:'Delivered', invoiced:'Invoiced', paid:'Paid' }
const STAGES = ['pending','dispatched','loaded','in_transit','delivered','invoiced','paid']
const MATERIAL_ICONS = {
  'General Freight': Package, 'Auto Parts': Wrench, 'Building Materials': Hammer, 'Electronics': Laptop,
  'Food & Beverage': Utensils, 'Furniture / Household': Sofa, 'Hazmat': AlertTriangle, 'Heavy Equipment': Cog,
  'Lumber': Trees, 'Machinery': Factory, 'Oversized / Wide Load': Ruler, 'Palletized Goods': Package,
  'Refrigerated / Reefer': Snowflake, 'Steel / Metal': Cable, 'Other': Truck,
}

const LOAD_STATUS = {
  pending: { color: 'bg-slate-700 text-slate-200', icon: ClipboardList, label: 'Pending' },
  dispatched: { color: 'bg-blue-900/60 text-blue-300', icon: Radio, label: 'Dispatched' },
  loaded: { color: 'bg-amber-900/60 text-amber-300', icon: Package, label: 'Loaded' },
  in_transit: { color: 'bg-orange-900/60 text-orange-300', icon: Truck, label: 'In Transit' },
  delivered: { color: 'bg-emerald-900/60 text-emerald-300', icon: Package, label: 'Delivered' },
  invoiced: { color: 'bg-purple-900/60 text-purple-300', icon: FileText, label: 'Invoiced' },
  paid: { color: 'bg-green-900/60 text-green-300', icon: DollarSign, label: 'Paid' },
}

function LoadStatusBadge({ status }) {
  const cfg = LOAD_STATUS[status] || { color: 'bg-slate-700 text-slate-300', icon: HelpCircle, label: status }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon size={12} />{cfg.label}
    </span>
  )
}

export default function Loads() {
  const [loads, setLoads] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
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

  const filteredLoads = loads.filter(l => {
    const haystack = `${l.load_number || ''} ${l.pickup_location || l.origin || ''} ${l.dropoff_location || l.destination || ''}`.toLowerCase()
    const matchesSearch = !search || haystack.includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter
    const pick = l.pickup_date ? new Date(l.pickup_date) : null
    const fromOk = !fromDate || (pick && pick >= new Date(fromDate))
    const toOk = !toDate || (pick && pick <= new Date(toDate))
    return matchesSearch && matchesStatus && fromOk && toOk
  })

  const byStatus = stage => filteredLoads.filter(l => l.status === stage)

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

      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-3">
        <div className="grid md:grid-cols-5 gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search load #, origin, destination"
            className="md:col-span-2 bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="paid">Paid</option>
          </select>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
        </div>
        <div className="mt-2">
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); setFromDate(''); setToDate('') }}
            className="inline-flex items-center gap-1.5 text-xs text-slate-300 border border-[#1f2937] hover:border-amber-500 hover:text-amber-400 px-2.5 py-1 rounded-lg transition-colors"
          >
            <X size={12} /> Clear Filters
          </button>
        </div>
      </div>

      {loads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <img src="/empty-loads.png" alt="" className="w-40 h-40 opacity-90 object-contain" />
          <p className="text-slate-400 text-sm font-medium">No loads dispatched yet.</p>
          <p className="text-slate-600 text-xs">Add your first load to get rolling.</p>
        </div>
      ) : (
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
                      className="bg-[#111827] border border-[#1f2937] hover:border-amber-500/50 rounded-xl p-3 transition-all duration-150 hover:bg-[#1e2235] hover:scale-[1.01] cursor-pointer group"
                      style={{borderLeft: `3px solid ${STATUS_COLORS[stage]}`}}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-amber-400">{l.load_number}</span>
                        {(() => {
                          const MaterialIcon = MATERIAL_ICONS[l.material] || Package
                          return <MaterialIcon size={14} className="text-amber-400" />
                        })()}
                      </div>
                      <div className="mb-1.5"><LoadStatusBadge status={l.status} /></div>
                      <div className="text-sm font-bold text-white capitalize">{l.material}</div>
                      <div className="text-xs text-slate-300 truncate">{l.customer_name}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{l.truck_name}{l.miles > 0 ? ` · ${l.miles}mi` : ''}</div>
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
                      <div className="flex justify-center mb-1"><Truck size={16} /></div>
                      No loads here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAdd && <AddLoadModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load() }} />}
    </div>
  )
}
