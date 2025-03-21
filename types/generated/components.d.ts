import type { Attribute, Schema } from '@strapi/strapi';

export interface DespachoEntitiesDespachos extends Schema.Component {
  collectionName: 'components_despacho_entities_despachos';
  info: {
    description: '';
    displayName: 'Despachos';
    icon: 'apps';
  };
  attributes: {
    CantidadEnvios: Attribute.BigInteger;
    Carrier: Attribute.Relation<
      'despacho-entities.despachos',
      'oneToOne',
      'api::carrier.carrier'
    >;
    CodigoDespacho: Attribute.String;
    Comentarios: Attribute.Blocks;
    envios: Attribute.Relation<
      'despacho-entities.despachos',
      'oneToMany',
      'api::envio.envio'
    >;
    estado_despacho: Attribute.Relation<
      'despacho-entities.despachos',
      'oneToOne',
      'api::estado-despacho.estado-despacho'
    >;
    IDDespacho: Attribute.String;
    Link: Attribute.String;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'despacho-entities.despachos': DespachoEntitiesDespachos;
    }
  }
}
