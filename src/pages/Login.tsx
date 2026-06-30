import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Diamond } from 'lucide-react'

const DEMO_ACCOUNTS = [
  { email: 'admin@akop.com', role: 'Admin' },
  { email: 'ops@akop.com', role: 'Operasyon' },
  { email: 'onay@akop.com', role: 'Onay' },
  { email: 'denetci@akop.com', role: 'Denetçi' },
]

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (login(email, password)) {
      navigate('/')
    } else {
      setError('Geçersiz e-posta veya şifre')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#F8FAFC] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-[#F8FAFC] to-[#F8FAFC]">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200/70 shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-xl bg-blue-50 w-14 h-14">
            <Diamond className="text-blue-600" size={28} strokeWidth={1.8} />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AKOP</h1>
            <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200/60">
              PROD-V2
            </span>
          </div>
          <p className="text-sm text-slate-500">Aracı Kurum Operasyon Platformu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">E-posta</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@akop.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">Şifre</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md active:scale-[0.98]"
          >
            Giriş Yap
          </button>
        </form>

        <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-[11px] font-medium text-slate-500 mb-2.5 uppercase tracking-wide">Demo hesaplar</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => { setEmail(a.email); setPassword('') }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors"
                title="Tıklayarak otomatik doldur"
              >
                <span className="font-medium">{a.email}</span>
                <span className="rounded bg-slate-100 px-1 py-0.5 text-[9px] text-slate-500 border border-slate-200/60">{a.role}</span>
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-[10px] text-slate-400">Şifre: herhangi bir şifre</p>
        </div>
      </div>
    </div>
  )
}
