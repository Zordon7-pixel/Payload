import { useEffect, useState } from 'react'
import { AlertTriangle, Truck, BarChart2, DollarSign, User } from 'lucide-react'
import api from '../lib/api'
import { getTokenPayload } from '../lib/auth'

export default function Reports() {
  const [data, setData] = useState(null)
  const tokenPayload = getTokenPayload()
  const companyName = tokenPayload?.company_name || tokenPayload?.shop_name || tokenPayload?.company || 'My Company'

  useEffect(() => { api.get('/reports/summary').then(r => setData(r.data)) }, [])
  if (!data) return <div className="flex items-center justify-center h-64 text-slate-500">Loading...</div>

  const margin = data.grossRev > 0 ? Math.round((data.netProfit / data.grossRev) * 100) : 0
  const currency = value => `$${Number(value || 0).toLocaleString()}`
  const bySource = data.bySource || []
  const byDriver = data.byDriver || []
  const byTruck = data.byTruck || []
  const expenses = [
    { category: 'Load Fuel Cost', amount: data.expenses?.fuel },
    { category: 'Driver Pay', amount: data.expenses?.driverPay },
    { category: 'Fuel Logs (Actual)', amount: data.expenses?.fuelActual },
    { category: 'Maintenance', amount: data.expenses?.maintenance },
  ].filter(e => e.amount != null)

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-bold text-white">Reports</h1><p className="text-slate-500 text-sm">{companyName} financial overview</p></div>

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
          <div className="text-sm font-bold text-red-300 mb-1 flex items-center gap-1.5"><AlertTriangle size={14} /> Accounts Receivable</div>
          <div className="text-xs text-slate-400">{data.unpaid.n} loads delivered but not yet paid — <strong className="text-red-400">${data.unpaid.amount?.toFixed(2)}</strong> outstanding</div>
        </div>
      )}

      <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 size={15} className="text-amber-400" />
          <h2 className="text-sm font-semibold text-white">Source Profitability</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-[#1f2937]">
                <th className="text-left py-2 pr-3">Source</th>
                <th className="text-left py-2 pr-3">Loads</th>
                <th className="text-left py-2 pr-3">Revenue</th>
                <th className="text-left py-2">Avg Rate/Mile</th>
              </tr>
            </thead>
            <tbody>
              {bySource.length > 0 ? bySource.map(s => (
                <tr key={s.source} className="border-b border-[#1f2937]/60">
                  <td className="py-2 text-white capitalize">{s.source || 'other'}</td>
                  <td className="py-2 text-slate-300">{s.loads || 0}</td>
                  <td className="py-2 text-amber-400">{currency(s.gross)}</td>
                  <td className="py-2 text-slate-300">{s.loads ? `$${(Number(s.gross || 0) / Math.max(Number(s.loads || 1), 1)).toFixed(2)}` : '$0.00'}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="py-3 text-slate-500">No source data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign size={15} className="text-amber-400" />
          <h2 className="text-sm font-semibold text-white">Expense Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-[#1f2937]">
                <th className="text-left py-2 pr-3">Category</th>
                <th className="text-left py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length > 0 ? expenses.map(e => (
                <tr key={e.category} className="border-b border-[#1f2937]/60">
                  <td className="py-2 text-white">{e.category}</td>
                  <td className="py-2 text-red-300">{currency(e.amount)}</td>
                </tr>
              )) : (
                <tr><td colSpan={2} className="py-3 text-slate-500">No expense data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-4">
        <div className="flex items-center gap-2 mb-3">
          <User size={15} className="text-amber-400" />
          <h2 className="text-sm font-semibold text-white">Driver Earnings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-[#1f2937]">
                <th className="text-left py-2 pr-3">Driver Name</th>
                <th className="text-left py-2 pr-3">Loads</th>
                <th className="text-left py-2 pr-3">Miles</th>
                <th className="text-left py-2">Gross Pay</th>
              </tr>
            </thead>
            <tbody>
              {byDriver.length > 0 ? byDriver.map(d => (
                <tr key={d.id || d.name} className="border-b border-[#1f2937]/60">
                  <td className="py-2 text-white">{d.name}</td>
                  <td className="py-2 text-slate-300">{d.loads || 0}</td>
                  <td className="py-2 text-slate-300">{d.miles || 0}</td>
                  <td className="py-2 text-emerald-400">{currency(d.earned)}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="py-3 text-slate-500">No driver earnings available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
          {byTruck.map(t => (
            <div key={t.name} className="flex items-center gap-4 p-3 bg-[#0a0f1e] rounded-lg">
              <Truck size={20} className="text-amber-400" />
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
