'use strict';

/**
 * tracking-number service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::tracking-number.tracking-number');
