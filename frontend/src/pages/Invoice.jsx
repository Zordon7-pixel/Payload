import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Printer, ArrowLeft, CheckCircle, Truck } from 'lucide-react'
import api from '../lib/api'

const RATE_LABELS = { per_mile:'Per Mile', flat_rate:'Flat Rate', per_ton:'Per Ton' }

export default function Invoice() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/loads/${id}/invoice`)
      .then(r => setData(r.data))
      .catch(() => setError('Could not load invoice.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-slate-400">Generating invoice...</div>
  )
  if (error) return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-red-400">{error}</div>
  )

  const { load, company } = data
  const gross = parseFloat(load.gross_revenue || 0)
  const today = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
  const dueDate = new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })

  const rateDetail = () => {
    if (load.rate_type === 'per_mile') return `${load.miles} mi × $${load.rate_per_mile}/mi`
    if (load.rate_type === 'per_ton')  return `${load.tons} tons × $${load.rate_per_ton}/ton`
    return 'Flat Rate'
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:py-0 print:px-0">
      {/* Toolbar — hidden on print */}
      <div className="max-w-3xl mx-auto mb-4 flex items-center gap-3 print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm">
          <ArrowLeft size={16}/> Back
        </button>
        <div className="flex-1"/>
        <div className="flex items-center gap-2 text-sm text-emerald-700 font-medium">
          <CheckCircle size={15}/> Invoice saved to load — marked as sent
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-2.5 rounded-lg text-sm transition-colors">
          <Printer size={16}/> Print / Save PDF
        </button>
      </div>

      {/* Invoice Document */}
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl print:shadow-none print:rounded-none overflow-hidden">

        {/* Header */}
        <div className="bg-[#0a0f1e] px-8 py-7 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Truck size={28} className="text-amber-400" />
              <div>
                <div className="text-2xl font-black text-white tracking-tight">PAYLOAD</div>
                <div className="text-xs text-amber-400 font-semibold tracking-widest uppercase">Fleet Management</div>
              </div>
            </div>
            {company && (
              <div className="mt-3 text-slate-400 text-sm space-y-0.5">
                <div className="font-semibold text-white">{company.name}</div>
                {company.address && <div>{company.address}</div>}
                {company.phone && <div>{company.phone}</div>}
                {company.dot_number && <div>DOT: {company.dot_number}</div>}
                {company.mc_number && <div>MC: {company.mc_number}</div>}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-white">INVOICE</div>
            <div className="text-amber-400 font-bold text-lg mt-1">#{load.load_number}</div>
            <div className="mt-3 text-slate-400 text-sm space-y-1">
              <div><span className="text-slate-500">Date:</span> <span className="text-white">{today}</span></div>
              <div><span className="text-slate-500">Due:</span> <span className="text-white">{dueDate}</span></div>
              <div className="mt-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${load.paid ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-black'}`}>
                  {load.paid ? 'PAID' : 'PAYMENT DUE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">

          {/* Bill To */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bill To</div>
              {load.customer ? (
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 text-sm">{load.customer.name}</div>
                  {load.customer.contact_name && <div className="text-slate-600 text-sm">Attn: {load.customer.contact_name}</div>}
                  {load.customer.address && <div className="text-slate-600 text-sm">{load.customer.address}</div>}
                  {load.customer.phone && <div className="text-slate-600 text-sm">{load.customer.phone}</div>}
                  {load.customer.email && <div className="text-slate-600 text-sm">{load.customer.email}</div>}
                </div>
              ) : (
                <div className="text-slate-400 text-sm italic">No customer on file</div>
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Load Info</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Load #</span>
                  <span className="font-semibold text-slate-900">{load.load_number}</span>
                </div>
                {load.truck && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Truck</span>
                    <span className="text-slate-900">{load.truck.name} · {load.truck.plate}</span>
                  </div>
                )}
                {load.driver && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Driver</span>
                    <span className="text-slate-900">{load.driver.name}</span>
                  </div>
                )}
                {load.source && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Source</span>
                    <span className="text-slate-900 capitalize">{load.source}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-slate-200"/>

          {/* Service Line Items */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Services</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-slate-500 font-semibold py-2 text-xs uppercase">Description</th>
                  <th className="text-left text-slate-500 font-semibold py-2 text-xs uppercase">Route</th>
                  <th className="text-left text-slate-500 font-semibold py-2 text-xs uppercase">Dates</th>
                  <th className="text-right text-slate-500 font-semibold py-2 text-xs uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-3 pr-4">
                    <div className="font-semibold text-slate-900 capitalize">{load.material || 'Freight Transportation'}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{RATE_LABELS[load.rate_type]} · {rateDetail()}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="text-slate-900">{load.pickup_location || '—'}</div>
                    <div className="text-slate-500 text-xs">to {load.dropoff_location || '—'}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="text-slate-900">{load.pickup_date || '—'}</div>
                    {load.delivery_date && <div className="text-slate-500 text-xs">Del: {load.delivery_date}</div>}
                  </td>
                  <td className="py-3 text-right font-bold text-slate-900">${gross.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-900">${gross.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax</span>
                <span className="text-slate-900">$0.00</span>
              </div>
              <div className="border-t border-slate-300 pt-2 flex justify-between font-black text-lg">
                <span className="text-slate-900">Total Due</span>
                <span className={load.paid ? 'text-emerald-600' : 'text-[#0a0f1e]'}>${gross.toFixed(2)}</span>
              </div>
              {load.paid && (
                <div className="flex justify-between text-sm font-bold text-emerald-600">
                  <span>Payment Received</span>
                  <span>-${gross.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {load.notes && (
            <>
              <hr className="border-slate-200"/>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Notes</div>
                <p className="text-slate-600 text-sm">{load.notes}</p>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="border-t border-slate-200 pt-4 text-center">
            <p className="text-slate-400 text-xs">Payment due within 30 days of invoice date. Thank you for your business.</p>
            {company?.phone && <p className="text-slate-400 text-xs mt-1">{company.name} · {company.phone}</p>}
            <p className="text-slate-300 text-[10px] mt-2">Generated by PAYLOAD Fleet Management</p>
          </div>

        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white; margin: 0; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}
