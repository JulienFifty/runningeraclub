// Script para generar VAPID keys para Web Push Notifications
import webpush from 'web-push';

console.log('🔑 Generando VAPID keys para Web Push Notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID Keys generadas exitosamente!\n');
console.log('📋 Agrega estas variables a tu archivo .env.local:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_EMAIL=mailto:runningeraclub@gmail.com\n`);
console.log('⚠️  IMPORTANTE: Mantén la clave privada (VAPID_PRIVATE_KEY) segura y nunca la expongas en el cliente!\n');

