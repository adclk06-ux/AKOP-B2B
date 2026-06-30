import { Activity, Bell, CheckCircle2, DatabaseZap, Globe2, KeyRound, RefreshCw, ServerCog, ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  getEventSeverityClass,
  getIntegrationStatusClass,
  integrationEvents,
  realIntegrationSources,
} from '@/services/realIntegrations'

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function statusLabel(status: string) {
  switch (status) {
    case 'live': return 'Live'
    case 'watch-ready': return 'Watch Ready'
    case 'credential-required': return 'Credential'
    case 'adapter-required': return 'Adapter'
    default: return status
  }
}

export default function RealIntegrationLayer() {
  const liveCount = realIntegrationSources.filter((source) => source.status === 'live' || source.status === 'watch-ready').length
  const credentialCount = realIntegrationSources.filter((source) => source.status === 'credential-required').length
  const globalCount = realIntegrationSources.filter((source) => source.region === 'Global').length
  const avgHealth = Math.round(realIntegrationSources.reduce((sum, source) => sum + source.health, 0) / realIntegrationSources.length)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="akop-board rounded-2xl border bg-white/90 p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge className="border-slate-900 bg-slate-900 text-white">FAZ 40</Badge>
                <Badge className="border-blue-200/70 bg-blue-50 text-blue-700">Production Integration Layer</Badge>
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Real Integration Layer</h2>
                <p className="text-sm text-slate-500">
                  SPK, BDDK, MASAK, MKK, Takasbank, KVKK, Resmi Gazete ve global regülatörler için 1 dakikalık watcher, retry ve bildirim omurgası.
                </p>
              </div>
            </div>
            <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:w-[520px]">
              <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Cron Cadence</p>
                <p className="mt-1 text-lg font-bold text-slate-900">60 sn</p>
              </div>
              <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Persistence</p>
                <p className="mt-1 text-lg font-bold text-slate-900">DB-ready</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Canlı / Watch Ready', value: liveCount, helper: `${realIntegrationSources.length} kaynak içinde`, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700' },
            { label: 'Credential Bekleyen', value: credentialCount, helper: 'MKK / Takasbank gibi kapalı kaynaklar', icon: KeyRound, tone: 'bg-amber-50 text-amber-700' },
            { label: 'Global Kaynak', value: globalCount, helper: 'SEC, FCA, ESMA, IOSCO', icon: Globe2, tone: 'bg-blue-50 text-blue-700' },
            { label: 'Ortalama Health', value: `%${avgHealth}`, helper: 'Selector/API sağlık skoru', icon: Activity, tone: 'bg-violet-50 text-violet-700' },
          ].map((metric) => (
            <Card key={metric.label} className="rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-slate-500">{metric.label}</CardTitle>
                <div className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${metric.tone}`}>
                  <metric.icon size={16} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{metric.value}</div>
                <p className="mt-1 text-xs text-slate-500">{metric.helper}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
                    <DatabaseZap size={18} />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-semibold">Kaynak Registry</CardTitle>
                    <p className="text-[11px] text-slate-400">API, web watcher ve partner gateway kaynakları</p>
                  </div>
                </div>
                <Badge className="border-slate-200/70 bg-slate-50 text-slate-700">{realIntegrationSources.length} kaynak</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead>Kaynak</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Watch</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead>Son Kontrol</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {realIntegrationSources.map((source) => (
                    <TableRow key={source.id} className="hover:bg-slate-50/70">
                      <TableCell>
                        <p className="text-xs font-semibold text-slate-800">{source.authority} · {source.endpointLabel}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{source.scope}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className="border-slate-200/70 bg-slate-50 text-[10px] text-slate-700">{source.tier}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${getIntegrationStatusClass(source.status)}`}>{statusLabel(source.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-700">{source.watchIntervalSeconds} sn</TableCell>
                      <TableCell>
                        <div className="flex min-w-[92px] items-center gap-2">
                          <div className="h-2 flex-1 rounded-full bg-slate-100">
                            <div className="h-2 rounded-full bg-slate-900" style={{ width: `${source.health}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-700">%{source.health}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{formatTime(source.lastCheckedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <ServerCog size={18} className="text-slate-700" />
                  <CardTitle className="text-sm font-semibold">Production Omurga</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Deduplication', value: 'Kaynak hash + URL + tarih' },
                  { label: 'Retry Policy', value: '3 deneme, exponential backoff' },
                  { label: 'Notification Route', value: 'Mesaj merkezi + mail queue' },
                  { label: 'Health Check', value: 'Selector/API response alarmı' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200/70 bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-800">{item.value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-slate-700" />
                  <CardTitle className="text-sm font-semibold">Son Integration Eventleri</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {integrationEvents.map((event) => (
                  <div key={event.id} className="rounded-xl border border-slate-200/70 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800">{event.authority}</p>
                        <p className="mt-1 text-xs text-slate-500">{event.title}</p>
                      </div>
                      <Badge className={`shrink-0 text-[10px] ${getEventSeverityClass(event.severity)}`}>{event.severity}</Badge>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">{formatTime(event.detectedAt)} · {event.routedTo}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/70 bg-slate-900 p-5 text-white shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <ShieldAlert size={20} className="mt-0.5 text-blue-200" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">Faz 40 Kontrol Notu</p>
                <p className="mt-1 text-xs text-slate-300">
                  Kapalı servisler için credential girildiğinde aynı registry live moda geçecek şekilde ayrıldı; mevcut SPK/BDDK/MASAK ekranlarının veri akışına dokunulmadı.
                </p>
              </div>
            </div>
            <Badge className="border-slate-700 bg-slate-800 text-slate-200">
              <RefreshCw size={13} className="mr-1" />
              1 dk watcher-ready
            </Badge>
          </div>
        </section>
      </div>
    </div>
  )
}
