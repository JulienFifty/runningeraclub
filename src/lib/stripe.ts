import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY no está definido en las variables de entorno');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
});

export const STRIPE_CONFIG = {
  currency: 'mxn',
  successUrl: process.env.NEXT_PUBLIC_URL 
    ? `${process.env.NEXT_PUBLIC_URL}/pago/exito` 
    : 'http://localhost:3000/pago/exito',
  cancelUrl: process.env.NEXT_PUBLIC_URL 
    ? `${process.env.NEXT_PUBLIC_URL}/pago/cancelado` 
    : 'http://localhost:3000/pago/cancelado',
};

