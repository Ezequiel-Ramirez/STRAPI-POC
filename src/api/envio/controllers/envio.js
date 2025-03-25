'use strict';

/**
 * envio controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController(
    'api::envio.envio',
    ({ strapi }) => ({
        async getFlat(ctx) {
            try {
              const { query } = ctx;
              const entries = await strapi.entityService.findMany('api::envio.envio', {
                ...query,
                populate: {
                  Estado: true,
                  tracking_number: true,
                  Carrier: true
                }
              });
              ctx.send(entries); // Envía directamente los datos
            } catch (err) {
              ctx.send({ error: err.message }, 500);
            }
          }
    })
);