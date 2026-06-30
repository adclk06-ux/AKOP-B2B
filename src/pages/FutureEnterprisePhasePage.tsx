import { useMemo, useState } from 'react'
import { ArrowRight, Database, Layers3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AIInfoBox,
  EnterpriseBoard,
  IntegrationCard,
  StatusCard,
  TimelineList,
  UniversalSearchBar,
} from '@/components/enterprise/EnterprisePrimitives'
import { futurePhaseToolsets, getFutureEnterpriseModule, type FuturePhaseKey } from '@/services/futureEnterprisePhases'

const categories = [
  { value: 'all', label: 'Tüm Kayıtlar' },
  { value: 'Kritik', label: 'Kritik' },
  { value: 'Yüksek', label: 'Yüksek' },
  { value: 'Orta', label: 'Orta' },
]

function riskTone(risk: string) {
  if (risk === 'Kritik') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (risk === 'Yüksek') return 'border-orange-200 bg-orange-50 text-orange-700'
  if (risk === 'Orta') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

export default function FutureEnterprisePhasePage({ phaseKey }: { phaseKey: FuturePhaseKey }) {
  const module = getFutureEnterpriseModule(phaseKey)
  const toolset = futurePhaseToolsets[phaseKey] || []
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const filteredRecords = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('tr-TR')
    return module.kayıtlar.filter((record) => {
      const matchesCategory = category === 'all' || record.risk === category
      const matchesSearch = !normalized || [
        record.id,
        record.title,
        record.owner,
        record.status,
        record.dataObject,
        record.nextAction,
      ].some((item) => item.toLocaleLowerCase('tr-TR').includes(normalized))
      return matchesCategory && matchesSearch
    })
  }, [category, module.kayıtlar, search])

  return (
    <div className="akop-page min-h-screen">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="akop-board p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge className="border-slate-900 bg-slate-900 text-white">{module.phase}</Badge>
                <Badge className="border-blue-200 bg-blue-50 text-blue-700">{module.badge}</Badge>
              </div>
              <div className="min-w-0">
                <h2 className="akop-wrap text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-100">{module.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{module.subtitle}</p>
              </div>
            </div>
            <div className="akop-status-card xl:w-[420px]">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Layers3 size={15} />
                Mimari Desen
              </div>
              <p className="akop-wrap text-sm font-semibold text-slate-900 dark:text-slate-100">{module.pattern}</p>
            </div>
          </div>
        </section>

        <section className="akop-grid-4">
          {module.metrics.map((metric) => (
            <StatusCard key={metric.label} {...metric} />
          ))}
        </section>

        <UniversalSearchBar
          value={search}
          onChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          categories={categories}
          placeholder={`${module.title} içinde veri nesnesi, sahip veya aksiyon ara...`}
        />

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <EnterpriseBoard
            title="Veri ve Aksiyon Matrisi"
            description="Ekranın merkezi ham veri; görsel katman sadece karar vermeyi hızlandırır."
            badge={`${filteredRecords.length} kayıt`}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kayıt</TableHead>
                  <TableHead>Sahip</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Veri Nesnesi</TableHead>
                  <TableHead>Sıradaki Aksiyon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{record.id}</p>
                      <p className="mt-1 text-xs text-slate-500">{record.title}</p>
                    </TableCell>
                    <TableCell className="text-xs">{record.owner}</TableCell>
                    <TableCell>
                      <Badge className="border-slate-200 bg-slate-50 text-[10px] text-slate-700">{record.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${riskTone(record.risk)}`}>{record.risk}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">{record.dataObject}</TableCell>
                    <TableCell className="text-xs text-slate-600">{record.nextAction}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </EnterpriseBoard>

          <div className="akop-stack">
            <EnterpriseBoard title="Zaman Çizelgesi" description="Kademeli etlendirme ve canlıya alma sırası.">
              <TimelineList items={module.timeline} />
            </EnterpriseBoard>
            <AIInfoBox title="AI / Ajan Kontrol Notları">
              <ul className="space-y-2">
                {module.aiNotes.map((note) => (
                  <li key={note} className="flex gap-2">
                    <ArrowRight size={13} className="mt-0.5 shrink-0" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </AIInfoBox>
          </div>
        </section>

        <EnterpriseBoard
          title="Araç Katmanı"
          description="Faz ilerledikçe gerçek entegrasyon, kimlik bilgisi, kuyruk ve veritabanı bağlantıları bu kartların arkasına takılır."
          actions={<Badge className="border-slate-200 bg-slate-50 text-slate-700"><Database size={13} className="mr-1" />Veri öncelikli</Badge>}
        >
          <div className="akop-grid-2">
            {module.capabilities.map((capability) => (
              <IntegrationCard key={capability.name} {...capability} />
            ))}
          </div>
        </EnterpriseBoard>

        <EnterpriseBoard
          title="Maksimum Araç Seti"
          description="Bu fazın canlı üründe ihtiyaç duyacağı niş araçlar; görünürlük, denetim, kanıt ve otomasyon için ayrıldı."
          badge={`${toolset.length} araç`}
        >
          <div className="akop-grid-3">
            {toolset.map((tool) => (
              <IntegrationCard key={tool.name} {...tool} />
            ))}
          </div>
        </EnterpriseBoard>
      </div>
    </div>
  )
}
