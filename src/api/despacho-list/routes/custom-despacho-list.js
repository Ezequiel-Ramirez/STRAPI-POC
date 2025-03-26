// src/api/envio/routes/custom.js
module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/despacho-list/flat',
            handler: 'despacho-list.getFlatList',
            config: {
                auth: false,
                policies: [] // Asegúrate de no tener políticas restrictivas
            }
        },
        {
            method: 'POST',
            path: '/despacho-list/add-envios',
            handler: 'despacho-list.addEnviosToDespacho',
            config: {
                auth: false,
                policies: [] // Asegúrate de no tener políticas restrictivas
            }
        }
    ]
};
