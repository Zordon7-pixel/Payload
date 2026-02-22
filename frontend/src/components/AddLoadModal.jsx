import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import api from '../lib/api'

const MATERIALS = ['asphalt','salt','sand','gravel','dirt','mulch','topsoil','concrete']
const SOURCES = ['direct','aggtrans','aggdirect','other']

export default function AddLoadModal({ onClose, onSaved }) {
  const [trucks, setTrucks] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    truck_id: '', customer_id: '', new_customer: false,
    customer_name: '', customer_phone: '',
    source: 'aggtrans', source_ref: '',
    material: 'asphalt', pickup_location: '', dropoff_location: '',
    pickup_date: '', tons: '', miles: '', rate_per_ton: '',
    rate_type: 'per_ton', fuel_cost: '', driver_pay: '', notes: ''
  })

  useEffect(() => {
    api.get('/trucks').then(r => setTrucks(r.data.trucks))
    api.get('/customers').then(r => setCustomers(r.data.customers))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const inp = 'w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500'
  const lbl = 'block text-xs font-medium text-slate-400 mb-1'

  async function submit() {
    setLoading(true)
    try {
      let customer_id = form.customer_id
      if (form.new_customer) {
        const { data } = await api.post('/customers', { name: form.customer_name, phone: form.customer_phone, source: form.source })
        customer_id = data.id
      }
      const tons = +form.tons || 0
      const rate_per_ton = +form.rate_per_ton || 0
      const miles = +form.miles || 0
      const fuel_cost = +form.fuel_cost || miles * 0.45
      await api.post('/loads', {
        truck_id: form.truck_id, customer_id, source: form.source, source_ref: form.source_ref,
        material: form.material, pickup_location: form.pickup_location, dropoff_location: form.dropoff_location,
        pickup_date: form.pickup_date, tons, miles, rate_per_ton, rate_type: 'per_ton',
        fuel_cost, driver_pay: +form.driver_pay || 0, notes: form.notes
      })
      onSaved()
    } catch { alert('Error creating load') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111827] rounded-2xl border border-[#1f2937] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#1f2937]">
          <h2 className="font-bold text-white">New Load</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Truck</label>
              <select className={inp} value={form.truck_id} onChange={e => set('truck_id', e.target.value)}>
                <option value="">— select —</option>
                {trucks.map(t => <option key={t.id} value={t.id}>{t.name} ({t.plate})</option>)}
              </select></div>
            <div><label className={lbl}>Source</label>
              <select className={inp} value={form.source} onChange={e => set('source', e.target.value)}>
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select></div>
          </div>
          <div><label className={lbl}>Source Ref # (Load Board ID)</label>
            <input className={inp} value={form.source_ref} onChange={e => set('source_ref', e.target.value)} placeholder="Load ID from platform" /></div>
          <div><label className={lbl}>Customer</label>
            <div className="flex gap-2 mb-2">
              <button onClick={() => set('new_customer', false)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${!form.new_customer ? 'bg-amber-500 text-black' : 'bg-[#0a0f1e] text-slate-400 border border-[#1f2937]'}`}>Existing</button>
              <button onClick={() => set('new_customer', true)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.new_customer ? 'bg-amber-500 text-black' : 'bg-[#0a0f1e] text-slate-400 border border-[#1f2937]'}`}>New</button>
            </div>
            {!form.new_customer
              ? <select className={inp} value={form.customer_id} onChange={e => set('customer_id', e.target.value)}>
                  <option value="">— select —</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              : <div className="grid grid-cols-2 gap-2">
                  <input className={inp} placeholder="Company name" value={form.customer_name} onChange={e => set('customer_name', e.target.value)} />
                  <input className={inp} placeholder="Phone" value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} />
                </div>
            }
          </div>
          <div><label className={lbl}>Material</label>
            <select className={inp} value={form.material} onChange={e => set('material', e.target.value)}>
              {MATERIALS.map(m => <option key={m}>{m}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Pickup Location</label><input className={inp} value={form.pickup_location} onChange={e => set('pickup_location', e.target.value)} placeholder="City, State" /></div>
            <div><label className={lbl}>Drop-off Location</label><input className={inp} value={form.dropoff_location} onChange={e => set('dropoff_location', e.target.value)} placeholder="City, State" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lbl}>Tons</label><input className={inp} type="number" value={form.tons} onChange={e => set('tons', e.target.value)} placeholder="22" /></div>
            <div><label className={lbl}>Miles</label><input className={inp} type="number" value={form.miles} onChange={e => set('miles', e.target.value)} placeholder="45" /></div>
            <div><label className={lbl}>Rate/Ton ($)</label><input className={inp} type="number" value={form.rate_per_ton} onChange={e => set('rate_per_ton', e.target.value)} placeholder="12" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Fuel Cost ($)</label><input className={inp} type="number" value={form.fuel_cost} onChange={e => set('fuel_cost', e.target.value)} placeholder="auto-calc" /></div>
            <div><label className={lbl}>Driver Pay ($)</label><input className={inp} type="number" value={form.driver_pay} onChange={e => set('driver_pay', e.target.value)} placeholder="0" /></div>
          </div>
          <div><label className={lbl}>Pickup Date</label><input className={inp} type="date" value={form.pickup_date} onChange={e => set('pickup_date', e.target.value)} /></div>
          <div><label className={lbl}>Notes</label><textarea className={inp} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any special instructions..." /></div>
          {form.tons && form.rate_per_ton && (
            <div className="bg-[#0a0f1e] rounded-lg p-3 text-xs">
              <span className="text-slate-400">Estimated gross: </span>
              <span className="text-amber-400 font-bold">${(+form.tons * +form.rate_per_ton).toFixed(2)}</span>
              {form.miles && <><span className="text-slate-400 ml-3">Auto fuel est: </span><span className="text-red-400">-${(+form.miles * 0.45).toFixed(2)}</span></>}
            </div>
          )}
        </div>
        <div className="flex justify-between p-5 border-t border-[#1f2937]">
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading} className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-5 py-2 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Creating...' : '🚛 Create Load'}</button>
        </div>
      </div>
    </div>
  )
}
