import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Package, DollarSign, Route, AlertCircle, Plus, BarChart2 } from 'lucide-react'
import api from '../lib/api'
import AddLoadModal from '../components/AddLoadModal'

const SOURCE_LABELS = { direct:'Direct', dat:'DAT', truckstop:'Truckstop.com', broker:'Broker', aggtrans:'Aggtrans', aggdirect:'AggDirect', other:'Other' }
const SOURCE_COLORS = { direct:'#22c55e', dat:'#f97316', truckstop:'#3b82f6', broker:'#a855f7', aggtrans:'#f59e0b', aggdirect:'#06b6d4', other:'#64748b' }

const LOAD_STATUS = {
  pending: { color: 'bg-slate-700 text-slate-200', icon: '📋', label: 'Pending' },
  dispatched: { color: 'bg-blue-900/60 text-blue-300', icon: '📡', label: 'Dispatched' },
  loaded: { color: 'bg-amber-900/60 text-amber-300', icon: '📦', label: 'Loaded' },
  in_transit: { color: 'bg-orange-900/60 text-orange-300', icon: '🚛', label: 'In Transit' },
  delivered: { color: 'bg-emerald-900/60 text-emerald-300', icon: '✅', label: 'Delivered' },
  invoiced: { color: 'bg-purple-900/60 text-purple-300', icon: '🧾', label: 'Invoiced' },
  paid: { color: 'bg-green-900/60 text-green-300', icon: '💰', label: 'Paid' },
}

function LoadStatusBadge({ status }) {
  const cfg = LOAD_STATUS[status] || { color: 'bg-slate-700 text-slate-300', icon: '❓', label: status }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <span>{cfg.icon}</span>{cfg.label}
    </span>
  )
}

function useCountUp(target, duration = 1000) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!target) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return count
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const navigate = useNavigate()
  const load = () => api.get('/reports/summary').then(r => setData(r.data))
  useEffect(() => { load() }, [])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning 👋'
    if (hour < 18) return 'Good afternoon 👋'
    return 'Good evening 👋'
  }, [])

  // All hooks must be called unconditionally — before any early return
  const totalLoads = data ? Number(data.totalLoads || data.total || (data.active || 0) + (data.delivered || 0)) : 0
  const grossRevenue = data ? Number(data.grossRev || 0) : 0
  const totalMilesRaw = data ? Number(data.totalMiles || data.miles || (data.recent || []).reduce((sum, l) => sum + Number(l.miles || 0), 0)) : 0
  const unpaidAmount = data ? Number(data.unpaid?.amount || 0) : 0

  const totalLoadsCount = useCountUp(totalLoads)
  const grossRevenueCount = useCountUp(grossRevenue)
  const totalMilesCount = useCountUp(totalMilesRaw)
  const unpaidCount = useCountUp(unpaidAmount)

  if (!data) return <div className="flex items-center justify-center h-64 text-slate-500">Loading your fleet data...</div>

  const stats = [
    { label: 'Active Loads', value: totalLoadsCount.toLocaleString(), icon: Package, color: 'text-amber-300', bg: 'bg-gradient-to-br from-amber-900/40 to-[#1a1d2e]', accent: 'bg-amber-500' },
    { label: 'Revenue', value: `$${grossRevenueCount.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-300', bg: 'bg-gradient-to-br from-emerald-900/40 to-[#1a1d2e]', accent: 'bg-emerald-500' },
    { label: 'Miles', value: `${totalMilesCount.toLocaleString()} mi`, icon: Route, color: 'text-blue-300', bg: 'bg-gradient-to-br from-blue-900/40 to-[#1a1d2e]', accent: 'bg-blue-500' },
    { label: 'Unpaid', value: `$${unpaidCount.toLocaleString()}`, icon: Truck, color: 'text-slate-200', bg: 'bg-gradient-to-br from-slate-800/60 to-[#1a1d2e]', accent: 'bg-slate-400' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Fleet Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">{greeting}</p>
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
          <div key={s.label} className={`${s.bg} rounded-xl border border-[#2a3045] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.25)]`}>
            <div className={`h-1 w-full ${s.accent}`} />
            <div className="p-4">
              <div className="w-9 h-9 bg-black/20 rounded-lg flex items-center justify-center mb-3 border border-white/10">
                <s.icon size={18} className={s.color} />
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
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
                className="flex items-center gap-3 p-2 rounded-lg transition-all duration-150 hover:bg-[#1e2235] hover:scale-[1.01] cursor-pointer">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background: (SOURCE_COLORS[l.source] || '#64748b')}} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{l.load_number} · {l.material} · {l.truck_name}</div>
                  <div className="text-[10px] text-slate-500">{l.customer_name}</div>
                </div>
                <LoadStatusBadge status={l.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
      {data.bySource?.length > 0 && (
        <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-amber-400" />
            <h2 className="font-semibold text-sm text-white">Source Profitability</h2>
            <span className="text-[10px] text-slate-500 ml-auto">Which platform actually pays you more?</span>
          </div>
          <div className="space-y-3">
            {data.bySource.map(s => {
              const maxGross = Math.max(...data.bySource.map(x => x.gross), 1)
              const pct = (s.gross / maxGross) * 100
              const color = SOURCE_COLORS[s.source] || SOURCE_COLORS.other
              return (
                <div key={s.source}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:color}} />
                      <span className="font-semibold text-white">{SOURCE_LABELS[s.source] || s.source}</span>
                      <span className="text-slate-500">{s.loads} load{s.loads!==1?'s':''}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400">${s.gross.toFixed(0)} gross</span>
                      <span className="text-emerald-400 font-semibold">${s.net.toFixed(0)} net</span>
                      <span className={`font-bold ${s.margin_pct >= 50 ? 'text-emerald-400' : s.margin_pct >= 30 ? 'text-amber-400' : 'text-red-400'}`}>{s.margin_pct}% margin</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#0a0f1e] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{width:`${pct}%`, background:color}} />
                  </div>
                </div>
              )
            })}
          </div>
          {data.bySource.length > 1 && (() => {
            const best = [...data.bySource].sort((a,b) => b.margin_pct - a.margin_pct)[0]
            return (
              <div className="mt-3 pt-3 border-t border-[#1f2937] text-xs text-slate-400">
                💡 <strong className="text-white">{SOURCE_LABELS[best.source] || best.source}</strong> is your most profitable source at <strong className="text-emerald-400">{best.margin_pct}% margin</strong>
              </div>
            )
          })()}
        </div>
      )}

      {showAdd && <AddLoadModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load() }} />}
    </div>
  )
}
