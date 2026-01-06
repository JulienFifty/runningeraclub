import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
      return NextResponse.json(
        { error: 'customer_id es requerido' },
        { status: 400 }
      );
    }

    // Obtener información del cliente
    const customer = await stripe.customers.retrieve(customerId);

    if (customer.deleted) {
      return NextResponse.json(
        { error: 'Cliente eliminado' },
        { status: 404 }
      );
    }

    // Obtener historial de pagos del cliente
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 100,
    });

    // Obtener métodos de pago guardados
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return NextResponse.json({
      customer,
      payment_history: paymentIntents.data,
      payment_methods: paymentMethods.data,
    });
  } catch (error: any) {
    console.error('Error fetching customer data:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del cliente', details: error.message },
      { status: 500 }
    );
  }
}




