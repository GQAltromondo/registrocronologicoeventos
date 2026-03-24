sap.ui.define([
      "transener/registrocronologicoeventos/controller/BaseController",
    "sap/ui/core/routing/History",
    "transener/registrocronologicoeventos/utils/ModelHelper",
    "transener/registrocronologicoeventos/utils/Constants",
    "transener/registrocronologicoeventos/services/EquiposService",
    "transener/registrocronologicoeventos/services/CausasService",
], function (BaseController, History, ModelHelper, Constants, EquiposService, CausasServices) {
    "use strict";

    return BaseController.extend("transener.registrocronologicoeventos.controller.Consecuentes", {
        onInit: function () {
            this.getOwnerComponent().getRouter()
                .getRoute("Consecuentes")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        /**
         * Maneja el evento cuando se navega a la vista Programadas
         * @param {sap.ui.base.Event} oEvent - Evento de navegación
         * @private
         */
        _onRouteMatched: function (oEvent) {
            const oArgs = oEvent.getParameter("arguments") || {};
            const sMode = (oArgs.mode || "edit").toLowerCase();
            const oView = this.getView();

            // Modo (create/edit/view) para reutilizar la vista
            const oEditModel = sap.ui.getCore().getModel("editModel") || oView.getModel("editModel");
            const oUtilsModel = ModelHelper.getModel("utilsModel", oView);

            if (oEditModel) {
                oEditModel.setProperty("/mode", sMode);
                // Si es modo "view", configurar readOnlyMode en utilsModel
                if (sMode === Constants.EDIT_MODES.VIEW) {
                    oEditModel.setProperty("/editableMode", false);
                    if (oUtilsModel) {
                        oUtilsModel.setProperty("/readOnlyMode", true);
                    }
                } else {
                    oEditModel.setProperty("/editableMode", sMode === Constants.EDIT_MODES.CREATE ? true : oEditModel.getProperty("/editableMode"));
                    if (oUtilsModel) {
                        oUtilsModel.setProperty("/readOnlyMode", false);
                    }
                }
            }
            this.getNSInfo()

        },
        getNSInfo: function () {
            var Empresa = ModelHelper.getModel("Empresa", this.getView()).getProperty("/selectedSociety");
            const oNovedad = ModelHelper.getModel("NovedadesFormJsonModel").getData()
            EquiposService.LoadEquipos(oNovedad.Tplnr, Empresa)
            CausasServices.loadModel(oNovedad.CodNovedad, oNovedad.CodMotivo, Empresa)
        },
        onMotivoChange: function () {
            var Empresa = ModelHelper.getModel("Empresa", this.getView()).getProperty("/selectedSociety");
            const oConsecuentesModel = ModelHelper.getModel("ConsecuentesFormJsonModel", this.getView());
            const oNovedadModel = ModelHelper.getModel("NovedadesFormJsonModel");
            const oNovedad = oNovedadModel.getData();
            const sCodMotivo = oConsecuentesModel.getProperty("/CodMotivo");
            oConsecuentesModel.setProperty("/CodCausa", "");
            CausasServices.loadModel(oNovedad.CodNovedad, sCodMotivo, Empresa)
        },

        onAddConsecuente: function () {
            var oView = this.getView();
            var oFormModel = ModelHelper.getModel("ConsecuentesFormJsonModel", oView);
            var oListModel = ModelHelper.getModel("ConsequentListJsonModel", oView);
            var oFormData = oFormModel.getData() || {};

            if (!oFormData.Equnr) {
                sap.m.MessageBox.warning("Debe seleccionar un Equipo.");
                return;
            }

            var aConsecuentes = oListModel.getProperty("/Consequents") || [];

            var oNewItem = {
                Equnr: oFormData.Equnr || "",
                Tplnr: oFormData.Tplnr || "",
                InicioNove: oFormData.EntIndis || null,
                EntIndisp: oFormData.EntIndis || null,
                FechaFinNove: null,
                EntDisp: oFormData.EntDisp || null,
                Comment: oFormData.Texto || "",
                Comentario: oFormData.Comentario || "",
                InformaCammesa: oFormData.InformaCammesa ? "S" : "N",
                CodMotivo: oFormData.CodMotivo || "",
                CodCausa: oFormData.CodCausa || "",
                VinculadoSinTension: oFormData.VinculadoSinTension || false
            };

            if (this._editingIndex != null && this._editingIndex >= 0 && this._editingIndex < aConsecuentes.length) {
                // Actualizar consecuente existente
                aConsecuentes[this._editingIndex] = oNewItem;
                this._editingIndex = null;
            } else {
                // Agregar nuevo consecuente
                aConsecuentes.push(oNewItem);
            }
            oListModel.setProperty("/Consequents", aConsecuentes);
            oListModel.refresh(true);

            // Limpiar el formulario manteniendo ubicación y referencia
            var sTplnr = oFormData.Tplnr;
            oFormModel.setData({
                Tplnr: sTplnr,
                Equnr: "",
                EntIndis: null,
                EntDisp: null,
                CodMotivo: "",
                CodCausa: "",
                Texto: "",
                Comentario: "",
                InformaCammesa: false,
                VinculadoSinTension: false
            });

            sap.m.MessageToast.show("Consecuente agregado a la lista");
        },

        /**
         * Obtiene el objeto de la fila clickeada en la tabla de consecuentes
         */
        _getRowData: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("ConsequentListJsonModel");
            if (!oCtx) {
                return null;
            }
            return {
                data: oCtx.getObject(),
                index: oCtx.getPath().split("/").pop()
            };
        },

        /**
         * Carga los datos de la fila seleccionada en el formulario superior (solo lectura)
         */
        onSee: function (oEvent) {
            var oRow = this._getRowData(oEvent);
            if (!oRow) { return; }
            this._loadRowIntoForm(oRow.data);
            this._editingIndex = null;
        },

        /**
         * Carga los datos de la fila seleccionada en el formulario superior para edición
         */
        onEditNove: function (oEvent) {
            var oRow = this._getRowData(oEvent);
            if (!oRow) { return; }
            this._loadRowIntoForm(oRow.data);
            this._editingIndex = parseInt(oRow.index, 10);
            sap.m.MessageToast.show("Editando consecuente. Presione 'Agregar' para guardar los cambios.");
        },

        /**
         * Carga datos de un consecuente existente en el formulario superior
         */
        _loadRowIntoForm: function (oData) {
            var oView = this.getView();
            var oFormModel = ModelHelper.getModel("ConsecuentesFormJsonModel", oView);
            oFormModel.setProperty("/Tplnr", oData.Tplnr || "");
            oFormModel.setProperty("/Equnr", oData.Equnr || "");
            oFormModel.setProperty("/EntIndis", oData.EntIndis || oData.InicioNove || null);
            oFormModel.setProperty("/EntDispo", oData.EntDispo || oData.EntDisp || null);
            oFormModel.setProperty("/CodMotivo", oData.CodMotivo || "");
            oFormModel.setProperty("/CodCausa", oData.CodCausa || "");
            oFormModel.setProperty("/Vinculadost", oData.Vinculadost || oData.VinculadoSinTension || false);
            oFormModel.setProperty("/Observ", oData.Observ || oData.Comment || oData.Comentario || "");

            // Scroll al inicio de la página
            var oPage = this.byId("ConsecuentesPage");
            if (oPage) { oPage.scrollTo(0); }
        },

        /**
         * Elimina el consecuente de la lista
         */
        onDelete: function (oEvent) {
            var oRow = this._getRowData(oEvent);
            if (!oRow) { return; }
            var oView = this.getView();
            var oListModel = ModelHelper.getModel("ConsequentListJsonModel", oView);
            var aConsecuentes = oListModel.getProperty("/Consequents") || [];
            var iIndex = parseInt(oRow.index, 10);

            sap.m.MessageBox.confirm("¿Desea eliminar este consecuente?", {
                onClose: function (sAction) {
                    if (sAction === sap.m.MessageBox.Action.OK) {
                        aConsecuentes.splice(iIndex, 1);
                        oListModel.setProperty("/Consequents", aConsecuentes);
                        oListModel.refresh(true);
                        sap.m.MessageToast.show("Consecuente eliminado");
                    }
                }
            });
        }
    });
});
