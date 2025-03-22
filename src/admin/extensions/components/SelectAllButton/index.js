/** @jsx React.createElement */
import React, { useState } from "react";
import { Button, Typography } from "@strapi/design-system";
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
            console.log('Filtros aplicados:', filters);
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
        
        console.log('URL de consulta:', `/api/envios?${params.toString()}`);
        
        // Hacer una llamada a la API para obtener todas las entradas con los filtros aplicados
        const response = await axios.get(`/api/envios?${params.toString()}`);
        console.log('response', response);
        const allEntries = response.data.data || [];
        console.log('allEntries', allEntries);
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

  
  
  const handleEnviarADespacho = async () => {
    if (selectedEntries.length === 0) {
      toggleNotification({
        type: 'warning',
        message: 'No hay entradas seleccionadas.',
      });
      return;
    }

    try {
      // Enviar cada entrada seleccionada a la API de despacho
      for (const entry of selectedEntries) {
        const response = await axios.post('/api/dispatches', { data: entry }); 
        console.log('response', response);
      }

        toggleNotification({
        type: 'success',
        message: 'Entradas enviadas a despacho correctamente.',
      });
    } catch (error) {
      console.error('Error al enviar a despacho:', error);
      toggleNotification({
        type: 'warning',
        message: 'Hubo un error al enviar las entradas a despacho.',
      });
    }
  };

  return (
    <div style={{ display: 'flex', gap: '10px', marginLeft: '10px', alignItems: 'center' }}>
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
        onClick={handleEnviarADespacho}
        disabled={selectedEntries.length === 0}
      >
        Enviar a Despacho
      </Button>
      {/* Contador de selección */}
      <Typography variant="pi" style={{ marginLeft: '10px' }}>
        {selectedEntries.length} de {totalEntries} seleccionados
      </Typography>
    </div>
  );
};


export default SelectAllButton;