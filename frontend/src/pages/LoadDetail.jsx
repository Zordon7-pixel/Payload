import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../lib/api'
import { STATUS_COLORS, STATUS_LABELS } from './Loads'

const STAGES = ['pending','dispatched','loaded','in_transit','delivered','invoiced','paid']

export default function LoadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [load, setLoad] = useState(null)
  const fetch = () => api.get(`/loads/${id}`).then(r => setLoad(r.data))
  useEffect(() => { fetch() }, [id])

  if (!load) return <div className="flex items-center justify-center h-64 text-slate-500">Loading...</div>

  const currentIdx = STAGES.indexOf(load.status)

  async function advance() {
    if (currentIdx < STAGES.length - 1) {
      await api.put(`/loads/${id}/status`, { status: STAGES[currentIdx + 1] })
      fetch()
    }
  }

  const gross = parseFloat(load.gross_revenue || 0)
  const net = parseFloat(load.net_profit || 0)
  const margin = gross > 0 ? Math.round((net / gross) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/loads')} className="text-slate-400 hover:text-white transition-colors"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-xl font-bold text-white">{load.load_number}</h1>
          <p className="text-slate-500 text-sm capitalize">{load.material} · {load.truck?.name} · {load.customer?.name}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <span className="text-xs px-3 py-1.5 rounded-full font-bold uppercase" style={{background: STATUS_COLORS[load.status]+'22', color: STATUS_COLORS[load.status]}}>
            {STATUS_LABELS[load.status]}
          </span>
          {currentIdx < STAGES.length - 1 && (
            <button onClick={advance} className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
              → {STATUS_LABELS[STAGES[currentIdx + 1]]}
            </button>
          )}
          {!load.paid && ['delivered','invoiced'].includes(load.status) && (
            <button onClick={async () => { await api.put(`/loads/${load.id}`, { paid: 1 }); fetch() }}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
              ✓ Mark Paid
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-4">
        <div className="flex gap-1 mb-3">
          {STAGES.map((s, i) => (
            <div key={s} className="flex-1 h-1.5 rounded-full" style={{background: i <= currentIdx ? STATUS_COLORS[s] : '#1f2937'}} />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>Pending</span><span>Paid</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Load Details</h2>
          <div className="space-y-2">
            {[
              ['Material', load.material?.toUpperCase()],
              ['From', load.pickup_location],
              ['To', load.dropoff_location],
              ['Tons', `${load.tons} tons`],
              ['Miles', `${load.miles} mi`],
              ['Source', load.source],
              ['Pickup Date', load.pickup_date],
              ['Delivered', load.delivery_date || '—'],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between text-xs">
                <span className="text-slate-500">{k}</span>
                <span className="text-white font-medium capitalize">{v || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">💰 Financials</h2>
          <div className="space-y-2">
            {[
              ['Rate Type', load.rate_type],
              ['Rate / Ton', load.rate_per_ton ? `$${load.rate_per_ton}` : '—'],
              ['Gross Revenue', `$${gross.toFixed(2)}`],
              ['Fuel Cost', `-$${parseFloat(load.fuel_cost||0).toFixed(2)}`],
              ['Driver Pay', `-$${parseFloat(load.driver_pay||0).toFixed(2)}`],
              ['Other Expenses', `-$${parseFloat(load.other_expenses||0).toFixed(2)}`],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between text-xs">
                <span className="text-slate-500">{k}</span>
                <span className={`font-medium ${v?.startsWith('-') ? 'text-red-400' : 'text-white'}`}>{v}</span>
              </div>
            ))}
            <div className="border-t border-[#1f2937] pt-2 flex justify-between text-sm font-bold">
              <span className="text-emerald-400">Net Profit</span>
              <span className={net >= 0 ? 'text-emerald-400' : 'text-red-400'}>${net.toFixed(2)} ({margin}%)</span>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${load.paid ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
              {load.paid ? '✓ PAID' : '⚠ UNPAID'}
            </span>
            <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${load.invoice_sent ? 'bg-blue-900/40 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
              {load.invoice_sent ? '✓ INVOICED' : 'INVOICE PENDING'}
            </span>
          </div>
        </div>

        <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Truck</h2>
          <div className="space-y-2">
            {[
              ['Name', load.truck?.name],
              ['Year/Make/Model', `${load.truck?.year} ${load.truck?.make} ${load.truck?.model}`],
              ['Plate', load.truck?.plate],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between text-xs">
                <span className="text-slate-500">{k}</span>
                <span className="text-white font-medium">{v || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {load.notes && (
          <div className="bg-[#111827] rounded-xl border border-[#1f2937] p-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Notes</h2>
            <p className="text-sm text-slate-300">{load.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
