sap.ui.define([
    "transener/registrocronologicoeventos/controller/BaseController",
    "sap/ui/core/routing/History",
    "transener/registrocronologicoeventos/utils/ModelHelper",
    "transener/registrocronologicoeventos/utils/Constants",
    "transener/registrocronologicoeventos/services/EquiposService",
    "transener/registrocronologicoeventos/services/CausasService",
    "transener/registrocronologicoeventos/services/ConsecuenteServices",
    "transener/registrocronologicoeventos/utils/Logger",
    "transener/registrocronologicoeventos/utils/ErrorHandler"
], function (BaseController, History, ModelHelper, Constants, EquiposService, CausasServices, ConsecuenteServices, Logger, ErrorHandler) {
    "use strict";

    return BaseController.extend("transener.registrocronologicoeventos.controller.Consecuentes", {
        onInit: function () {
            this.getOwnerComponent().getRouter()
                .getRoute("Consecuentes")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        /**
         * Maneja el evento cuando se navega a la vista Consecuentes
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
            this.getNSInfo();
        },

        getNSInfo: function () {
            var Empresa = ModelHelper.getModel("Empresa", this.getView()).getProperty("/selectedSociety");
            const oNovedad = ModelHelper.getModel("NovedadesFormJsonModel").getData();
            EquiposService.LoadEquipos(oNovedad.Tplnr, Empresa);
            CausasServices.loadModel(oNovedad.CodNovedad, oNovedad.CodMotivo, Empresa);
        },

        onMotivoChange: function () {
            var Empresa = ModelHelper.getModel("Empresa", this.getView()).getProperty("/selectedSociety");
            const oConsecuentesModel = ModelHelper.getModel("ConsecuentesFormJsonModel", this.getView());
            const oNovedadModel = ModelHelper.getModel("NovedadesFormJsonModel");
            const oNovedad = oNovedadModel.getData();
            const sCodMotivo = oConsecuentesModel.getProperty("/CodMotivo");
            oConsecuentesModel.setProperty("/CodCausa", "");
            CausasServices.loadModel(oNovedad.CodNovedad, sCodMotivo, Empresa);
        },

        onAddConsecuente: function () {
            var oView = this.getView();
            var oFormModel = ModelHelper.getModel("ConsecuentesFormJsonModel", oView);
            var oListModel = ModelHelper.getModel("ConsequentListJsonModel", oView);
            var oNovedadModel = ModelHelper.getModel("NovedadesFormJsonModel", oView);
            var oNovedad = oNovedadModel.getData();
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
                EntIndis: oFormData.EntIndis || null,
                FechaFinNove: null,
                EntDispo: oFormData.EntDispo || oFormData.EntDisp || null,
                EntServicio: oFormData.EntServicio || null,
                Observ: oFormData.Observ || oFormData.Texto || "",
                Comentario: oFormData.Comentario || "",
                InformaCammesa: oFormData.InformaCammesa ? "S" : "N",
                CodMotivo: oFormData.CodMotivo || "",
                CodCausa: oFormData.CodCausa || "",
                VinculadoSinTension: oFormData.VinculadoSinTension || false,
                Vinculadost: oFormData.Vinculadost || oFormData.VinculadoSinTension || false,
                // Campos del padre necesarios para el POST
                CodNovedad: oNovedad.CodNovedad || "",
                CodTipo: oNovedad.CodTipo || "",
                Subindice: oFormData.Subindice || "0",
                GenIndisponibilidad: oFormData.GenIndisponibilidad || false,
                Recierre: oFormData.Recierre || false
            };

            if (this._editingIndex != null && this._editingIndex >= 0 && this._editingIndex < aConsecuentes.length) {
                // Preservar IdNovedad y Empresa del item existente para que el save haga PUT
                oNewItem.IdNovedad = aConsecuentes[this._editingIndex].IdNovedad || "";
                oNewItem.Empresa = aConsecuentes[this._editingIndex].Empresa || "";
                aConsecuentes[this._editingIndex] = oNewItem;
                this._editingIndex = null;
            } else {
                // Nuevo consecuente sin IdNovedad (se creará con POST)
                oNewItem.IdNovedad = "";
                oNewItem.Empresa = "";
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
                EntDispo: null,
                CodMotivo: "",
                CodCausa: "",
                Texto: "",
                Comentario: "",
                Observ: "",
                InformaCammesa: false,
                VinculadoSinTension: false,
                Vinculadost: false
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
         * Guarda todos los consecuentes de la lista al backend (POST nuevos, PUT existentes)
         */
        onSaveConsecuentes: function () {
            var oView = this.getView();
            var oNovedadModel = ModelHelper.getModel("NovedadesFormJsonModel", oView);
            var oListModel = ModelHelper.getModel("ConsequentListJsonModel", oView);
            var oNovedad = oNovedadModel.getData();
            var aConsecuentes = oListModel.getProperty("/Consequents") || [];
            var sEmpresa = ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety");

            if (aConsecuentes.length === 0) {
                sap.m.MessageBox.warning("No hay consecuentes para guardar.");
                return;
            }

            if (!oNovedad.IdNovedad) {
                sap.m.MessageBox.error("Guarde primero la novedad principal antes de guardar consecuentes.");
                return;
            }

            sap.ui.core.BusyIndicator.show(0);

            var aPromises = aConsecuentes.map(function (oItem) {
                return ConsecuenteServices.saveConsecuente(oItem, oNovedad, sEmpresa);
            });

            Promise.allSettled(aPromises)
                .then(function (aResults) {
                    sap.ui.core.BusyIndicator.hide();
                    var iOk = 0;
                    var iFailed = 0;
                    aResults.forEach(function (oResult, i) {
                        if (oResult.status === "fulfilled" && oResult.value) {
                            iOk++;
                            // Actualizar IdNovedad y Empresa del item local con lo devuelto por el backend
                            if (oResult.value.IdNovedad) {
                                aConsecuentes[i].IdNovedad = oResult.value.IdNovedad;
                            }
                            if (oResult.value.Empresa) {
                                aConsecuentes[i].Empresa = oResult.value.Empresa;
                            }
                        } else {
                            iFailed++;
                        }
                    });

                    oListModel.setProperty("/Consequents", aConsecuentes);
                    oListModel.refresh(true);

                    if (iFailed === 0) {
                        sap.m.MessageToast.show("Consecuentes guardados exitosamente (" + iOk + ")");
                    } else if (iOk > 0) {
                        sap.m.MessageBox.warning("Se guardaron " + iOk + " consecuentes, pero " + iFailed + " fallaron.");
                    } else {
                        sap.m.MessageBox.error("Error al guardar los consecuentes.");
                    }

                    Logger.info("onSaveConsecuentes resultado", { ok: iOk, failed: iFailed });
                });
        },

        /**
         * Guarda un consecuente individual desde el botón de la fila
         */
        saveChanges: function (oEvent) {
            var oRow = this._getRowData(oEvent);
            if (!oRow) { return; }

            var oView = this.getView();
            var oNovedad = ModelHelper.getModel("NovedadesFormJsonModel", oView).getData();
            var sEmpresa = ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety");
            var oListModel = ModelHelper.getModel("ConsequentListJsonModel", oView);

            if (!oNovedad.IdNovedad) {
                sap.m.MessageBox.error("Guarde primero la novedad principal.");
                return;
            }

            sap.ui.core.BusyIndicator.show(0);
            var iIndex = parseInt(oRow.index, 10);

            ConsecuenteServices.saveConsecuente(oRow.data, oNovedad, sEmpresa)
                .then(function (oResult) {
                    sap.ui.core.BusyIndicator.hide();
                    if (oResult && oResult.IdNovedad) {
                        oListModel.setProperty("/Consequents/" + iIndex + "/IdNovedad", oResult.IdNovedad);
                        oListModel.setProperty("/Consequents/" + iIndex + "/Empresa", oResult.Empresa);
                    }
                    sap.m.MessageToast.show("Consecuente guardado exitosamente");
                })
                .catch(function (oError) {
                    sap.ui.core.BusyIndicator.hide();
                    ErrorHandler.handleODataError(oError, "guardar consecuente");
                });
        },

        /**
         * Elimina el consecuente de la lista (y del backend si ya estaba persistido)
         */
        onDelete: function (oEvent) {
            var oRow = this._getRowData(oEvent);
            if (!oRow) { return; }
            var oView = this.getView();
            var oListModel = ModelHelper.getModel("ConsequentListJsonModel", oView);
            var aConsecuentes = oListModel.getProperty("/Consequents") || [];
            var iIndex = parseInt(oRow.index, 10);
            var oItem = aConsecuentes[iIndex];

            sap.m.MessageBox.confirm("¿Desea eliminar este consecuente?", {
                onClose: function (sAction) {
                    if (sAction === sap.m.MessageBox.Action.OK) {
                        var fnRemoveLocal = function () {
                            aConsecuentes.splice(iIndex, 1);
                            oListModel.setProperty("/Consequents", aConsecuentes);
                            oListModel.refresh(true);
                            sap.m.MessageToast.show("Consecuente eliminado");
                        };

                        if (oItem.IdNovedad) {
                            var sEmpresa = ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety");
                            sap.ui.core.BusyIndicator.show(0);
                            ConsecuenteServices.deleteConsecuente(oItem.IdNovedad, sEmpresa)
                                .then(function () {
                                    sap.ui.core.BusyIndicator.hide();
                                    fnRemoveLocal();
                                })
                                .catch(function (oError) {
                                    sap.ui.core.BusyIndicator.hide();
                                    ErrorHandler.handleODataError(oError, "eliminar consecuente");
                                });
                        } else {
                            fnRemoveLocal();
                        }
                    }
                }
            });
        }
    });
});
