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
            const NovedadModel = ModelHelper.getModel("NovedadesFormJsonModel")
            const oNovedad = NovedadModel.getData()
            NovedadModel.setProperty("/CodCausa","")
            CausasServices.loadModel(oNovedad.CodNovedad, oNovedad.CodMotivo, Empresa)
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

            aConsecuentes.push(oNewItem);
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
        }
    });
});
