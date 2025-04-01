// src/api/envio/routes/custom.js
module.exports = {
    routes: [
      {
        method: 'GET',
        path: '/envios/flat',
        handler: 'envio.getFlat',
        config: {
          auth: false,
          policies: [] // Asegurar de no tener políticas restrictivas
        }
      }
    ]
  };