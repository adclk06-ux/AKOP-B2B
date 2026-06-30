import { useState } from 'react'
import { useAuthStore, roleLabels, roleColors } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { UserRole } from '@/types'

export default function Users() {
  const { users, addUser, updateUser, deleteUser } = useAuthStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'operation' as UserRole, active: true })

  const openNew = () => {
    setEditingId(null)
    setForm({ name: '', email: '', role: 'operation', active: true })
    setDialogOpen(true)
  }

  const openEdit = (user: typeof users[0]) => {
    setEditingId(user.id)
    setForm({ name: user.name, email: user.email, role: user.role, active: user.active })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (editingId) {
      updateUser(editingId, form)
    } else {
      addUser(form)
    }
    setDialogOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Kullanıcı Yönetimi</h2>
            <p className="text-sm text-slate-500">Sistem kullanıcılarını yönetin ve rolleri düzenleyin.</p>
          </div>
          <Button onClick={openNew} className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm hover:shadow-md transition-all">
            <Plus size={16} className="mr-2" />
            Yeni Kullanıcı
          </Button>
        </div>

        <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 hover:bg-transparent bg-slate-50/80">
                  <TableHead className="text-xs font-medium text-slate-500">Ad</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500">E-posta</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500">Rol</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500">Durum</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500 text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                    <TableCell className="text-xs font-medium text-slate-700">{u.name}</TableCell>
                    <TableCell className="text-xs text-slate-700">{u.email}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${roleColors[u.role]}`}>{roleLabels[u.role]}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${u.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-600 border border-slate-200/60'}`}>
                        {u.active ? 'Aktif' : 'Pasif'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)} className="rounded-xl hover:bg-slate-50">
                        <Pencil size={16} className="text-slate-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteUser(u.id)} className="rounded-xl hover:bg-rose-50">
                        <Trash2 size={16} className="text-rose-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">{editingId ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Ad Soyad</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">E-posta</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Rol</Label>
                <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                  <option value="admin">Admin</option>
                  <option value="operation">Operasyon</option>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input id="active" type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded border-slate-300" />
                <Label htmlFor="active" className="text-xs text-slate-500">Aktif</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl border-slate-200/70">İptal</Button>
              <Button onClick={handleSave} disabled={!form.name || !form.email} className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white">Kaydet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
