/** @jsx React.createElement */
import React, { useState, useEffect } from "react";
import { 
  Button, 
  Typography, 
  ModalLayout, 
  ModalBody, 
  ModalHeader, 
  ModalFooter,
  Loader,
  Flex
} from "@strapi/design-system";
import { Boolean, PaperPlane } from "@strapi/icons";
import { useLocation } from "react-router-dom";
import { useNotification, useQueryParams } from '@strapi/helper-plugin';
import axios from 'axios';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';

// @ts-ignore
const SelectAllButton = () => {
  const toggleNotification = useNotification();
  const location = useLocation();
  const [{ query }] = useQueryParams();
  const isEnvioView = /\/content-manager\/collection-types\/api::envio\.envio/.test(location.pathname);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [areAllSelected, setAreAllSelected] = useState(false);
  const [totalEntries, setTotalEntries] = useState(0);
  const { modifiedData, isCreatingEntry } = useCMEditViewDataManager();
  
  // Estado para el modal y selección de despacho
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [despachoList, setDespachoList] = useState([]);
  const [selectedDespacho, setSelectedDespacho] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isEnvioView) {
    return null;
  }
  console.info('ID del envío seleccionado:', modifiedData.id);
  console.info('modifiedData', modifiedData);

  
  const simulateSelection = (checked) => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      if (checkbox instanceof HTMLInputElement) {
        checkbox.checked = checked;
      }
    });
  };

  const handleToggleSelectAll = async () => {
    try {
      if (areAllSelected) {
        setSelectedEntries([]);
        simulateSelection(false);
        setAreAllSelected(false);
        return;
      }
  
      const currentUrl = new URL(window.location.href);
      const params = new URLSearchParams(currentUrl.search);
      
      // Parámetros esenciales
      const essentialParams = new URLSearchParams();
      ['filters', 'sort', 'page', 'pageSize'].forEach(key => {
        if (params.get(key)) essentialParams.set(key, params.get(key));
      });
      
      essentialParams.set('pageSize', '100');
  
      const response = await axios.get(`/api/envios/flat?${essentialParams.toString()}`, {
        headers: {
          'Cache-Control': 'no-cache' // Evita problemas de caché
        }
      });
  
      if (!response.data) throw new Error('Datos vacíos en la respuesta');
      
      setSelectedEntries(response.data);
      simulateSelection(true);
      setAreAllSelected(true);
      setTotalEntries(response.data.length);

      toggleNotification({
        type: 'success',
        message: `${response.data.length} entradas seleccionadas`,
      });
  
    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
      toggleNotification({
        type: 'warning',
        message: error.response?.data?.error?.message || 'Error al procesar la solicitud',
      });
    }
  };

  // Función para cargar la lista de despachos
  const loadDespachoList = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/despacho-list/flat');
      
      const despachos = response.data.Despacho || [];
      console.info('despachos', despachos)

      setDespachoList(despachos);
      setIsLoading(false);
    } catch (error) {
      console.error('Error al cargar la lista de despachos:', error);
      toggleNotification({
        type: 'warning',
        message: 'No se pudo cargar la lista de despachos',
      });
      setIsLoading(false);
    }
  };
  
  // Función para abrir el modal y cargar la lista de despachos
  const openDespachoModal = async () => {
    if (selectedEntries.length === 0) {
      toggleNotification({
        type: 'warning',
        message: 'No hay entradas seleccionadas.',
      });
      return;
    }
    
    // Resetear la selección al abrir el modal
    setSelectedDespacho(null);
    setIsModalVisible(true);
    await loadDespachoList();
  };
  
  // Manejar selección de despacho mediante checkbox
  const handleSelectDespacho = (despachoId) => {
    setSelectedDespacho(despachoId);
  };
  
  const handleEnviarADespacho = async () => {
    if (!selectedDespacho) {
      toggleNotification({
        type: 'warning',
        message: 'Debe seleccionar un despacho.',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Buscar el despacho seleccionado en la lista
      const despachoSeleccionado = despachoList.find(d => d.CodigoDespacho === selectedDespacho);
      
      if (!despachoSeleccionado) {
        throw new Error('No se encontró el despacho seleccionado');
      }
      
      console.log('selectedEntries', selectedEntries);
      console.info('despachoSeleccionado', despachoSeleccionado)
      
      // Enviar cada entrada seleccionada a la API de despacho con el despacho seleccionado
      const envioIds = selectedEntries.map(entry => entry.id);
      const response = await axios.post('/api/despacho-list/add-envios', {
        envioIds,
        CodigoDespacho: despachoSeleccionado.CodigoDespacho
      });
      console.info('response', response)
      
      if (response.status === 200) {
        toggleNotification({
          type: 'success',
          message: `${selectedEntries.length} entradas enviadas a despacho ${despachoSeleccionado.CodigoDespacho} correctamente.`,
        });
      } else {
        toggleNotification({
          type: 'warning',
          message: 'Hubo un error al enviar las entradas a despacho.',
        });
      }
      
      // Cerrar el modal y limpiar la selección
      setIsModalVisible(false);
      setSelectedDespacho(null);
      setSelectedEntries([]);
    } catch (error) {
      console.error('Error al enviar a despacho:', error);
      toggleNotification({
        type: 'warning',
        message: 'Hubo un error al enviar las entradas a despacho.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  
  // Modal de selección de despacho
  const renderModal = () => {
    if (!isModalVisible) return null;
    
    return (
      <ModalLayout onClose={() => setIsModalVisible(false)} labelledBy="title">
        <ModalHeader>
          <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
            Seleccionar Despacho
          </Typography>
        </ModalHeader>
        <ModalBody>
          {isLoading ? (
            <Flex justifyContent="center" padding={4}>
              <Loader>Cargando despachos...</Loader>
            </Flex>
          ) : despachoList.length > 0 ? (
            <div>
              <Typography variant="beta" paddingBottom={4}>Seleccione un despacho:</Typography>
              
              {despachoList.map((despacho) => (
                <Flex 
                  key={despacho.CodigoDespacho} 
                  padding={3} 
                  background={selectedDespacho === despacho.CodigoDespacho ? "primary100" : "neutral0"}
                  hasRadius 
                  style={{ 
                    cursor: 'pointer',
                    marginBottom: '8px',
                    border: `1px solid ${selectedDespacho === despacho.CodigoDespacho ? "#4945ff" : "#dcdce4"}`
                  }} 
                  onClick={() => handleSelectDespacho(despacho.CodigoDespacho)}
                >
                  <Typography>{`Despacho #${despacho.CodigoDespacho} - ID: ${despacho.IDDespacho}`}</Typography>
                </Flex>
              ))}
            </div>
          ) : (
            <Typography>No hay despachos disponibles.</Typography>
          )}
        </ModalBody>
        <ModalFooter 
          startActions={
            <Button onClick={() => setIsModalVisible(false)} variant="tertiary">
              Cancelar
            </Button>
          }
          endActions={
            <Button 
              onClick={handleEnviarADespacho} 
              disabled={!selectedDespacho || isLoading}
              loading={isLoading}
              startIcon={<PaperPlane />}
            >
              Enviar a Despacho
            </Button>
          }
        />
      </ModalLayout>
    );
  };

  return (
    <div style={{ display: 'flex', gap: '10px', marginLeft: '10px', alignItems: 'center' }}>
     {/* Contador de selección */}
     <Typography variant="pi" style={{ marginLeft: '10px' }}>
        {selectedEntries.length} de {totalEntries} seleccionados
      </Typography>
      <Button
        variant={areAllSelected ? 'primary' : 'secondary'}
        startIcon={<Boolean />}
        onClick={handleToggleSelectAll}
      >
        {areAllSelected ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
      </Button>
      <Button
        variant={selectedEntries.length > 0 ? 'primary' : 'secondary'}
        startIcon={<PaperPlane />}
        onClick={openDespachoModal}
        disabled={selectedEntries.length === 0}
      >
        Enviar a Despacho
      </Button>
      {renderModal()}
    </div>
  );
};

export default SelectAllButton;