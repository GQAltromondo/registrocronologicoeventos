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
    "transener/registrocronologicoeventos/services/CammesaService"
], function (BaseController, formatter, History, ModelHelper, Constants, EquiposService, CausasServices, NovedadesService, Logger, NormalizacionService, CammesaService) {
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
