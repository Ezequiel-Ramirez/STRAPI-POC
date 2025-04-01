import PdfExportButton from "./extensions/components/PdfExportButton";
import SelectAllButton from "./extensions/components/SelectAllButton";
import DespachoList from "./extensions/content-manager/pages/DespachoList";

export default {
  bootstrap(app) {
    // Inyectar SelectAllButton en la vista de lista
    app.injectContentManagerComponent("listView", "actions", {
      name: "SelectAllButton",
      Component: SelectAllButton,
    });

    // Inyectar botón de exportación en la lista de despachos
    app.injectContentManagerComponent("editView", "informations", {
      name: "DespachoList",
      Component: DespachoList,
    });
  },
};
