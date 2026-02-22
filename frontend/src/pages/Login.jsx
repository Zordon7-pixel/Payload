import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function Login() {
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  async function submit(e) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('hc_token', data.token); navigate('/')
    } catch { setError('Invalid email or password') } finally { setLoading(false) }
  }
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🚛</div>
          <h1 className="text-3xl font-bold text-white tracking-wide">PAYLOAD</h1>
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mt-2">Trucking Fleet Management</p>
          <div className="mt-3 space-y-0.5">
            <p className="text-slate-400 text-sm italic">Every mile tracked.</p>
            <p className="text-slate-400 text-sm italic">Every dollar earned.</p>
            <p className="text-amber-400 text-sm italic font-medium">Every load delivered.</p>
          </div>
        </div>
        <form onSubmit={submit} className="bg-[#111827] rounded-2xl p-6 border border-[#1f2937] space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="demo@haul.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-[#0a0f1e] border border-[#1f2937] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="••••••••" />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50">{loading ? 'Signing in...' : 'Sign In'}</button>
          <p className="text-center text-xs text-slate-600">Demo: demo@haul.com / demo1234</p>
        </form>
      </div>
    </div>
  )
}
