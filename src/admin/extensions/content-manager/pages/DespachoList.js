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

  // NUEVO: Estado para filtros y envíos filtrados
  const [filtros, setFiltros] = useState({
    estadoEnvio: '',
    estadoTracking: '',
    carrierNegocio: '',
    pedido: '',
    crmid: '',
    trackingNumber: '',
  });
  const [enviosFiltrados, setEnviosFiltrados] = useState([]);

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

  // Actualizar enviosFiltrados cuando cambian los envios o se abre/cierra el modal
  useEffect(() => {
    setEnviosFiltrados(envios);
  }, [envios]);

  const handleSelect = (value) => {
    const despacho = modifiedData?.Despacho?.find(d => d.id === Number(value));
    setSelectedDespacho(despacho || null);
    if (despacho) setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedDespacho(null);
    setSelectedEnvios([]);
    setFiltros({
      estadoEnvio: '',
      estadoTracking: '',
      carrierNegocio: '',
      pedido: '',
      crmid: '',
      trackingNumber: '',
    });
    setEnviosFiltrados(envios);
  };

  // Función para aplicar filtros
  const handleFiltrarEnvios = () => {
    let filtrados = envios;
    if (filtros.estadoEnvio) {
      filtrados = filtrados.filter(e => e.Estado?.EstadoEnvio === filtros.estadoEnvio);
    }
    if (filtros.estadoTracking) {
      filtrados = filtrados.filter(e => e.tracking_number?.Estado === filtros.estadoTracking);
    }
    if (filtros.carrierNegocio) {
      filtrados = filtrados.filter(e => e.Carrier?.Negocio === filtros.carrierNegocio);
    }
    if (filtros.pedido) {
      filtrados = filtrados.filter(e => (e.Pedido || '').toLowerCase().includes(filtros.pedido.toLowerCase()));
    }
    if (filtros.crmid) {
      filtrados = filtrados.filter(e => (e.CRMID || '').toLowerCase().includes(filtros.crmid.toLowerCase()));
    }
    if (filtros.trackingNumber) {
      filtrados = filtrados.filter(e => (e.tracking_number?.TrackingNumber || '').toLowerCase().includes(filtros.trackingNumber.toLowerCase()));
    }
    setEnviosFiltrados(filtrados);
    setSelectedEnvios([]); // Limpiar selección al filtrar
  };

  // NUEVO: Función para borrar filtros
  const handleBorrarFiltros = () => {
    setFiltros({
      estadoEnvio: '',
      estadoTracking: '',
      carrierNegocio: '',
      pedido: '',
      crmid: '',
      trackingNumber: '',
    });
    setEnviosFiltrados(envios);
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

  // Obtener opciones únicas para los selects de filtro
  const opcionesEstadoEnvio = Array.from(new Set(envios.map(e => e.Estado?.EstadoEnvio).filter(Boolean)));
  const opcionesEstadoTracking = Array.from(new Set(envios.map(e => e.tracking_number?.Estado).filter(Boolean)));
  const opcionesCarrierNegocio = Array.from(new Set(envios.map(e => e.Carrier?.Negocio).filter(Boolean)));

  // Saber si hay algún filtro aplicado
  const hayFiltrosAplicados = Object.values(filtros).some(v => v && v !== '');

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
                {/* Filtros de envíos */}
                <Box paddingBottom={4} background="neutral100" hasRadius shadow="tableShadow" padding={4}>
                  <Flex gap={4} wrap="wrap">
                    <SingleSelect
                      label="Estado del Envío"
                      placeholder="Todos"
                      value={filtros.estadoEnvio}
                      onChange={v => setFiltros(f => ({ ...f, estadoEnvio: v }))}
                      style={{ minWidth: 180 }}
                    >
                      <SingleSelectOption value="">Todos</SingleSelectOption>
                      {opcionesEstadoEnvio.map(op => (
                        <SingleSelectOption key={op} value={op}>{op}</SingleSelectOption>
                      ))}
                    </SingleSelect>
                    <SingleSelect
                      label="Estado Tracking"
                      placeholder="Todos"
                      value={filtros.estadoTracking}
                      onChange={v => setFiltros(f => ({ ...f, estadoTracking: v }))}
                      style={{ minWidth: 180 }}
                    >
                      <SingleSelectOption value="">Todos</SingleSelectOption>
                      {opcionesEstadoTracking.map(op => (
                        <SingleSelectOption key={op} value={op}>{op}</SingleSelectOption>
                      ))}
                    </SingleSelect>
                    <SingleSelect
                      label="Negocio Carrier"
                      placeholder="Todos"
                      value={filtros.carrierNegocio}
                      onChange={v => setFiltros(f => ({ ...f, carrierNegocio: v }))}
                      style={{ minWidth: 180 }}
                    >
                      <SingleSelectOption value="">Todos</SingleSelectOption>
                      {opcionesCarrierNegocio.map(op => (
                        <SingleSelectOption key={op} value={op}>{op}</SingleSelectOption>
                      ))}
                    </SingleSelect>
                    <input
                      type="text"
                      placeholder="Pedido"
                      value={filtros.pedido}
                      onChange={e => setFiltros(f => ({ ...f, pedido: e.target.value }))}
                      style={{ minWidth: 120, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                    />
                    <input
                      type="text"
                      placeholder="CRMID"
                      value={filtros.crmid}
                      onChange={e => setFiltros(f => ({ ...f, crmid: e.target.value }))}
                      style={{ minWidth: 120, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                    />
                    <input
                      type="text"
                      placeholder="Tracking Number"
                      value={filtros.trackingNumber}
                      onChange={e => setFiltros(f => ({ ...f, trackingNumber: e.target.value }))}
                      style={{ minWidth: 150, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                    />
                    <Button variant="secondary" onClick={handleFiltrarEnvios} style={{ height: 44 }}>
                      Aplicar filtros
                    </Button>
                    <Button variant="danger" onClick={handleBorrarFiltros} style={{ height: 44 }} disabled={!hayFiltrosAplicados}>
                      Borrar filtros
                    </Button>
                  </Flex>
                </Box>
                <MultiSelect
                  label={`Seleccionar envíos (${enviosFiltrados.length} encontrados)`}
                  placeholder={loadingEnvios ? "Cargando envíos..." : "Seleccione envíos"}
                  value={selectedEnvios}
                  onChange={values => {
                    // Si el usuario selecciona la opción especial 'ALL', selecciona o deselecciona todos
                    if (values.includes('ALL')) {
                      if (selectedEnvios.length === enviosFiltrados.length) {
                        setSelectedEnvios([]);
                      } else {
                        setSelectedEnvios(enviosFiltrados.map(e => e.id.toString()));
                      }
                    } else {
                      setSelectedEnvios(values);
                    }
                  }}
                  disabled={loadingEnvios}
                >
                  {/* Opción para seleccionar todos */}
                  {enviosFiltrados.length > 0 && (
                    <MultiSelectOption value="ALL">
                      {selectedEnvios.length === enviosFiltrados.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </MultiSelectOption>
                  )}
                  {enviosFiltrados.map(envio => (
                    <MultiSelectOption key={envio.id} value={envio.id.toString()}>
                      {envio.IdEnvio || envio.id} - Estado: {envio.Estado?.EstadoEnvio || ''} - Tracking Number: {envio.tracking_number?.TrackingNumber || ''}
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
