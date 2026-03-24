sap.ui.define([
      "transener/registrocronologicoeventos/controller/BaseController",
    "sap/ui/core/routing/History",
    "transener/registrocronologicoeventos/utils/ModelHelper",
    "transener/registrocronologicoeventos/utils/Constants",
    "transener/registrocronologicoeventos/services/EquiposService",
    "transener/registrocronologicoeventos/services/CausasService",
    "transener/registrocronologicoeventos/services/oDataServices",
    "transener/registrocronologicoeventos/utils/Logger",
    "transener/registrocronologicoeventos/utils/ErrorHandler",
], function (BaseController, History, ModelHelper, Constants, EquiposService, CausasServices, oDataServices, Logger, ErrorHandler) {
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
            oFormModel.setProperty("/Vinculadost", oData.Vinculadost || oData.VinculadoSinTension || false);
            oFormModel.setProperty("/Observ", oData.Observ || oData.Comment || oData.Comentario || "");

            // Recargar causas para el motivo del consecuente y luego setear CodCausa
            var sCodMotivo = oData.CodMotivo || "";
            var sCodCausa = oData.CodCausa || "";
            if (sCodMotivo) {
                var Empresa = ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety");
                var oNovedadModel = ModelHelper.getModel("NovedadesFormJsonModel");
                var sCodNovedad = oNovedadModel.getProperty("/CodNovedad");
                CausasServices.loadModel(sCodNovedad, sCodMotivo, Empresa);
            }
            oFormModel.setProperty("/CodCausa", sCodCausa);

            // Scroll al inicio de la página
            var oPage = this.byId("ConsecuentesPage");
            if (oPage) { oPage.scrollTo(0); }
        },

        /**
         * Elimina el consecuente de la lista
         */
        onSaveConsecuentes: function () {
            var oView = this.getView();
            var oNovedadModel = ModelHelper.getModel("NovedadesFormJsonModel", oView);
            var oListModel = ModelHelper.getModel("ConsequentListJsonModel", oView);
            var oNovedad = oNovedadModel.getData();
            var aConsecuentes = oListModel.getProperty("/Consequents") || [];

            if (aConsecuentes.length === 0) {
                sap.m.MessageBox.warning("No hay consecuentes para guardar.");
                return;
            }

            // Validar que la novedad tenga metadata para hacer el PUT
            var sUri = oNovedad.__metadata && (oNovedad.__metadata.uri || oNovedad.__metadata.id);
            if (!sUri) {
                sap.m.MessageBox.error("No se puede guardar: la novedad no tiene referencia al servidor. Guarde primero la novedad principal.");
                return;
            }

            var oModel = oDataServices.getModel("");

            // Construir path relativo
            var sServiceUrl = (oModel.sServiceUrl || "").replace(/\/$/, "");
            var oMetaUrl = new URL(sUri, window.location.origin);
            var oServUrl = new URL(sServiceUrl, window.location.origin);
            var sServPath = oServUrl.pathname.replace(/\/$/, "");
            var sMetaPath = oMetaUrl.pathname;
            var sPath;
            if (sMetaPath.startsWith(sServPath + "/")) {
                sPath = sMetaPath.substring(sServPath.length);
            } else {
                var m = sMetaPath.match(/\/NovedadesServicioSet\(.*\)$/);
                sPath = m ? m[0] : sMetaPath;
            }

            // Armar payload: novedad con ConsecuentesSet
            var oPayload = jQuery.extend(true, {}, oNovedad);
            // Limpiar navigation properties que no son consecuentes
            delete oPayload.InformeCammesaSet;
            delete oPayload.ComentariosSet;
            delete oPayload.ENSRegXNS_NAV;
            delete oPayload.SenialXNS_nav;
            delete oPayload.PruebasXNS_nav;

            // Incluir los consecuentes actuales
            oPayload.ConsecuentesSet = aConsecuentes.map(function (oItem) {
                return {
                    Empresa: oNovedad.Empresa || "",
                    IdNovedad: oNovedad.IdNovedad || "",
                    Equnr: oItem.Equnr || "",
                    Tplnr: oItem.Tplnr || "",
                    CodMotivo: oItem.CodMotivo || "",
                    CodCausa: oItem.CodCausa || "",
                    InicioNove: oItem.InicioNove || null,
                    EntIndis: oItem.EntIndis || oItem.EntIndisp || null,
                    EntDispo: oItem.EntDispo || oItem.EntDisp || null,
                    EntServicio: oItem.EntServicio || null,
                    Observ: oItem.Observ || oItem.Comment || oItem.Comentario || "",
                    Vinculadost: oItem.Vinculadost || oItem.VinculadoSinTension || false,
                    GenIndisponibilidad: oItem.GenIndisponibilidad || false,
                    Recierre: oItem.Recierre || false,
                    Consecuente: oItem.Consecuente || "",
                    CodNovedad: oItem.CodNovedad || oNovedad.CodNovedad || "",
                    CodTipo: oItem.CodTipo || oNovedad.CodTipo || "",
                    Referencia: oItem.Referencia || "",
                    CodWeather: oItem.CodWeather || "",
                    CodDispAct: oItem.CodDispAct || "",
                    CodAreaResp: oItem.CodAreaResp || "",
                    Subindice: oItem.Subindice || "0",
                    Cantidadtorrescaidas: oItem.Cantidadtorrescaidas || 0
                };
            });

            oPayload.Cantidadtorrescaidas = oPayload.Cantidadtorrescaidas || 0;
            oPayload.Subindice = String(oPayload.Subindice);

            sap.ui.core.BusyIndicator.show(0);
            oModel.update(sPath, oPayload, {
                success: function () {
                    sap.ui.core.BusyIndicator.hide();
                    Logger.info("Consecuentes guardados exitosamente");
                    sap.m.MessageToast.show("Consecuentes guardados exitosamente");
                },
                error: function (oError) {
                    sap.ui.core.BusyIndicator.hide();
                    Logger.error("Error al guardar consecuentes", oError);
                    ErrorHandler.handleODataError(oError, "guardar consecuentes");
                }
            });
        },

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
