import SelectAllButton from "./extensions/components/SelectAllButton";

export default {
  bootstrap(app) {
    app.injectContentManagerComponent("listView", "actions", {
      name: "SelectAllButton",
      Component: SelectAllButton,
    });
  },
};