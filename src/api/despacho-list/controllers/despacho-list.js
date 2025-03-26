// @ts-nocheck
'use strict';

/**
 * despacho-list controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::despacho-list.despacho-list', ({ strapi }) => ({
    async getFlatList(ctx) {
        try {
            const entries = await strapi.entityService.findMany('api::despacho-list.despacho-list', {
                ...ctx.query,
                populate: {
                    Despacho: {
                        populate: {
                            estado_despacho: true,
                            envios: {
                                populate: {
                                    Estado: true,
                                }
                            },
                            Carrier: true,
                        }
                    },
                }
            });
            return entries;
        } catch (err) {
            ctx.throw(500, err);
        }
    },
    async addEnviosToDespacho(ctx) {
        try {
          const { envioIds, CodigoDespacho } = ctx.request.body;
      
          if (!envioIds || !CodigoDespacho) {
            return ctx.badRequest('Se requieren envioIds y CodigoDespacho');
          }
      
          console.log(`🔍 Buscando despacho con CodigoDespacho: ${CodigoDespacho}`);
      
          // 1. Obtener la lista de despachos (debe ser singular en Strapi)
          const despachoList = await strapi.entityService.findMany('api::despacho-list.despacho-list', {
            populate: { Despacho: true }
          });
      
          console.log("📌 Despachos encontrados:", JSON.stringify(despachoList, null, 2));
      
          // 2. Acceder a la lista de despachos dentro de `Despacho`
          if (!despachoList || !despachoList.Despacho || !Array.isArray(despachoList.Despacho)) {
            return ctx.notFound('No se encontraron despachos');
          }
      
          // 3. Buscar el despacho específico dentro de la lista
          const despachoEncontrado = despachoList.Despacho.find(d => d.CodigoDespacho === CodigoDespacho);
      
          if (!despachoEncontrado) {
            console.error(`❌ No se encontró el despacho con CódigoDespacho ${CodigoDespacho}`);
            return ctx.notFound(`No se encontró el despacho con código ${CodigoDespacho}`);
          }
      
          console.log("✅ Despacho encontrado:", despachoEncontrado);
      
          // 4. Obtener los envíos actuales
          const enviosActuales = despachoEncontrado.envios ? despachoEncontrado.envios.map(envio => envio.id) : [];
      
          // 5. Filtrar nuevos IDs para evitar duplicados
          const nuevosEnviosIds = envioIds.filter(id => !enviosActuales.includes(id));
      
          if (!nuevosEnviosIds.length) {
            return ctx.conflict('Los envíos ya están asociados a este despacho');
          }
      
          console.log(`🚀 Agregando nuevos envíos: ${nuevosEnviosIds}`);
      
          // 6. Actualizar la relación de envíos en `despacho`
          await strapi.entityService.update('api::despacho-list.despacho-list', despachoEncontrado.id, {
            data: {
              envios: [...enviosActuales, ...nuevosEnviosIds].map(id => ({ id }))
            }
          });
      
          return {
            success: true,
            message: `${nuevosEnviosIds.length} envíos asignados al despacho ${CodigoDespacho}`,
            data: {
              CodigoDespacho,
              totalEnvios: enviosActuales.length + nuevosEnviosIds.length,
              nuevosEnvios: nuevosEnviosIds
            }
          };
          
        } catch (err) {
          console.error("❌ Error en addEnviosToDespacho:", err);
          ctx.status = 500;
          return {
            error: 'Error al asignar envíos',
            details: process.env.NODE_ENV === 'development' ? {
              message: err.message,
              stack: err.stack
            } : undefined
          };
        }
      }
      
      
}));    