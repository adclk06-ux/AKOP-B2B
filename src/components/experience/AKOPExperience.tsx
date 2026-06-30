import {
  BarChart3,
  Bell,
  Bot,
  BrainCircuit,
  Building2,
  Check,
  Clock3,
  FileCheck2,
  Fingerprint,
  Gauge,
  Layers3,
  LockKeyhole,
  Network,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Users2,
  Workflow,
} from 'lucide-react'
import './akopExperience.css'

const painPoints = [
  'Regülasyonlar farklı yerlerde',
  "Görevler Excel'de",
  'Mutabakatlar manuel',
  'Onay süreçleri e-posta üzerinde',
  'Denetim kayıtları dağınık',
  'Yönetim kurulu raporları son dakika hazırlanıyor',
]

const sourceSystems = ['SPK', 'BDDK', 'MASAK', 'MKK', 'Takasbank']

const modules = [
  ['RegTech Command Center', 'Düzenlemeleri takip edin, analiz edin ve aksiyona dönüştürün.', Layers3],
  ['MKK Mutabakat Merkezi', 'Pozisyon ve nakit mutabakatlarını yönetin, farkları hızla kapatın.', FileCheck2],
  ['Takasbank İzleme', 'Teminat, limit ve settlement risklerini anlık izleyin.', Bell],
  ['Approval Center', 'Çok seviyeli onay süreçlerini tanımlayın ve yönetin.', Workflow],
  ['Case Management', 'Uyum vakalarını uçtan uca takip edin.', ShieldCheck],
  ['Security Center', 'Yetki, MFA ve güvenlik yönetişimini kontrol edin.', LockKeyhole],
  ['Executive Mode', 'Yöneticiler için anlık görünürlük ve stratejik raporlama.', BarChart3],
  ['AKOP Copilot', 'Doğal dil ile sorular sorun, akıllı yanıtlar alın.', Bot],
] as const

const securityItems = [
  ['Role Based Access Control', Users2],
  ['Multi-Level Approval', Check],
  ['MFA', Fingerprint],
  ['Audit Trail', FileCheck2],
  ['Session Management', Clock3],
  ['API Governance', Network],
] as const

const stats = [
  ['1.500+', 'İzlenen Düzenleme'],
  ['100+', 'Yönetilen Görev'],
  ['30+', 'Aktif Workflow'],
  ['10+', 'Operasyon Modülü'],
  ['7/24', 'Uyum Görünürlüğü'],
]

function MiniDashboard() {
  return (
    <div className="akop-dashboard">
      <div className="akop-dashboard-top">
        <strong>AKOP</strong>
        <span>23 Mayıs 2025, Cuma 10:30</span>
        <span className="akop-user">Yönetici</span>
      </div>
      <div className="akop-dashboard-body">
        <aside className="akop-rail">
          {[Gauge, FileCheck2, Workflow, RadioTower, ShieldCheck].map((Icon, index) => (
            <span key={index}>
              <Icon size={15} />
            </span>
          ))}
        </aside>
        <section className="akop-command">
          <div className="akop-command-title">Executive Command Center</div>
          <div className="akop-kpi-grid">
            {[
              ['1.558', 'Düzenleme', '+12%'],
              ['127', 'Açık Görev', '+8%'],
              ['32', 'Açık Vaka', '+5%'],
              ['94%', 'Uyum Skoru', '+3%'],
            ].map(([value, label, trend]) => (
              <div className="akop-kpi" key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
                <small>{trend}</small>
              </div>
            ))}
          </div>
          <div className="akop-insight-grid">
            <div className="akop-chart-card">
              <span>Uyum Skoru Trendi</span>
              <div className="akop-line-chart">
                {[34, 45, 41, 56, 49, 65, 72].map((height, index) => (
                  <i key={index} style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
            <div className="akop-chart-card">
              <span>Görev Dağılımı</span>
              <div className="akop-donut" />
            </div>
            <div className="akop-chart-card akop-alerts">
              <span>Kritik Uyarılar</span>
              <p>2 adet SLA aşımı</p>
              <p>5 adet kritik görev</p>
              <p>MKK mutabakat farkı</p>
              <p>Takasbank limit uyarısı</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function PlatformMap() {
  return (
    <div className="akop-platform-map">
      <h2>AKOP Hepsini Birleştirir</h2>
      <div className="akop-source-row">
        {sourceSystems.map((item) => (
          <div key={item} className="akop-node">
            <Building2 size={16} />
            <span>{item}</span>
          </div>
        ))}
      </div>
      <div className="akop-core">
        <strong>AKOP</strong>
        <span>Compliance Operating System</span>
      </div>
      <div className="akop-output-row">
        {['Görevler', 'Vakalar', 'Onaylar', 'Audit', 'Raporlama'].map((item) => (
          <div key={item} className="akop-node akop-node-soft">
            {item}
          </div>
        ))}
      </div>
      <div className="akop-role-row">
        {['Yönetim Kurulu', 'İç Denetim', 'Uyum', 'Operasyon'].map((item) => (
          <div key={item} className="akop-role">
            <Users2 size={15} />
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

function ExecutivePanel() {
  return (
    <section className="akop-executive">
      <div className="akop-executive-copy">
        <h2>AKOP Executive Command Center</h2>
        <p>Yönetim Kurulu ve üst yönetim için tek bakışta operasyonel görünürlük.</p>
        {['Gerçek zamanlı KPIlar', 'Kritik risk görünürlüğü', 'Uyum skor takibi', 'Stratejik karar destek ekranları'].map((item) => (
          <span key={item}>
            <Check size={15} />
            {item}
          </span>
        ))}
        <a href="#demo">Executive Mode'u İncele</a>
      </div>
      <div className="akop-wide-dashboard">
        <div className="akop-wide-kpis">
          {['94% Uyum Skoru', '5 Kritik Risk', '127 Açık Görev', '32 Açık Vaka', '7 Workflow Bekliyor'].map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>
        <div className="akop-wide-grid">
          <div className="akop-line-panel" />
          <div className="akop-donut akop-donut-green" />
          <div className="akop-bars">
            {[68, 44, 78, 28].map((height, index) => (
              <i key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="akop-donut akop-donut-red" />
        </div>
      </div>
    </section>
  )
}

export function AKOPExperience() {
  return (
    <main className="akop-intelligence">
      <header className="akop-nav">
        <a href="#top" className="akop-logo">AKOP</a>
        <nav>
          <a href="#urun">Ürün</a>
          <a href="#moduller">Modüller</a>
          <a href="#cozumler">Çözümler</a>
          <a href="#kaynaklar">Kaynaklar</a>
          <a href="#hakkimizda">Hakkımızda</a>
        </nav>
        <div>
          <a href="/login" className="akop-login">Giriş Yap</a>
          <a href="#demo" className="akop-nav-cta">Demo Talep Et</a>
        </div>
      </header>

      <section id="top" className="akop-hero">
        <div className="akop-hero-copy">
          <p className="akop-kicker">Aracı Kurum Operasyon Platformu</p>
          <h1>AKOP</h1>
          <h2>Regülasyondan Operasyona, <span>Tek Kontrol Merkezi</span></h2>
          <p>
            SPK, BDDK, MKK ve Takasbank süreçlerini tek platformda yönetin. Regülasyon takibi,
            mutabakat yönetimi, onay iş akışları, denetim izi ve yapay zeka destekli uyum
            operasyonlarını tek merkezden yönetin.
          </p>
          <div className="akop-actions">
            <a href="#demo">Demo Talep Et</a>
            <a href="#urun">Platformu İncele</a>
          </div>
          <div className="akop-feature-strip">
            {['Yapay Zeka Destekli', 'Gerçek Zamanlı', 'Güvenli & Denetlenebilir', '7/24 Erişim'].map((item) => (
              <span key={item}>
                <Sparkles size={14} />
                {item}
              </span>
            ))}
          </div>
        </div>
        <MiniDashboard />
      </section>

      <section id="urun" className="akop-problem-section">
        <div className="akop-pain-card">
          <h2>Bugün Ne Yaşıyorsunuz?</h2>
          {painPoints.map((item) => (
            <p key={item}>{item}</p>
          ))}
          <div className="akop-result">
            <strong>Sonuç:</strong>
            <span>Yüksek operasyonel risk</span>
            <span>Yüksek uyum maliyeti</span>
            <span>Düşük görünürlük</span>
          </div>
        </div>
        <PlatformMap />
      </section>

      <section id="moduller" className="akop-modules">
        <h2>Modüller</h2>
        <div className="akop-module-grid">
          {modules.map(([title, text, Icon]) => (
            <article key={title} className="akop-module-card">
              <span>
                <Icon size={24} />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="cozumler" className="akop-copilot-section">
        <div>
          <h2>AKOP Copilot</h2>
          <p>Doğal dil ile operasyon verilerine erişin.</p>
          <div className="akop-chat">
            <div className="akop-chat-question">
              <Bot size={16} />
              Bekleyen onaylar hangileri?
            </div>
            <div className="akop-chat-answer">
              Toplam 7 adet bekleyen onay bulunmaktadır. İçte kritik olanlar:
              <ul>
                <li>MKK Günlük Mutabakat Onayı</li>
                <li>Takasbank Limit Risk Onayı</li>
                <li>SPK Rapor Onayı</li>
              </ul>
            </div>
            <div className="akop-chat-input">Bir şey sorun...</div>
          </div>
        </div>
        <div className="akop-question-list">
          <h3>Copilot'a Sorabileceğiniz Örnek Sorular</h3>
          {[
            'Son 7 gündeki kritik düzenlemeler neler?',
            'Bekleyen onaylar hangileri?',
            'SLA aşan mutabakatlar var mı?',
            'Bu ay olacak yükümlülükler neler?',
            'Kritik Takasbank uyarıları var mı?',
          ].map((item) => (
            <p key={item}>
              <Sparkles size={14} />
              {item}
            </p>
          ))}
        </div>
        <div className="akop-brain">
          <BrainCircuit size={150} />
        </div>
      </section>

      <ExecutivePanel />

      <section id="kaynaklar" className="akop-security">
        <h2>Kurumsal Güvenlik ve Yönetişim</h2>
        <div className="akop-security-grid">
          {securityItems.map(([label, Icon]) => (
            <div key={label}>
              <Icon size={29} />
              <span>{label}</span>
            </div>
          ))}
        </div>
        <p>Tüm işlemler denetlenebilir, izlenebilir ve geriye dönük olarak raporlanabilir.</p>
      </section>

      <section className="akop-stats">
        {stats.map(([value, label]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>

      <section id="demo" className="akop-final-cta">
        <div>
          <h2>Operasyonel Kör Noktaları Ortadan Kaldırın</h2>
          <p>AKOP ile regülasyonları, mutabakatları, onay süreçlerini ve denetim operasyonlarını tek merkezde yönetin.</p>
        </div>
        <a href="mailto:info@akop.io">Demo Talep Et</a>
        <a href="mailto:info@akop.io" className="akop-secondary">İletişime Geç</a>
      </section>

      <footer id="hakkimizda" className="akop-footer">
        <div>
          <strong>AKOP</strong>
          <span>Aracı Kurum Operasyon Platformu</span>
          <small>Compliance Operating System for Capital Markets</small>
        </div>
        <nav>
          <a href="#urun">Ürün</a>
          <a href="#moduller">Modüller</a>
          <a href="#cozumler">Çözümler</a>
        </nav>
        <nav>
          <a href="#kaynaklar">Kaynaklar</a>
          <a href="#hakkimizda">Hakkımızda</a>
          <a href="mailto:info@akop.io">İletişim</a>
        </nav>
        <div>
          <span>info@akop.io</span>
          <span>+90 212 123 45 67</span>
        </div>
      </footer>
    </main>
  )
}
