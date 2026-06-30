import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Database,
  Mail,
  Moon,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { deleteAlertEmail, fetchAlertEmails, saveAlertEmail, type AlertEmailsResponse } from '@/services/notifications'
import { useAuthStore } from '@/store/authStore'
import { useThemePreference } from '@/hooks/useThemePreference'
import type { ThemePreference } from '@/services/preferences'

const integrationRows = [
  { name: 'SPK', type: 'Canlı arşiv + sayfa takip', status: 'Aktif' },
  { name: 'BDDK', type: 'Cache + resmi kaynak takip', status: 'Aktif' },
  { name: 'MASAK', type: 'Resmi sayfa izleme', status: 'İzleniyor' },
  { name: 'MKK', type: 'Resmi kaynak izleme', status: 'İzleniyor' },
  { name: 'Takasbank', type: 'Resmi kaynak izleme', status: 'İzleniyor' },
  { name: 'SEC / FINRA / FCA / ESMA', type: 'RSS / resmi haber kaynakları', status: 'Registry hazır' },
]

const themeOptions: Array<{ value: ThemePreference; label: string; icon: typeof Sun; description: string }> = [
  { value: 'light', label: 'Açık', icon: Sun, description: 'Gündüz operasyon ekranları için temiz finans teması.' },
  { value: 'dark', label: 'Koyu', icon: Moon, description: 'Gece vardiyası ve NOC ekranları için düşük parlama.' },
  { value: 'system', label: 'Sistem', icon: SettingsIcon, description: 'Cihaz tercihine göre otomatik geçiş.' },
]

export default function Settings() {
  const user = useAuthStore((state) => state.user)
  const { theme, setTheme } = useThemePreference()
  const [email, setEmail] = useState(user?.email || '')
  const [settings, setSettings] = useState<AlertEmailsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const totalRecipients = useMemo(() => settings?.emails.length ?? 0, [settings])

  async function load() {
    setLoading(true)
    setError('')
    try {
      setSettings(await fetchAlertEmails())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mail ayarları alınamadı.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const next = await saveAlertEmail(email)
      setSettings(next)
      setMessage('Mail adresi kaydedildi. Yeni kurum bildirileri bu alıcıya gönderilecek.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mail adresi kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(target: string) {
    setMessage('')
    setError('')
    try {
      setSettings(await deleteAlertEmail(target))
      setMessage('Mail adresi kaldırıldı.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mail adresi silinemedi.')
    }
  }

  return (
    <div className="akop-page min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge className="border-slate-300 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Enterprise Settings
            </Badge>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">Ayarlar</h2>
              <p className="text-sm text-slate-500">
                Kurum profili, bildirim alıcıları, görünüm ve entegrasyon operasyonlarını tek merkezden yönetin.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:bg-slate-900">
            <ShieldCheck size={15} />
            Kurumsal yönetim modu
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <div className="space-y-4">
            <Card className="akop-surface overflow-hidden rounded-2xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Kurum Profili</CardTitle>
                    <p className="text-xs text-slate-500">Bu bilgiler kurumsal tenant ve raporlama katmanı için baz alınır.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500">Kurum Adı</span>
                  <Input defaultValue="AKOP Demo Kurumu" className="rounded-lg" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500">Ana Domain</span>
                  <Input defaultValue="akop.io" className="rounded-lg" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500">Uyum Birimi Maili</span>
                  <Input defaultValue={user?.email || 'uyum@akop.io'} className="rounded-lg" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500">Saat Dilimi</span>
                  <Input defaultValue="Europe/Istanbul" className="rounded-lg" />
                </label>
              </CardContent>
            </Card>

            <Card className="akop-surface overflow-hidden rounded-2xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-950 text-white dark:bg-blue-200 dark:text-blue-950">
                    <Mail size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Bildirim Mailleri</CardTitle>
                    <p className="text-xs text-slate-500">Kurum bildirisi yakalandığında kayıtlı alıcılara e-posta gönderilir.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="uyum@kurum.com"
                    className="rounded-lg"
                  />
                  <Button onClick={handleSave} disabled={saving || !email} className="rounded-lg bg-slate-950 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950">
                    {saving ? 'Kaydediliyor...' : 'Alıcı Ekle'}
                  </Button>
                </div>

                {message && (
                  <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                    <CheckCircle2 size={15} className="mt-0.5" />
                    {message}
                  </div>
                )}
                {error && (
                  <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
                    <AlertTriangle size={15} className="mt-0.5" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kayıtlı alıcılar</p>
                  {loading ? (
                    <p className="text-sm text-slate-500">Yükleniyor...</p>
                  ) : settings?.userEmails.length ? (
                    settings.userEmails.map((item) => (
                      <div key={item} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:bg-slate-900/50">
                        <span className="text-sm font-medium text-slate-800">{item}</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2 py-1 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50 dark:bg-slate-950"
                        >
                          <Trash2 size={13} />
                          Sil
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
                      Henüz kurum mail alıcısı eklenmedi.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="akop-surface overflow-hidden rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Görünüm</CardTitle>
                <p className="text-xs text-slate-500">Yeni kurumsal renk sistemi açık ve koyu modda birlikte çalışır.</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {themeOptions.map((option) => {
                  const Icon = option.icon
                  const active = theme === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                        active
                          ? 'border-slate-950 bg-slate-950 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950'
                          : 'border-slate-200 bg-white hover:border-slate-300 dark:bg-slate-900/60'
                      }`}
                    >
                      <Icon size={18} className="mt-0.5" />
                      <span>
                        <span className="block text-sm font-semibold">{option.label}</span>
                        <span className={`mt-0.5 block text-xs ${active ? 'opacity-75' : 'text-slate-500'}`}>{option.description}</span>
                      </span>
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="akop-surface overflow-hidden rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Altyapı Durumu</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:bg-slate-900/50">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Kalıcı Kayıt</p>
                    <Badge className={settings?.durableEnabled ? 'mt-2 border-emerald-200 bg-emerald-50 text-emerald-700' : 'mt-2 border-amber-200 bg-amber-50 text-amber-700'}>
                      {settings?.durableEnabled ? 'Aktif' : 'Redis gerekli'}
                    </Badge>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:bg-slate-900/50">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Toplam Alıcı</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">{totalRecipients}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200">
                  {integrationRows.map((row, index) => (
                    <div key={row.name} className={`grid grid-cols-[92px_1fr_auto] gap-3 p-3 text-xs ${index ? 'border-t border-slate-200' : ''}`}>
                      <span className="font-bold text-slate-900">{row.name}</span>
                      <span className="text-slate-500">{row.type}</span>
                      <span className="font-semibold text-slate-700">{row.status}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                  <Database size={15} className="mt-0.5 text-blue-800 dark:text-blue-200" />
                  <p className="text-xs text-blue-900 dark:text-blue-100">
                    Üretimde 1 dakika hedefi için Vercel/Render cron, Upstash Redis ve Resend env anahtarlarının aktif olması gerekir.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

