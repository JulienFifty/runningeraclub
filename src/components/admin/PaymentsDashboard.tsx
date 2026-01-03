"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, TrendingUp, Users, CreditCard, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  event_id: string;
  member_id: string | null;
  attendee_id: string | null;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  created_at: string;
  metadata?: {
    stripe_customer_id?: string;
  };
  events?: {
    title: string;
    slug: string;
  };
  members?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  attendees?: {
    name: string;
    email: string;
  };
}

interface Stats {
  totalRevenue: number;
  totalTransactions: number;
  successfulPayments: number;
  refundedPayments: number;
}

export function PaymentsDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalTransactions: 0,
    successfulPayments: 0,
    refundedPayments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [selectedEvent]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Obtener eventos
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title')
        .order('date', { ascending: false });

      if (eventsData) {
        setEvents(eventsData);
      }

      // Construir query para transacciones
      let query = supabase
        .from('payment_transactions')
        .select(`
          *,
          events(title, slug),
          members(first_name, last_name, email),
          attendees(name, email)
        `)
        .order('created_at', { ascending: false });

      if (selectedEvent !== 'all') {
        query = query.eq('event_id', selectedEvent);
      }

      const { data: transactionsData, error } = await query;

      if (error) {
        toast.error('Error al cargar transacciones', {
          description: error.message,
        });
        return;
      }

      if (transactionsData) {
        setTransactions(transactionsData as Transaction[]);

        // Calcular estadísticas
        const totalRevenue = transactionsData
          .filter((t) => t.status === 'succeeded')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const successfulPayments = transactionsData.filter(
          (t) => t.status === 'succeeded'
        ).length;

        const refundedPayments = transactionsData.filter(
          (t) => t.status === 'refunded'
        ).length;

        setStats({
          totalRevenue,
          totalTransactions: transactionsData.length,
          successfulPayments,
          refundedPayments,
        });
      }
    } catch (error: any) {
      toast.error('Error al cargar datos', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (transactionId: string, paymentIntentId: string) => {
    if (!confirm('¿Estás seguro de que deseas reembolsar este pago?')) {
      return;
    }

    try {
      const response = await fetch('/api/stripe/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_intent_id: paymentIntentId,
          transaction_id: transactionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Error al procesar reembolso', {
          description: data.error,
        });
        return;
      }

      toast.success('Reembolso procesado exitosamente');
      fetchData();
    } catch (error: any) {
      toast.error('Error al procesar reembolso', {
        description: error.message,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      succeeded: { label: 'Exitoso', className: 'bg-green-100 text-green-800' },
      pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
      failed: { label: 'Fallido', className: 'bg-red-100 text-red-800' },
      refunded: { label: 'Reembolsado', className: 'bg-gray-100 text-gray-800' },
      canceled: { label: 'Cancelado', className: 'bg-orange-100 text-orange-800' },
    };

    const variant = variants[status] || variants.pending;
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalRevenue.toFixed(2)} MXN
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transacciones</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Exitosos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successfulPayments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reembolsos</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.refundedPayments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y tabla */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transacciones</CardTitle>
            <div className="flex items-center gap-4">
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los eventos</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No hay transacciones
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {transaction.events?.title || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div>
                          {transaction.members
                            ? `${transaction.members.first_name} ${transaction.members.last_name}`
                            : transaction.attendees?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.members?.email || transaction.attendees?.email || ''}
                        </div>
                        {transaction.metadata?.stripe_customer_id && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Customer ID: {transaction.metadata.stripe_customer_id.substring(0, 20)}...
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        ${transaction.amount.toFixed(2)} {transaction.currency.toUpperCase()}
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        {new Date(transaction.created_at).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        {transaction.status === 'succeeded' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleRefund(transaction.id, transaction.stripe_payment_intent_id)
                            }
                          >
                            Reembolsar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

