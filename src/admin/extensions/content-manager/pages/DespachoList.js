import React, { useState } from "react";
import PdfExportButton from "../../components/PdfExportButton";
import { useCMEditViewDataManager } from "@strapi/helper-plugin";
import { 
  Box,
  Typography,
  SingleSelect,
  SingleSelectOption,
  Flex,
  ModalLayout,
  Button
} from "@strapi/design-system";
import { Download } from '@strapi/icons';

const DespachoList = () => {
  const { modifiedData } = useCMEditViewDataManager();
  const [selectedDespacho, setSelectedDespacho] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  console.log('modifiedData', modifiedData);

  const handleSelect = (value) => {
    const despacho = modifiedData?.Despacho?.find(d => d.id === Number(value));  // Convertir a número si es necesario
    console.log('despacho seleccionado:', despacho);
    setSelectedDespacho(despacho || null);
    if (despacho) setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedDespacho(null);
  };

  return (
    <Box padding={4}>
      <SingleSelect
        label="Despacho a gestionar"
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

      {/* Modal para acciones del despacho */}
      {modalOpen && selectedDespacho && (
        <ModalLayout
          onClose={handleCloseModal}
          labelledBy="modal-title"
        >
          <Box padding={4}>
            <Typography id="modal-title" variant="beta" as="h2">
              Acciones para el despacho: {selectedDespacho.CodigoDespacho || selectedDespacho.id}
            </Typography>
            <Box paddingTop={4}>
              <PdfExportButton entity={selectedDespacho} />
            </Box>
            {/* Aquí puedes agregar más acciones en el futuro */}
            <Box paddingTop={4}>
              <Button variant="secondary" onClick={handleCloseModal} fullWidth>
                Cerrar
              </Button>
            </Box>
          </Box>
        </ModalLayout>
      )}
    </Box>
  );
};

export default DespachoList;
