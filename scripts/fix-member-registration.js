// Script para reparar registro de miembro
// Uso: node scripts/fix-member-registration.js

const memberId = '988ab89c-fa03-48fb-ab2d-8a79df7d4eaf';
const memberEmail = 'yarembi@hotmail.com';

// Necesitas proporcionar el event_id del evento "LONG RUN W/ATÍPICO"
// Puedes obtenerlo de la base de datos o de la URL del evento

async function fixRegistration() {
  // Primero necesitamos obtener el event_id
  // Puedes ejecutar esto en la consola del navegador en la página del evento:
  // O buscar en la base de datos: SELECT id FROM events WHERE title LIKE '%LONG RUN%ATÍPICO%';
  
  console.log('Para ejecutar el fix, necesitas:');
  console.log('1. El event_id del evento "LONG RUN W/ATÍPICO"');
  console.log('2. Ejecutar:');
  console.log(`
    fetch('/api/admin/fix-member-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: '${memberId}',
        event_id: 'TU_EVENT_ID_AQUI'
      })
    }).then(r => r.json()).then(console.log)
  `);
}

fixRegistration();
