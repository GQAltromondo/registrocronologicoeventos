sap.ui.define([
    "transener/registrocronologicoeventos/controller/BaseController",
    "transener/registrocronologicoeventos/utils/formatter",
    "sap/ui/core/routing/History",
    "transener/registrocronologicoeventos/utils/ModelHelper",
    "transener/registrocronologicoeventos/utils/Constants",
    "transener/registrocronologicoeventos/services/EquiposService",
    "transener/registrocronologicoeventos/services/CausasService",
    "transener/registrocronologicoeventos/services/NovedadesService",
    "transener/registrocronologicoeventos/utils/Logger",
    "transener/registrocronologicoeventos/services/NormalizacionService",
    "transener/registrocronologicoeventos/services/CammesaService",
    "transener/registrocronologicoeventos/services/IndisponibilidadesService"
], function (BaseController, formatter, History, ModelHelper, Constants, EquiposService, CausasServices, NovedadesService, Logger, NormalizacionService, CammesaService, IndisponibilidadesService) {
    "use strict";

    return BaseController.extend("transener.registrocronologicoeventos.controller.Programadas", {
        formatter: formatter,

        onInit: function () {
            this.getOwnerComponent().getRouter()
                .getRoute("Programadas")
                .attachPatternMatched(this._onRouteMatched, this);

            var oView = this.getView();

            // Inicializar modelo NormalizacionNS
            var oNormModel = ModelHelper.getModel("NormalizacionNS", oView);
            if (!oNormModel.getData() || !oNormModel.getData().EnergizoDesde) {
                oNormModel.setData({
                    EnergizoDesde: "",
                    EnergizoFecha: null,
                    CargoDesde: "",
                    CargoFecha: null,
                    Comentarios: "",
                    InformaEmpresa: "",
                    InformaEmpComentarios: ""
                });
            }

            // Inicializar modelo InformaCammesa
            var oInformaCammesaModel = ModelHelper.getModel("InformaCammesa", oView);
            if (!oInformaCammesaModel.getData() || !oInformaCammesaModel.getData().hasOwnProperty("InformaCammesa")) {
                oInformaCammesaModel.setData({
                    Texto: "",
                    InformaCammesa: false
                });
            }

            // Inicializar modelo ConsequentListJsonModel
            ModelHelper.getModel("ConsequentListJsonModel", oView);

            // Inicializar modelo Indisponibilidades
            var oIndispListModel = ModelHelper.getModel("IndisponibilidadesModel", oView);
            if (!oIndispListModel.getData() || !oIndispListModel.getData().hasOwnProperty("Indisponibilidades")) {
                oIndispListModel.setData({ Indisponibilidades: [] });
            }

            // Inicializar modelo IndispFormModel (formulario de edicion de indisponibilidad)
            var oIndispFormModel = ModelHelper.getModel("IndispFormModel", oView);
            if (!oIndispFormModel.getData() || !oIndispFormModel.getData().hasOwnProperty("ComentarioIndis")) {
                oIndispFormModel.setData({
                    ComentarioIndis: "",
                    Comentarios: "",
                    ComentarioCammesa: "",
                    InformaCammesa: false
                });
            }
            this._iEditingIndisponibilidadIndex = -1;
        },

        _onRouteMatched: function (oEvent) {
            const oArgs = oEvent.getParameter("arguments") || {};
            const sMode = (oArgs.mode || "edit").toLowerCase();
            const sIdNovedad = oArgs.idNovedad || "";
            const sEmpresa = oArgs.empresa || "";
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

            // Resetear modelo InformaCammesa
            ModelHelper.getModel("InformaCammesa", oView).setData({
                Texto: "",
                InformaCammesa: false
            });

            // Reset Indisponibilidades
            this._iEditingIndisponibilidadIndex = -1;
            ModelHelper.getModel("IndisponibilidadesModel", oView).setData({ Indisponibilidades: [] });
            ModelHelper.getModel("IndispFormModel", oView).setData({
                ComentarioIndis: "",
                Comentarios: "",
                ComentarioCammesa: "",
                InformaCammesa: false
            });

            // Guardar referencia de la novedad para saber si esta persistida
            this._sIdNovedad = (sIdNovedad && sIdNovedad !== "new") ? sIdNovedad : "";
            this._sEmpresa = sEmpresa || "";
            this._bNormalizacionExists = false;

            if (this._sIdNovedad && sEmpresa) {
                this._loadNovedadFromRoute(this._sIdNovedad, sEmpresa);
            } else {
                this.getNSInfo();
            }
        },

        _loadNovedadFromRoute: function (sIdNovedad, sEmpresa) {
            var oView = this.getView();
            var that = this;

            var oUtilsModel = ModelHelper.getModel("utilsModel", oView);
            if (oUtilsModel) {
                oUtilsModel.setProperty("/Empresa", sEmpresa);
            }

            sap.ui.core.BusyIndicator.show(0);

            NovedadesService.findNovedad([], sIdNovedad)
                .then(function (oData) {
                    sap.ui.core.BusyIndicator.hide();

                    if (!oData || !oData.IdNovedad) {
                        sap.m.MessageBox.error("No se encontro la novedad " + sIdNovedad);
                        return;
                    }

                    // Mapear campos
                    if (!oData.CodNovedad && (oData.Tiponovedad || oData.TipoNovedad)) {
                        oData.CodNovedad = oData.Tiponovedad || oData.TipoNovedad;
                    }
                    if (!oData.Equnr && oData.Equipo) {
                        oData.Equnr = oData.Equipo;
                    }

                    // Novedad padre
                    ModelHelper.getModel("NovedadesFormJsonModel", oView).setData(oData);

                    // ConsecuentesSet
                    if (oData.ConsecuentesSet && oData.ConsecuentesSet.results) {
                        ModelHelper.getModel("ConsequentListJsonModel", oView).setData({
                            Consequents: oData.ConsecuentesSet.results
                        });
                    }

                    // Normalizacion_nav
                    if (oData.Normalizacion_nav && oData.Normalizacion_nav.IdNovedad) {
                        ModelHelper.getModel("NormalizacionNS", oView).setData(oData.Normalizacion_nav);
                        that._bNormalizacionExists = true;
                    } else {
                        that._bNormalizacionExists = false;
                    }

                    // InformeCammesaSet
                    if (oData.InformeCammesaSet && oData.InformeCammesaSet.results && oData.InformeCammesaSet.results.length > 0) {
                        var oCammesa = oData.InformeCammesaSet.results[0];
                        oCammesa.InformaCammesa = oCammesa.InformaCammesa === "S" || oCammesa.InformaCammesa === "X";
                        ModelHelper.getModel("InformaCammesa", oView).setData(oCammesa);
                    }

                    // ComentariosSet
                    if (oData.ComentariosSet && oData.ComentariosSet.results && oData.ComentariosSet.results.length > 0) {
                        ModelHelper.getModel("CommentsFormJsonModel", oView).setData(oData.ComentariosSet.results[0]);
                    }

                    // Indisponibilidades_nav
                    if (oData.Indisponibilidades_nav && oData.Indisponibilidades_nav.results && oData.Indisponibilidades_nav.results.length > 0) {
                        ModelHelper.getModel("IndisponibilidadesModel", oView).setData({
                            Indisponibilidades: oData.Indisponibilidades_nav.results.map(function (oItem) {
                                oItem.InformaCammesa = oItem.InformaCammesa === "S" || oItem.InformaCammesa === "X" || oItem.InformaCammesa === true;
                                oItem._formData = jQuery.extend({}, oItem);
                                return oItem;
                            })
                        });
                    }

                    // Cargar equipos y causas
                    that.getNSInfo();
                })
                .catch(function (oError) {
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.error("Error al cargar la novedad " + sIdNovedad);
                    Logger.error("Error en _loadNovedadFromRoute", oError);
                });
        },

        getNSInfo: function () {
            var Empresa = ModelHelper.getModel("Empresa", this.getView()).getProperty("/selectedSociety");
            const oNovedad = ModelHelper.getModel("NovedadesFormJsonModel").getData();
            EquiposService.LoadEquipos(oNovedad.Tplnr, Empresa);
            CausasServices.loadModel(oNovedad.CodNovedad, oNovedad.CodMotivo, Empresa);
        },

        onMotivoChange: function () {
            var Empresa = ModelHelper.getModel("Empresa", this.getView()).getProperty("/selectedSociety");
            const NovedadModel = ModelHelper.getModel("NovedadesFormJsonModel");
            const oNovedad = NovedadModel.getData();
            NovedadModel.setProperty("/CodCausa", "");
            CausasServices.loadModel(oNovedad.CodNovedad, oNovedad.CodMotivo, Empresa);
        },

        // ==================== Indisponibilidades CRUD ====================

        _setIndisponibilidadButtonMode: function (sMode) {
            var oBtn = this.byId("btnAddIndisponibilidad");
            if (!oBtn) { return; }
            if (sMode === "save") {
                oBtn.setIcon("sap-icon://save");
                oBtn.setTooltip("Guardar indisponibilidad");
            } else {
                oBtn.setIcon("sap-icon://add");
                oBtn.setTooltip("Agregar indisponibilidad");
            }
        },

        _readIndisponibilidadFromForm: function () {
            var oView = this.getView();
            var oNovedadData = ModelHelper.getModel("NovedadesFormJsonModel", oView).getData();
            var oFormData = ModelHelper.getModel("IndispFormModel", oView).getData();
            return {
                IndispFecha: oNovedadData.InicioNove || null,
                DispoFecha: oNovedadData.FinNov || null,
                CodCausa: oNovedadData.CodCausa || "",
                CodMotivo: oNovedadData.CodMotivo || "",
                ComentarioIndis: oFormData.ComentarioIndis || "",
                Comentarios: oFormData.Comentarios || "",
                InformaCammesa: oFormData.InformaCammesa || false,
                ComentarioCammesa: oFormData.ComentarioCammesa || ""
            };
        },

        _loadIndisponibilidadToForm: function (oRow) {
            var oView = this.getView();
            var oNovedadModel = ModelHelper.getModel("NovedadesFormJsonModel", oView);
            var oFormModel = ModelHelper.getModel("IndispFormModel", oView);
            oNovedadModel.setProperty("/InicioNove", oRow.IndispFecha);
            oNovedadModel.setProperty("/FinNov", oRow.DispoFecha);
            if (oRow.CodCausa) { oNovedadModel.setProperty("/CodCausa", oRow.CodCausa); }
            if (oRow.CodMotivo) { oNovedadModel.setProperty("/CodMotivo", oRow.CodMotivo); }
            oFormModel.setData({
                ComentarioIndis: oRow.ComentarioIndis || "",
                Comentarios: oRow.Comentarios || "",
                ComentarioCammesa: oRow.ComentarioCammesa || "",
                InformaCammesa: oRow.InformaCammesa || false
            });
        },

        onAddIndisponibilidad: function () {
            var oView = this.getView();
            var oNewItem = this._readIndisponibilidadFromForm();
            var oListModel = ModelHelper.getModel("IndisponibilidadesModel", oView);
            var aItems = oListModel.getProperty("/Indisponibilidades") || [];
            var sEmpresa = ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety") || "";

            if (this._iEditingIndisponibilidadIndex >= 0) {
                var iIdx = this._iEditingIndisponibilidadIndex;
                var oOldItem = aItems[iIdx];
                oNewItem.Posicion = oOldItem.Posicion;
                aItems[iIdx] = oNewItem;
                oListModel.setProperty("/Indisponibilidades", aItems);

                if (this._sIdNovedad && oOldItem.Posicion) {
                    IndisponibilidadesService.upsert(jQuery.extend({}, oNewItem), this._sIdNovedad, sEmpresa)
                        .catch(function (err) {
                            Logger.error("Error al actualizar indisponibilidad", err);
                            sap.m.MessageToast.show("Error al actualizar indisponibilidad");
                        });
                }

                this._iEditingIndisponibilidadIndex = -1;
                this._setIndisponibilidadButtonMode("add");
            } else {
                var iMaxPos = 0;
                aItems.forEach(function (o) {
                    var iPos = parseInt(o.Posicion, 10) || 0;
                    if (iPos > iMaxPos) { iMaxPos = iPos; }
                });
                oNewItem.Posicion = (iMaxPos + 1).toString();
                aItems.push(oNewItem);
                oListModel.setProperty("/Indisponibilidades", aItems);

                if (this._sIdNovedad) {
                    IndisponibilidadesService.create(jQuery.extend({}, oNewItem), this._sIdNovedad, sEmpresa)
                        .catch(function (err) {
                            Logger.error("Error al crear indisponibilidad", err);
                            sap.m.MessageToast.show("Error al crear indisponibilidad");
                        });
                }
            }
        },

        onEditIndisponibilidad: function (oEvent) {
            if (this._iEditingIndisponibilidadIndex >= 0) {
                sap.m.MessageToast.show("Ya hay una indisponibilidad en edicion");
                return;
            }

            var oCtx = oEvent.getSource().getBindingContext("IndisponibilidadesModel");
            var sPath = oCtx.getPath();
            var iIndex = parseInt(sPath.split("/").pop(), 10);
            var oRow = ModelHelper.getModel("IndisponibilidadesModel", this.getView()).getProperty(sPath);

            this._loadIndisponibilidadToForm(oRow);
            this._iEditingIndisponibilidadIndex = iIndex;
            this._setIndisponibilidadButtonMode("save");
        },

        onDeleteIndisponibilidad: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("IndisponibilidadesModel");
            var sPath = oCtx.getPath();
            var iIndex = parseInt(sPath.split("/").pop(), 10);
            var oView = this.getView();
            var oListModel = ModelHelper.getModel("IndisponibilidadesModel", oView);
            var aItems = oListModel.getProperty("/Indisponibilidades") || [];
            var oRow = aItems[iIndex];
            var sEmpresa = ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety") || "";
            var that = this;

            if (this._iEditingIndisponibilidadIndex === iIndex) {
                sap.m.MessageToast.show("No se puede eliminar una fila en edicion");
                return;
            }

            var fnRemoveLocal = function () {
                aItems.splice(iIndex, 1);
                oListModel.setProperty("/Indisponibilidades", aItems);
                if (that._iEditingIndisponibilidadIndex > iIndex) {
                    that._iEditingIndisponibilidadIndex--;
                }
            };

            if (this._sIdNovedad && oRow.Posicion) {
                IndisponibilidadesService.remove({
                    Empresa: sEmpresa,
                    Posicion: oRow.Posicion,
                    IdNovedad: this._sIdNovedad
                }).then(function () {
                    fnRemoveLocal();
                }).catch(function (err) {
                    Logger.error("Error al eliminar indisponibilidad", err);
                    sap.m.MessageToast.show("Error al eliminar indisponibilidad");
                });
            } else {
                fnRemoveLocal();
            }
        },

        // ==================== Fin Indisponibilidades ====================

        _onAfterSaveSuccess: function (oNovedadData) {
            var oView = this.getView();
            var sIdNovedad = oNovedadData.IdNovedad || ModelHelper.getModel("NovedadesFormJsonModel", oView).getData().IdNovedad;
            var sEmpresa = ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety") || "";
            var aPromises = [];

            // Guardar InformaCammesa
            var oCammesaData = ModelHelper.getModel("InformaCammesa", oView).getData();
            if (oCammesaData) {
                aPromises.push(CammesaService.postCammesa(oCammesaData, sIdNovedad, sEmpresa));
            }

            // Guardar Normalización
            var oNormData = ModelHelper.getModel("NormalizacionNS", oView).getData();
            if (oNormData) {
                var bNormExists = !!this._bNormalizacionExists;
                aPromises.push(NormalizacionService.saveNormalizacion(oNormData, sIdNovedad, sEmpresa, bNormExists));
            }

            // Guardar Indisponibilidades
            aPromises.push(IndisponibilidadesService.saveAllIndisponibilidades(sIdNovedad, sEmpresa));

            if (aPromises.length === 0) {
                return Promise.resolve();
            }

            return Promise.all(aPromises)
                .then(function () {
                    Logger.info("Registros secundarios guardados correctamente");
                })
                .catch(function (err) {
                    Logger.error("Error guardando registros secundarios", err);
                    sap.m.MessageBox.warning("La novedad se guardó pero hubo errores al guardar algunos registros.");
                });
        }

    });
});
