import React from 'react';
import { Button } from "@strapi/design-system";
import { Download } from '@strapi/icons';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable'

const PdfExportButton = ({ entity }) => {
  const handleExport = async () => {
    try {
      const doc = new jsPDF();
      
      // Configuración básica
      doc.setFontSize(16);
      doc.text('Detalle de Despacho', 105, 15, { align: 'center' });
      
      // Información principal
      doc.setFontSize(12);
      const content = [
        ['ID Despacho:', entity.id],
        ['Codigo:', entity.CodigoDespacho],
        ['Carrier:', entity.Carrier],
        ['Link:', entity.Link],
        ['Comentarios:', entity.Comentarios],
        ['Cantidad de Envios:', entity.CantidadEnvios],
        ['Envios:', entity.envios],
        ['Estado:', entity.estado_despacho],
      ];

      // Agregar contenido
      content.forEach((row, index) => {
        doc.text(row[0], 20, 30 + (index * 10));
        doc.text(row[1]?.toString() || '', 70, 30 + (index * 10));
        doc.text(row[2]?.toString() || '', 120, 30 + (index * 10));
        doc.text(row[3]?.toString() || '', 170, 30 + (index * 10));
        doc.text(row[4]?.toString() || '', 220, 30 + (index * 10));
        doc.text(row[5]?.toString() || '', 270, 30 + (index * 10));
        doc.text(row[6]?.toString() || '', 320, 30 + (index * 10));
        doc.text(row[7]?.toString() || '', 370, 30 + (index * 10));
      });

      // Si hay productos o items en el despacho
      if (entity.envios && entity.envios.length > 0) {
        doc.setFontSize(14);
        doc.text('Detalle de Productos', 20, 90);
        
        // Crear tabla de productos
          const tableData = entity.envios.map(item => [
          item.nombre,
          item.cantidad,
          item.precio
        ]);

        autoTable(doc, {
          startY: 100,
          head: [['Producto', 'Cantidad', 'Precio']],
          body: tableData,
        });
      }

      // Agregar pie de página
      const pageCount = doc.internal.pages.length;
      doc.setFontSize(8);
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
      }

      doc.save(`Despacho_${entity.id}.pdf`);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
    }
  };

  return (
    <Button onClick={handleExport} startIcon={<Download />}>
      Exportar PDF
    </Button>
  );
};

export default PdfExportButton;
