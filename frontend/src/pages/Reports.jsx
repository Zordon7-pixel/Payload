import { useEffect, useState } from 'react'
import api from '../lib/api'

export default function Reports() {
  const [data, setData] = useState(null)
  useEffect(() => { api.get('/reports/summary').then(r => setData(r.data)) }, [])
  if (!data) return <div className="flex items-center justify-center h-64 text-slate-500">Loading...</div>

  const margin = data.grossRev > 0 ? Math.round((data.netProfit / data.grossRev) * 100) : 0

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-bold text-white">Reports</h1><p className="text-slate-500 text-sm">Calvo Hauling LLC financial overview</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Total Loads', value: data.total, color:'text-amber-400' },
          { label:'Delivered', value: data.delivered, color:'text-emerald-400' },
          { label:'Gross Revenue', value: `$${data.grossRev?.toLocaleString()}`, color:'text-blue-400' },
          { label:'Net Profit', value: `$${data.netProfit?.toLocaleString()} (${margin}%)`, color:'text-green-400' },
        ].map(m => (
          <div key={m.label} className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
            <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      {data.unpaid?.n > 0 && (
        <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4">
          <div className="text-sm font-bold text-red-300 mb-1">⚠️ Accounts Receivable</div>
          <div className="text-xs text-slate-400">{data.unpaid.n} loads delivered but not yet paid — <strong className="text-red-400">${data.unpaid.amount?.toFixed(2)}</strong> outstanding</div>
        </div>
      )}

      <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-4">
        <h2 className="text-sm font-semibold text-white mb-3">Revenue by Material</h2>
        <div className="space-y-3">
          {data.byMaterial?.map(m => {
            const pct = data.grossRev > 0 ? Math.round((m.revenue / data.grossRev) * 100) : 0
            return (
              <div key={m.material}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 capitalize">{m.material} <span className="text-slate-600">({m.count} loads)</span></span>
                  <span className="text-white font-medium">${m.revenue?.toLocaleString()} ({pct}%)</span>
                </div>
                <div className="w-full bg-[#0a0f1e] rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-amber-500 transition-all" style={{width:`${pct}%`}} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-4">
        <h2 className="text-sm font-semibold text-white mb-3">Truck Performance</h2>
        <div className="space-y-3">
          {data.byTruck?.map(t => (
            <div key={t.name} className="flex items-center gap-4 p-3 bg-[#0a0f1e] rounded-lg">
              <span className="text-2xl">🚛</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{t.name} <span className="text-slate-500 text-xs">({t.plate})</span></div>
                <div className="text-xs text-slate-500">{t.loads} loads</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-amber-400">${t.revenue?.toFixed(0)}</div>
                <div className="text-xs text-emerald-400">${t.profit?.toFixed(0)} net</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
