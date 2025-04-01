import React, { useState } from "react";
import PdfExportButton from "../../components/PdfExportButton";
import { useCMEditViewDataManager } from "@strapi/helper-plugin";
import { 
  Box,
  Typography,
  SingleSelect,
  SingleSelectOption,
  Flex
} from "@strapi/design-system";
import { Download } from '@strapi/icons';

const DespachoList = () => {
  const { modifiedData } = useCMEditViewDataManager();
  const [selectedDespacho, setSelectedDespacho] = useState(null);

  console.log('modifiedData', modifiedData);

  const handleSelect = (value) => {
    const despacho = modifiedData?.Despacho?.find(d => d.id === Number(value));  // Convertir a número si es necesario
    console.log('despacho seleccionado:', despacho);
    setSelectedDespacho(despacho || null);
  };

  return (
    <Box padding={4}>
      <SingleSelect
        label="Despacho para Descargar"
        placeholder="Seleccione un despacho"
        value={selectedDespacho?.id || null} 
        onChange={handleSelect}
        style={{ width: '100%', fontSize: '16px' }}
      >
        {(modifiedData?.Despacho || []).map((despacho) => (
          <SingleSelectOption key={despacho.id} value={despacho.id.toString()}>
            <Flex gap={2} alignItems="center">
              <Download />
              <Typography>
                {despacho.CodigoDespacho || despacho.id} - Descargar PDF
              </Typography>
            </Flex>
          </SingleSelectOption>
        ))}
      </SingleSelect>
      
      {selectedDespacho && (
        <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', marginTop: '20px' }}>
          <PdfExportButton entity={selectedDespacho} />
        </Box>
      )}
    </Box>
  );
};

export default DespachoList;
