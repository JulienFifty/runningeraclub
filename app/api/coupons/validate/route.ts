import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { code, event_id, amount } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Código de cupón es requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Buscar el cupón
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .single();

    if (couponError || !coupon) {
      return NextResponse.json(
        { error: 'Cupón no válido o expirado' },
        { status: 404 }
      );
    }

    // Verificar fechas de validez
    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

    if (now < validFrom) {
      return NextResponse.json(
        { error: 'Este cupón aún no está disponible' },
        { status: 400 }
      );
    }

    if (validUntil && now > validUntil) {
      return NextResponse.json(
        { error: 'Este cupón ha expirado' },
        { status: 400 }
      );
    }

    // Verificar límite de uso
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json(
        { error: 'Este cupón ha alcanzado su límite de uso' },
        { status: 400 }
      );
    }

    // Verificar si es específico de evento
    if (coupon.event_id && coupon.event_id !== event_id) {
      return NextResponse.json(
        { error: 'Este cupón no es válido para este evento' },
        { status: 400 }
      );
    }

    // Verificar monto mínimo
    if (coupon.min_amount && amount < coupon.min_amount) {
      return NextResponse.json(
        { 
          error: `Este cupón requiere un monto mínimo de $${coupon.min_amount} MXN`,
          min_amount: coupon.min_amount
        },
        { status: 400 }
      );
    }

    // Calcular descuento
    let discountAmount = 0;
    
    if (coupon.discount_type === 'percentage') {
      discountAmount = (amount * coupon.discount_value) / 100;
      
      // Aplicar descuento máximo si existe
      if (coupon.max_discount && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }
    } else {
      // fixed
      discountAmount = coupon.discount_value;
    }

    // No puede ser mayor al monto total
    if (discountAmount > amount) {
      discountAmount = amount;
    }

    const finalAmount = amount - discountAmount;

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
      },
      original_amount: amount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
    });
  } catch (error: any) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Error al validar el cupón', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Listar cupones disponibles para un evento
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    const supabase = await createClient();

    let query = supabase
      .from('coupons')
      .select('id, code, description, discount_type, discount_value, event_id')
      .eq('active', true)
      .or(`event_id.is.null,event_id.eq.${eventId}`)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener cupones' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}



