import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    
    if (!vapidPublicKey) {
      return NextResponse.json(
        { error: 'VAPID public key no configurada' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      publicKey: vapidPublicKey,
    });
  } catch (error: any) {
    console.error('Error getting VAPID public key:', error);
    return NextResponse.json(
      { error: 'Error al obtener clave VAPID', details: error.message },
      { status: 500 }
    );
  }
}

