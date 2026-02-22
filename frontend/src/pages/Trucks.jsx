import { useEffect, useState } from 'react'
import { Truck } from 'lucide-react'
import api from '../lib/api'

export default function Trucks() {
  const [trucks, setTrucks] = useState([])
  useEffect(() => { api.get('/trucks').then(r => setTrucks(r.data.trucks)) }, [])
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Fleet</h1>
        <p className="text-slate-500 text-sm">{trucks.length} trucks</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {trucks.map(t => (
          <div key={t.id} className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-900/30 rounded-xl flex items-center justify-center text-2xl">🚛</div>
              <div>
                <div className="font-bold text-white">{t.name}</div>
                <div className="text-xs text-slate-400">{t.year} {t.make} {t.model}</div>
              </div>
              <span className={`ml-auto text-[10px] font-bold px-2 py-1 rounded-full uppercase ${t.status === 'active' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>{t.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#0a0f1e] rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-amber-400">{t.total_loads}</div>
                <div className="text-[9px] text-slate-500">LOADS</div>
              </div>
              <div className="bg-[#0a0f1e] rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-emerald-400">${parseFloat(t.total_revenue||0).toFixed(0)}</div>
                <div className="text-[9px] text-slate-500">REVENUE</div>
              </div>
              <div className="bg-[#0a0f1e] rounded-lg p-3 text-center">
                <div className="text-sm font-bold text-slate-300">{t.plate}</div>
                <div className="text-[9px] text-slate-500">PLATE</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
