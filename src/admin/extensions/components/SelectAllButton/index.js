/** @jsx React.createElement */
import React, { useState, useEffect } from "react";
import { 
  Button, 
  Typography, 
  ModalLayout, 
  ModalBody, 
  ModalHeader, 
  ModalFooter,
  RadioGroup,
  Radio,
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
  const cmEditViewDataManager = useCMEditViewDataManager();
  
  // Estado para el modal y selección de despacho
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [despachoList, setDespachoList] = useState([]);
  const [selectedDespacho, setSelectedDespacho] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isEnvioView) {
    return null;
  }
  
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
        // Si ya están seleccionadas, deseleccionar todas
        setSelectedEntries([]);
        simulateSelection(false); // Desmarcar todos los checkboxes
        setAreAllSelected(false);
      } else {
        // Extraer los filtros actuales del query
        // @ts-ignore - Ignoramos el chequeo de tipos para acceder a propiedades dinámicas
        const filtersStr = query && query['filters'];
        // @ts-ignore
        const sortValue = query && query['sort'];
        // @ts-ignore
        const pageValue = query && query['page'];
        
        // Determinar si el filtro ya es un objeto o un string JSON
        let filters;
        if (filtersStr) {
          try {
            // Intentar analizar como JSON si es una cadena
            filters = typeof filtersStr === 'string' ? JSON.parse(filtersStr) : filtersStr;
          } catch (e) {
            console.error('Error al analizar filtros:', e);
            filters = undefined;
          }
        }
        
        const sort = sortValue || undefined;
        const pagination = {
          page: pageValue || 1,
          pageSize: 100 // Usar un valor grande para obtener más resultados
        };
        
        // Construir los parámetros de consulta
        const params = new URLSearchParams();
        
        if (filters) {
          try {
            // Procesar los filtros de forma dinámica para cualquier campo
            // En lugar de usar un objeto JSON completo, convertimos cada filtro a formato query param
            function buildFilterParams(filterObject, prefix = 'filters') {
              for (const key in filterObject) {
                const value = filterObject[key];
                if (value !== null && typeof value === 'object') {
                  // Si es un array como $and o $or
                  if (Array.isArray(value)) {
                    value.forEach((item, index) => {
                      buildFilterParams(item, `${prefix}[${key}][${index}]`);
                    });
                  } else {
                    // Si es un objeto anidado (otro filtro o operador)
                    buildFilterParams(value, `${prefix}[${key}]`);
                  }
                } else {
                  // Si es un valor simple
                  params.append(`${prefix}[${key}]`, String(value));
                }
              }
            }
            
            // Aplicar la función recursiva para construir los parámetros
            buildFilterParams(filters);
            
          } catch (e) {
            console.error('Error al procesar filtros:', e);
            // Si hay un error, no enviamos filtros
          }
        }

        if (sort) {
          params.append('sort', sort);
        }
        
        // Usar solo un tipo de paginación (basada en 'page')
        params.append('pagination[page]', String(pagination.page));
        params.append('pagination[pageSize]', String(pagination.pageSize));
        
        // Añadir parámetros de populate para cargar las relaciones
        params.append('populate[Estado][populate]', '*');
        params.append('populate[tracking_number][populate]', '*');
        params.append('populate[Carrier][populate]', '*');
        
        // Hacer una llamada a la API para obtener todas las entradas con los filtros aplicados
        const response = await axios.get(`/api/envios?${params.toString()}`);
        const allEntries = response.data.data || [];
        // Actualizar el estado local con los IDs seleccionados
        setSelectedEntries(allEntries);
        // Simular la selección en el Content Manager
        simulateSelection(true);
        setAreAllSelected(true);
        setTotalEntries(allEntries.length);

        toggleNotification({
          type: 'success',
          message: `${allEntries.length} entradas seleccionadas según los filtros actuales`,
        });
      }
    } catch (error) {
      console.error('Error al obtener las entradas:', error);
      toggleNotification({
        type: 'warning',
        message: 'Error al obtener las entradas',
      });
    }
  };

  // Función para cargar la lista de despachos
  const loadDespachoList = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/despacho-list?populate=*');
      
      // Extraer la lista de despachos del objeto response.data.data.attributes.Despacho
      const despachos = response.data?.data?.attributes?.Despacho || [];
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
      
      
      // Enviar cada entrada seleccionada a la API de despacho con el despacho seleccionado
      for (const entry of selectedEntries) {
        const response = await axios.post('/api/dispatches', { 
          data: {
            envio: entry.id,
            despacho: {
              id: despachoSeleccionado.id,
              IDDespacho: despachoSeleccionado.IDDespacho,
              CodigoDespacho: despachoSeleccionado.CodigoDespacho
            }
          }
        }); 
      }

      toggleNotification({
        type: 'success',
        message: `${selectedEntries.length} entradas enviadas a despacho ${despachoSeleccionado.IDDespacho} correctamente.`,
      });
      
      // Cerrar el modal y limpiar la selección
      setIsModalVisible(false);
      setSelectedDespacho(null);
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