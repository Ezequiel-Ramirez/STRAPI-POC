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
                            envios: true,
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

            // 1. Obtener la lista de despachos
            const despachoList = await strapi.entityService.findOne('api::despacho-list.despacho-list', 2, {
                populate: {
                    Despacho: {
                        populate: ['envios']
                    }
                }
            });
            
            if (!despachoList || !despachoList.Despacho) {
                return ctx.notFound('No se encontraron listas de despacho');
            }
            
            console.log("📋 Lista de despachos cargada correctamente");
            
            // 2. Buscar el despacho específico
            const despachoIndex = despachoList.Despacho.findIndex(d => 
                String(d.CodigoDespacho) === String(CodigoDespacho)
            );
            
            if (despachoIndex === -1) {
                return ctx.notFound(`No se encontró el despacho con código ${CodigoDespacho}`);
            }
            
            const targetDespacho = despachoList.Despacho[despachoIndex];
            console.log(`✅ Despacho encontrado: ID=${targetDespacho.id}, Código=${targetDespacho.CodigoDespacho}`);
            
            // 3. Obtener los envíos actuales
            const currentEnvioIds = [];
            if (targetDespacho.envios && Array.isArray(targetDespacho.envios)) {
                targetDespacho.envios.forEach(e => {
                    if (e.id) currentEnvioIds.push(e.id);
                });
            }
            
            console.log(`📊 Envíos actuales: ${currentEnvioIds.length > 0 ? currentEnvioIds.join(', ') : 'ninguno'}`);
            
            // 4. Filtrar los nuevos IDs para evitar duplicados
            const newEnvioIds = envioIds.filter(id => !currentEnvioIds.includes(id));
            
            if (newEnvioIds.length === 0) {
                return ctx.conflict('Los envíos ya están asociados a este despacho');
            }
            
            console.log(`🚀 Nuevos envíos a agregar: ${newEnvioIds.join(', ')}`);
            
            // 5. Actualizar el despacho
            const updatedDespachos = [...despachoList.Despacho];
            updatedDespachos[despachoIndex] = {
                ...updatedDespachos[despachoIndex],
                CantidadEnvios: currentEnvioIds.length + newEnvioIds.length,
                envios: [...currentEnvioIds, ...newEnvioIds],
            };
            
            // 6. Actualizar la lista de despacho
            await strapi.entityService.update('api::despacho-list.despacho-list', despachoList.id, {
                data: {
                    Despacho: updatedDespachos
                }
            });
            
            // 7. Asociar envíos al despacho
            for (const envioId of newEnvioIds) {
                try {
                    await strapi.entityService.update('api::envio.envio', envioId, {
                        data: {
                            despacho: targetDespacho.id
                        }
                    });
                    console.log(`✓ Envío ${envioId} asociado correctamente`);
                } catch (err) {
                    console.error(`✗ Error al asociar envío ${envioId}:`, err.message);
                }
            }
            
            //Actualizar el estado del envío consultando api::estado.estado y asignarle el id de estado 5   
            const estado = await strapi.entityService.findOne('api::estado.estado', 5);
            console.info('estado enviado a despacho', estado)
            
            for (const envioId of newEnvioIds) {
                try {
                    const envioActualizado = await strapi.entityService.update('api::envio.envio', envioId, {
                        data: {
                            Estado: estado.id // Usar el ID del estado directamente para la relación
                        }
                    });
                    console.info('envío actualizado', envioActualizado)
                    console.log(`✓ Estado actualizado para el envío ${envioId} a: ${estado.EstadoEnvio || estado.id}`);
                } catch (err) {
                    console.error(`✗ Error al actualizar el estado del envío ${envioId}:`, err.message);
                }
            }
                    
            
            return {
                success: true,
                message: `${newEnvioIds.length} envíos asignados al despacho ${CodigoDespacho}`,
                data: {
                    CodigoDespacho,
                    despachoId: targetDespacho.id,
                    totalEnvios: currentEnvioIds.length + newEnvioIds.length,
                    nuevosEnvios: newEnvioIds
                }
            };

        } catch (err) {
            console.error("❌ Error en addEnviosToDespacho:", err);
            return ctx.badRequest('Error al asignar envíos', { details: err.message });
        }
    }


}));    