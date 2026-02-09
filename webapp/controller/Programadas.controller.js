sap.ui.define([
    "transener/registrocronologicoeventos/controller/BaseController",
    "sap/ui/core/routing/History",
    "transener/registrocronologicoeventos/utils/ModelHelper",
    "transener/registrocronologicoeventos/utils/Constants",
    "transener/registrocronologicoeventos/services/EquiposService",
    "transener/registrocronologicoeventos/services/CausasService",

], function (BaseController, History, ModelHelper, Constants, EquiposService, CausasServices) {
    "use strict";

    return BaseController.extend("transener.registrocronologicoeventos.controller.Programadas", {

        onInit: function () {
            this.getOwnerComponent().getRouter()
                .getRoute("Programadas")
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
        }

    });
});
