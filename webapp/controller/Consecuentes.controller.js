sap.ui.define([
    "transener/registrocronologicoeventos/controller/BaseController",
    "sap/ui/core/routing/History",
    "transener/registrocronologicoeventos/utils/ModelHelper",
    "transener/registrocronologicoeventos/utils/Constants",
    "transener/registrocronologicoeventos/services/EquiposService",
    "transener/registrocronologicoeventos/services/CausasService",
    "transener/registrocronologicoeventos/services/ConsecuenteServices",
    "transener/registrocronologicoeventos/services/CammesaService",
    "transener/registrocronologicoeventos/utils/Logger",
    "transener/registrocronologicoeventos/utils/ErrorHandler"
], function (BaseController, History, ModelHelper, Constants, EquiposService, CausasServices, ConsecuenteServices, CammesaService, Logger, ErrorHandler) {
    "use strict";

    return BaseController.extend("transener.registrocronologicoeventos.controller.Consecuentes", {
        onInit: function () {
            this.getOwnerComponent().getRouter()
                .getRoute("Consecuentes")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            const oArgs = oEvent.getParameter("arguments") || {};
            const sMode = (oArgs.mode || "edit").toLowerCase();
            const oView = this.getView();

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

            // Resetear el editingIndex al entrar a la vista
            var oFormModel = ModelHelper.getModel("ConsecuentesFormJsonModel", oView);
            if (oFormModel) {
                oFormModel.setProperty("/editingIndex", -1);
            }

            this.getNSInfo();
        },

        getNSInfo: function () {
            var Empresa = ModelHelper.getModel("Empresa", this.getView()).getProperty("/selectedSociety");
            const oNovedad = ModelHelper.getModel("NovedadesFormJsonModel").getData();
            EquiposService.LoadEquipos(oNovedad.Tplnr, Empresa);
            CausasServices.loadModel(oNovedad.CodNovedad, oNovedad.CodMotivo, Empresa);
        },

        onUbicacionChange: function (evt) {
            var oView = this.getView();
            var oFormModel = ModelHelper.getModel("ConsecuentesFormJsonModel", oView);
            oFormModel.setProperty("/Equnr", "");
            var Empresa = ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety");
            var oSelectedItem = evt.getParameter("selectedItem");

            if (oSelectedItem) {
                var sKey = oSelectedItem.getKey();
                ModelHelper.getModel("EquiposModel", oView).setProperty("/busy", true);
                EquiposService.LoadLTEquipos(sKey, Empresa);
            } else {
                sap.m.MessageToast.show("No se seleccionó ninguna ubicación.");
            }
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

        /**
         * Guarda el consecuente del formulario: POST si es nuevo, PUT si es existente.
         * Después de guardar, actualiza la lista local y limpia el formulario.
         */
        onSaveConsecuente: function () {
            var oView = this.getView();
            var oFormModel = ModelHelper.getModel("ConsecuentesFormJsonModel", oView);
            var oListModel = ModelHelper.getModel("ConsequentListJsonModel", oView);
            var oNovedadModel = ModelHelper.getModel("NovedadesFormJsonModel", oView);
            var oNovedad = oNovedadModel.getData();
            var oFormData = oFormModel.getData() || {};
            var oCammesaModel = ModelHelper.getModel("CammesaFormJsonModel", oView);
            var oCammesaData = oCammesaModel.getData() || {};
            var sEmpresa = ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety");

            // Validar equipo
            if (!oFormData.Equnr) {
                sap.m.MessageBox.warning("Debe seleccionar un Equipo.");
                return;
            }

            // Validar que la novedad padre ya esté persistida
            if (!oNovedad.IdNovedad) {
                sap.m.MessageBox.error("Guarde primero la novedad principal antes de guardar consecuentes.");
                return;
            }

            // Armar el item del consecuente (sin datos de Cammesa, van en llamada separada)
            var oItem = {
                IdNovedad: oFormData.IdNovedad || "",
                Empresa: oFormData.Empresa || "",
                Equnr: oFormData.Equnr || "",
                Tplnr: oFormData.Tplnr || "",
                InicioNove: oFormData.EntIndis || null,
                EntIndis: oFormData.EntIndis || null,
                EntDispo: oFormData.EntDispo || null,
                EntServicio: oFormData.EntServicio || null,
                Observ: oFormData.Observ || "",
                CodMotivo: oFormData.CodMotivo || "",
                CodCausa: oFormData.CodCausa || "",
                Vinculadost: oFormData.Vinculadost || false,
                CodNovedad: oNovedad.CodNovedad || "",
                CodTipo: oNovedad.CodTipo || "",
                GenIndisponibilidad: oFormData.GenIndisponibilidad || false,
                Recierre: oFormData.Recierre || false,
                Subindice: oFormData.Subindice || "0",
                Cantidadtorrescaidas: oFormData.Cantidadtorrescaidas || 0
            };

            // Datos de Cammesa para la llamada separada
            var oInformeCammesa = {
                InformaCammesa: oCammesaData.InformaCammesa || false,
                FechaHora: oCammesaData.FechaHora || null,
                Texto: oCammesaData.Texto || "",
                Autoriza: oCammesaData.Autoriza || false
            };

            var iEditingIndex = oFormData.editingIndex;
            var bIsEdit = (iEditingIndex >= 0);
            var that = this;

            sap.ui.core.BusyIndicator.show(0);

            ConsecuenteServices.saveConsecuente(oItem, oNovedad, sEmpresa)
                .then(function (oResult) {
                    // Obtener el IdNovedad del consecuente creado/actualizado
                    var sConsecuenteId = (oResult && oResult.IdNovedad) ? oResult.IdNovedad : oItem.IdNovedad;

                    // POST de InformeCammesa con el Id del consecuente
                    return CammesaService.postCammesa(oInformeCammesa, sConsecuenteId, sEmpresa)
                        .then(function () {
                            return oResult;
                        });
                })
                .then(function (oResult) {
                    sap.ui.core.BusyIndicator.hide();

                    // Actualizar la lista local
                    var aConsecuentes = oListModel.getProperty("/Consequents") || [];

                    // Armar el item para la lista con datos del consecuente + cammesa
                    var oSavedItem = jQuery.extend({}, oItem, oInformeCammesa);
                    if (oResult && oResult.IdNovedad) {
                        oSavedItem.IdNovedad = oResult.IdNovedad;
                        oSavedItem.Empresa = oResult.Empresa || sEmpresa;
                    }

                    if (bIsEdit && iEditingIndex < aConsecuentes.length) {
                        aConsecuentes[iEditingIndex] = oSavedItem;
                    } else {
                        aConsecuentes.push(oSavedItem);
                    }

                    oListModel.setProperty("/Consequents", aConsecuentes);
                    oListModel.refresh(true);

                    // Limpiar formulario y Cammesa
                    that._clearForm(oFormModel, oFormData.Tplnr);

                    sap.m.MessageToast.show(bIsEdit ? "Consecuente actualizado exitosamente" : "Consecuente creado exitosamente");
                    Logger.info("Consecuente guardado", { isEdit: bIsEdit, idNovedad: oResult ? oResult.IdNovedad : "" });
                })
                .catch(function (oError) {
                    sap.ui.core.BusyIndicator.hide();
                    ErrorHandler.handleODataError(oError, bIsEdit ? "actualizar consecuente" : "crear consecuente");
                });
        },

        /**
         * Limpia el formulario manteniendo la ubicación
         */
        _clearForm: function (oFormModel, sTplnr) {
            oFormModel.setData({
                Tplnr: sTplnr || "",
                Equnr: "",
                EntIndis: null,
                EntDispo: null,
                EntServicio: null,
                CodMotivo: "",
                CodCausa: "",
                Observ: "",
                Vinculadost: false,
                GenIndisponibilidad: false,
                Recierre: false,
                IdNovedad: "",
                Empresa: "",
                editingIndex: -1
            });
            // Limpiar datos de Cammesa
            var oCammesaModel = ModelHelper.getModel("CammesaFormJsonModel", this.getView());
            if (oCammesaModel) {
                oCammesaModel.setData({
                    InformaCammesa: false,
                    FechaHora: null,
                    Texto: ""
                });
            }
        },

        /**
         * Obtiene el objeto de la fila clickeada en la tabla
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
         * Carga los datos de la fila en el formulario (solo lectura)
         */
        onSee: function (oEvent) {
            var oRow = this._getRowData(oEvent);
            if (!oRow) { return; }
            this._loadRowIntoForm(oRow.data, -1);
        },

        /**
         * Carga los datos de la fila en el formulario para edición (botón cambia a "Guardar")
         */
        onEditNove: function (oEvent) {
            var oRow = this._getRowData(oEvent);
            if (!oRow) { return; }
            var iIndex = parseInt(oRow.index, 10);
            this._loadRowIntoForm(oRow.data, iIndex);
            sap.m.MessageToast.show("Editando consecuente. Presione 'Guardar' para confirmar los cambios.");
        },

        /**
         * Carga datos de un consecuente en el formulario
         * @param {Object} oData - datos del consecuente
         * @param {number} iEditingIndex - índice en la lista (-1 = solo lectura / nuevo)
         */
        _loadRowIntoForm: function (oData, iEditingIndex) {
            var oView = this.getView();
            var oFormModel = ModelHelper.getModel("ConsecuentesFormJsonModel", oView);

            var Empresa = ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety");
            var sEqunr = oData.Equnr || "";
            var sTplnr = oData.Tplnr || "";
            var sCodMotivo = oData.CodMotivo || "";
            var sCodCausa = oData.CodCausa || "";

            // Reemplazar todo el modelo sin Equnr (se setea después de cargar equipos)
            oFormModel.setData({
                Tplnr: sTplnr,
                Equnr: "",
                InicioNove: oData.InicioNove || null,
                EntIndis: oData.EntIndis || null,
                EntDispo: oData.EntDispo || oData.EntDisp || null,
                EntServicio: oData.EntServicio || null,
                CodMotivo: sCodMotivo,
                CodCausa: "",
                Vinculadost: oData.Vinculadost || oData.VinculadoSinTension || false,
                Observ: oData.Observ || oData.Comment || oData.Comentario || "",
                GenIndisponibilidad: oData.GenIndisponibilidad || false,
                Recierre: oData.Recierre || false,
                IdNovedad: oData.IdNovedad || "",
                Empresa: oData.Empresa || "",
                Subindice: oData.Subindice || "0",
                Cantidadtorrescaidas: oData.Cantidadtorrescaidas || 0,
                editingIndex: iEditingIndex
            });

            // Cargar equipos para la estación y después setear el equipo seleccionado
            if (sTplnr) {
                EquiposService.LoadLTEquipos(sTplnr, Empresa).then(function () {
                    oFormModel.setProperty("/Equnr", sEqunr);
                });
            }

            // Recargar causas para el motivo y después setear la causa
            if (sCodMotivo) {
                var oNovedadModel = ModelHelper.getModel("NovedadesFormJsonModel");
                var sCodNovedad = oNovedadModel.getProperty("/CodNovedad");
                CausasServices.loadModel(sCodNovedad, sCodMotivo, Empresa).then(function () {
                    oFormModel.setProperty("/CodCausa", sCodCausa);
                });
            }

            // Cargar datos de Cammesa de la fila
            var oCammesaModel = ModelHelper.getModel("CammesaFormJsonModel", oView);
            var oCammesaData = {};
            // Los datos pueden venir del InformeCammesaSet expandido o como propiedades planas
            if (oData.InformeCammesaSet && oData.InformeCammesaSet.results && oData.InformeCammesaSet.results.length > 0) {
                var oCammesaRow = oData.InformeCammesaSet.results[0];
                oCammesaData = {
                    InformaCammesa: oCammesaRow.InformaCammesa === "X" || oCammesaRow.InformaCammesa === "S" || oCammesaRow.InformaCammesa === true,
                    FechaHora: oCammesaRow.FechaHora || null,
                    Texto: oCammesaRow.Texto || ""
                };
            } else {
                oCammesaData = {
                    InformaCammesa: oData.InformaCammesa || false,
                    FechaHora: oData.FechaHora || null,
                    Texto: oData.Texto || ""
                };
            }
            oCammesaModel.setData(oCammesaData);

            // Scroll al inicio
            var oPage = this.byId("ConsecuentesPage");
            if (oPage) { oPage.scrollTo(0); }
        },

        /**
         * Elimina el consecuente (del backend si ya estaba persistido, y de la lista local)
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
