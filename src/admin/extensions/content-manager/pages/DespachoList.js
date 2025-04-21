import React, { useState, useEffect } from "react";
import PdfExportButton from "../../components/PdfExportButton";
import { useCMEditViewDataManager, useNotification } from "@strapi/helper-plugin";
import { 
  Box,
  Typography,
  SingleSelect,
  SingleSelectOption,
  Flex,
  ModalLayout,
  Button,
  MultiSelect,
  MultiSelectOption
} from "@strapi/design-system";
import { Download } from '@strapi/icons';

const DespachoList = () => {
  const { modifiedData } = useCMEditViewDataManager();
  const toggleNotification = useNotification();
  const [selectedDespacho, setSelectedDespacho] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [envios, setEnvios] = useState([]);
  const [selectedEnvios, setSelectedEnvios] = useState([]);
  const [loadingEnvios, setLoadingEnvios] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (modalOpen) {
      setLoadingEnvios(true);
      fetch('/api/envios/flat')
        .then(res => res.json())
        .then(data => {
          setEnvios(data);
          setLoadingEnvios(false);
        })
        .catch(() => {
          setEnvios([]);
          setLoadingEnvios(false);
          toggleNotification({ type: 'warning', message: 'No se pudo cargar la lista de envíos.' });
        });
    } else {
      setEnvios([]);
      setSelectedEnvios([]);
    }
  }, [modalOpen, toggleNotification]);

  const handleSelect = (value) => {
    const despacho = modifiedData?.Despacho?.find(d => d.id === Number(value));
    setSelectedDespacho(despacho || null);
    if (despacho) setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedDespacho(null);
    setSelectedEnvios([]);
  };

  const handleAddEnvios = async () => {
    if (!selectedEnvios.length) {
      toggleNotification({ type: 'warning', message: 'Debe seleccionar al menos un envío.' });
      return;
    }
    setSubmitting(true);
    try {
      // Mapear los IDs seleccionados a los objetos completos de envíos
      const selectedEntries = envios.filter(envio => selectedEnvios.includes(envio.id.toString()));

      const response = await fetch('/api/despacho-list/add-envios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedEntries,
          CodigoDespacho: selectedDespacho.CodigoDespacho
        })
      });
      const result = await response.json();
      if (result.success) {
        toggleNotification({ type: 'success', message: result.message || 'Envíos asociados correctamente.' });
        handleCloseModal();
      }
      if (!result.success) {
        toggleNotification({ type: 'warning', message: result.error.message || 'Error al asociar envío.' });
      }
    } catch (error) {
      toggleNotification({ type: 'warning', message: error.message || 'Error al asociar envíos.' });
    }
    setSubmitting(false);
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
                {despacho.CodigoDespacho || despacho.id} - Gestionar Despacho
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
            <Box paddingTop={6}>
              <Typography variant="omega" fontWeight="bold">
                Asociar envíos a este despacho:
              </Typography>
              <Box paddingTop={2}>
                <MultiSelect
                  label="Seleccionar envíos"
                  placeholder={loadingEnvios ? "Cargando envíos..." : "Seleccione envíos"}
                  value={selectedEnvios}
                  onChange={setSelectedEnvios}
                  disabled={loadingEnvios}
                >
                  {envios.map(envio => (
                    <MultiSelectOption key={envio.id} value={envio.id.toString()}>
                      {envio.IdEnvio || envio.id} - Estado: {envio.Estado.EstadoEnvio || ''}
                    </MultiSelectOption>
                  ))}
                </MultiSelect>
              </Box>
              <Box paddingTop={4}>
                <Button
                  variant="success"
                  onClick={handleAddEnvios}
                  disabled={submitting || loadingEnvios || !selectedEnvios.length}
                  loading={submitting}
                  fullWidth
                >
                  Asociar envíos
                </Button>
              </Box>
            </Box>
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
