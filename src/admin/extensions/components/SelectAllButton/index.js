/** @jsx React.createElement */
import React, { useState } from "react";
import { Button, Typography } from "@strapi/design-system";
import { Boolean, PaperPlane } from "@strapi/icons";
import { useLocation } from "react-router-dom";
import { useNotification } from '@strapi/helper-plugin';
import axios from 'axios';

const SelectAllButton = () => {
  const toggleNotification = useNotification();
  const location = useLocation();
  const isEnvioView = /\/content-manager\/collection-types\/api::envio\.envio/.test(location.pathname);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [areAllSelected, setAreAllSelected] = useState(false);
  const [totalEntries, setTotalEntries] = useState(0);

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
      // Hacer una llamada a la API para obtener todas las entradas
      const response = await axios.get('/api/envios');
      const allEntries = response.data.data;

      // Actualizar el estado local con los IDs seleccionados
      setSelectedEntries(allEntries);
      // Simular la selección en el Content Manager
      simulateSelection(true);
      setAreAllSelected(true);
      setTotalEntries(allEntries.length);

      toggleNotification({
        type: 'success',
        message: 'Todas las entradas seleccionadas',
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