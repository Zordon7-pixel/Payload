import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Package, DollarSign, TrendingUp, AlertCircle, Plus } from 'lucide-react'
import api from '../lib/api'
import AddLoadModal from '../components/AddLoadModal'

const STATUS_COLORS = { pending:'#64748b', dispatched:'#3b82f6', loaded:'#f97316', in_transit:'#eab308', delivered:'#10b981', invoiced:'#a855f7', paid:'#22c55e' }
const STATUS_LABELS = { pending:'Pending', dispatched:'Dispatched', loaded:'Loaded', in_transit:'In Transit', delivered:'Delivered', invoiced:'Invoiced', paid:'Paid' }

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const navigate = useNavigate()
  const load = () => api.get('/reports/summary').then(r => setData(r.data))
  useEffect(() => { load() }, [])
  if (!data) return <div className="flex items-center justify-center h-64 text-slate-500">Loading...</div>

  const stats = [
    { label: 'Active Loads', value: data.active, icon: Package, color: 'text-amber-400', bg: 'bg-amber-900/30' },
    { label: 'Delivered', value: data.delivered, icon: Truck, color: 'text-emerald-400', bg: 'bg-emerald-900/30' },
    { label: 'Gross Revenue', value: `$${data.grossRev?.toLocaleString()}`, icon: DollarSign, color: 'text-blue-400', bg: 'bg-blue-900/30' },
    { label: 'Net Profit', value: `$${data.netProfit?.toLocaleString()}`, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-900/30' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Fleet Dashboard</h1>
          <p className="text-slate-500 text-sm">PAYLOAD — Fleet Operations</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex-shrink-0 flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-4 py-2.5 rounded-lg transition-colors">
          <Plus size={16} /> Log a Load
        </button>
      </div>

      {data.unpaid?.n > 0 && (
        <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-3 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-300"><strong>{data.unpaid.n} loads</strong> delivered but unpaid — <strong>${data.unpaid.amount?.toFixed(0)}</strong> outstanding</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
            <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-4">
          <h2 className="font-semibold text-sm text-white mb-3">Fleet Performance</h2>
          {data.byTruck?.map(t => (
            <div key={t.name} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white font-medium">{t.name} <span className="text-slate-500">({t.plate})</span></span>
                <span className="text-amber-400 font-bold">${t.revenue?.toFixed(0)} gross</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>{t.loads} loads</span>
                <span className="text-emerald-400">${t.profit?.toFixed(0)} net</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-4">
          <h2 className="font-semibold text-sm text-white mb-3">Recent Loads</h2>
          <div className="space-y-2">
            {data.recent?.slice(0,6).map(l => (
              <div key={l.id} onClick={() => navigate(`/loads/${l.id}`)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1f2937] cursor-pointer transition-colors">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background: STATUS_COLORS[l.status]}} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{l.load_number} · {l.material} · {l.truck_name}</div>
                  <div className="text-[10px] text-slate-500">{l.customer_name}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{background: STATUS_COLORS[l.status]+'22', color: STATUS_COLORS[l.status]}}>
                  {STATUS_LABELS[l.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showAdd && <AddLoadModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load() }} />}
    </div>
  )
}
