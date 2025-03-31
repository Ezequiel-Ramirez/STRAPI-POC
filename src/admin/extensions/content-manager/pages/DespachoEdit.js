import React from 'react';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';
import PdfExportButton from '../../components/PdfExportButton';


const DespachoEdit = () => {
  const { modifiedData } = useCMEditViewDataManager();
console.log('modifiedData', modifiedData)
  return (
    <div>
      {modifiedData.despachos?.map((despacho) => (
        <div key={despacho.id} style={{ marginBottom: '10px' }}>
          <h4>{despacho.nombre}</h4>
          <PdfExportButton entity={despacho} />
        </div>
      ))}
    </div>
  );
};

export default DespachoEdit;
