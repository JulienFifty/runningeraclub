"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Tag, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  description: string | null;
  valid_from: string;
  valid_until: string | null;
  usage_limit: number | null;
  used_count: number;
  min_amount: number | null;
  max_discount: number | null;
  event_id: string | null;
  active: boolean;
  created_at: string;
  events?: { title: string; slug: string };
}

interface Event {
  id: string;
  title: string;
  slug: string;
}

export default function CouponsManagement() {
  const supabase = createClient();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    description: '',
    valid_from: new Date().toISOString().slice(0, 16),
    valid_until: '',
    usage_limit: '',
    min_amount: '',
    max_discount: '',
    event_id: '',
    active: true,
  });

  useEffect(() => {
    fetchCoupons();
    fetchEvents();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*, events(title, slug)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar cupones');
      console.error(error);
    } else {
      setCoupons(data || []);
    }
    setLoading(false);
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, slug')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const couponData = {
      code: formData.code.toUpperCase().trim(),
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      description: formData.description || null,
      valid_from: new Date(formData.valid_from).toISOString(),
      valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      min_amount: formData.min_amount ? parseFloat(formData.min_amount) : null,
      max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
      event_id: formData.event_id || null,
      active: formData.active,
    };

    if (editingCoupon) {
      const { error } = await supabase
        .from('coupons')
        .update(couponData)
        .eq('id', editingCoupon.id);

      if (error) {
        toast.error('Error al actualizar cupón');
        console.error(error);
      } else {
        toast.success('Cupón actualizado exitosamente');
        setIsDialogOpen(false);
        resetForm();
        fetchCoupons();
      }
    } else {
      const { error } = await supabase.from('coupons').insert(couponData);

      if (error) {
        toast.error('Error al crear cupón');
        console.error(error);
      } else {
        toast.success('Cupón creado exitosamente');
        setIsDialogOpen(false);
        resetForm();
        fetchCoupons();
      }
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      description: coupon.description || '',
      valid_from: new Date(coupon.valid_from).toISOString().slice(0, 16),
      valid_until: coupon.valid_until ? new Date(coupon.valid_until).toISOString().slice(0, 16) : '',
      usage_limit: coupon.usage_limit?.toString() || '',
      min_amount: coupon.min_amount?.toString() || '',
      max_discount: coupon.max_discount?.toString() || '',
      event_id: coupon.event_id || '',
      active: coupon.active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cupón?')) return;

    const { error } = await supabase.from('coupons').delete().eq('id', id);

    if (error) {
      toast.error('Error al eliminar cupón');
      console.error(error);
    } else {
      toast.success('Cupón eliminado');
      fetchCoupons();
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    const { error } = await supabase
      .from('coupons')
      .update({ active: !coupon.active })
      .eq('id', coupon.id);

    if (error) {
      toast.error('Error al cambiar estado');
      console.error(error);
    } else {
      toast.success(coupon.active ? 'Cupón desactivado' : 'Cupón activado');
      fetchCoupons();
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      description: '',
      valid_from: new Date().toISOString().slice(0, 16),
      valid_until: '',
      usage_limit: '',
      min_amount: '',
      max_discount: '',
      event_id: '',
      active: true,
    });
    setEditingCoupon(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-light text-foreground">
            Cupones de Descuento
          </h2>
          <p className="text-muted-foreground mt-1">
            Gestiona cupones y promociones para eventos
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cupón
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? 'Editar Cupón' : 'Crear Nuevo Cupón'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Código del Cupón *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="PROMO20"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="discount_type">Tipo de Descuento *</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: 'percentage' | 'fixed') =>
                      setFormData({ ...formData, discount_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                      <SelectItem value="fixed">Monto Fijo (MXN)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="discount_value">
                  Valor del Descuento * ({formData.discount_type === 'percentage' ? '%' : 'MXN'})
                </Label>
                <Input
                  id="discount_value"
                  type="number"
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  placeholder={formData.discount_type === 'percentage' ? '20' : '50'}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descuento del 20% en todos los eventos"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valid_from">Válido Desde *</Label>
                  <Input
                    id="valid_from"
                    type="datetime-local"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="valid_until">Válido Hasta</Label>
                  <Input
                    id="valid_until"
                    type="datetime-local"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="usage_limit">Límite de Uso</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    placeholder="Ilimitado"
                  />
                </div>

                <div>
                  <Label htmlFor="min_amount">Monto Mínimo (MXN)</Label>
                  <Input
                    id="min_amount"
                    type="number"
                    step="0.01"
                    value={formData.min_amount}
                    onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              {formData.discount_type === 'percentage' && (
                <div>
                  <Label htmlFor="max_discount">Descuento Máximo (MXN)</Label>
                  <Input
                    id="max_discount"
                    type="number"
                    step="0.01"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                    placeholder="Ilimitado"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="event_id">Evento Específico (Opcional)</Label>
                <Select
                  value={formData.event_id}
                  onValueChange={(value) => setFormData({ ...formData, event_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los eventos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los eventos</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="active" className="cursor-pointer">
                  Cupón activo
                </Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  {editingCoupon ? 'Actualizar' : 'Crear'} Cupón
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cupones</p>
                <p className="text-2xl font-semibold mt-1">{coupons.length}</p>
              </div>
              <Tag className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-2xl font-semibold mt-1 text-green-600">
                  {coupons.filter((c) => c.active).length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usos</p>
                <p className="text-2xl font-semibold mt-1">
                  {coupons.reduce((acc, c) => acc + c.used_count, 0)}
                </p>
              </div>
              <Tag className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Por Vencer</p>
                <p className="text-2xl font-semibold mt-1 text-orange-600">
                  {coupons.filter((c) => {
                    if (!c.valid_until) return false;
                    const daysLeft = Math.ceil(
                      (new Date(c.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );
                    return daysLeft > 0 && daysLeft <= 7;
                  }).length}
                </p>
              </div>
              <Tag className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de cupones */}
      <Card>
        <CardHeader>
          <CardTitle>Cupones Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando cupones...</p>
          ) : coupons.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay cupones registrados. Crea tu primer cupón.
            </p>
          ) : (
            <div className="space-y-4">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg font-mono">{coupon.code}</h3>
                        <Badge variant={coupon.active ? 'default' : 'secondary'}>
                          {coupon.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                        {coupon.discount_type === 'percentage' ? (
                          <Badge variant="outline">{coupon.discount_value}% OFF</Badge>
                        ) : (
                          <Badge variant="outline">${coupon.discount_value} MXN OFF</Badge>
                        )}
                      </div>
                      {coupon.description && (
                        <p className="text-sm text-muted-foreground mt-1">{coupon.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Desde: {formatDate(coupon.valid_from)}</span>
                        {coupon.valid_until && <span>Hasta: {formatDate(coupon.valid_until)}</span>}
                        {coupon.usage_limit && (
                          <span>
                            Usos: {coupon.used_count} / {coupon.usage_limit}
                          </span>
                        )}
                        {!coupon.usage_limit && <span>Usos: {coupon.used_count}</span>}
                        {coupon.min_amount && <span>Mínimo: ${coupon.min_amount} MXN</span>}
                        {coupon.events && <span>Evento: {coupon.events.title}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleActive(coupon)}
                        title={coupon.active ? 'Desactivar' : 'Activar'}
                      >
                        {coupon.active ? '🟢' : '⚫'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(coupon)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(coupon.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}




