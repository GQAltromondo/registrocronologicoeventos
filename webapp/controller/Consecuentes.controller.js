sap.ui.define([
    "transener/registrocronologicoeventos/controller/BaseController",
    "sap/ui/core/routing/History",
    "transener/registrocronologicoeventos/utils/ModelHelper",
    "transener/registrocronologicoeventos/utils/Constants",
    "transener/registrocronologicoeventos/services/EquiposService",
    "transener/registrocronologicoeventos/services/CausasService",
    "transener/registrocronologicoeventos/services/ConsecuenteServices",
    "transener/registrocronologicoeventos/services/CammesaService",
    "transener/registrocronologicoeventos/services/ComentariosService",
    "transener/registrocronologicoeventos/services/NovedadesService",
    "transener/registrocronologicoeventos/utils/Logger",
    "transener/registrocronologicoeventos/utils/ErrorHandler"
], function (BaseController, History, ModelHelper, Constants, EquiposService, CausasServices, ConsecuenteServices, CammesaService, ComentariosService, NovedadesService, Logger, ErrorHandler) {
    "use strict";

    return BaseController.extend("transener.registrocronologicoeventos.controller.Consecuentes", {
        onInit: function () {
            this.getOwnerComponent().getRouter()
                .getRoute("Consecuentes")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var oArgs = oEvent.getParameter("arguments") || {};
            var sMode = (oArgs.mode || "edit").toLowerCase();
            var sIdNovedad = oArgs.idNovedad || "";
            var sEmpresa = oArgs.empresa || "";
            var oView = this.getView();

            var oEditModel = sap.ui.getCore().getModel("editModel") || oView.getModel("editModel");
            var oUtilsModel = ModelHelper.getModel("utilsModel", oView);

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

            var oFormModel = ModelHelper.getModel("ConsecuentesFormJsonModel", oView);
            if (oFormModel) {
                oFormModel.setProperty("/editingIndex", -1);
            }

            this.addConsecuente = true;

            if (sIdNovedad && sIdNovedad !== "new" && sEmpresa) {
                this._loadNovedadFromRoute(sIdNovedad, sEmpresa);
            } else {
                this.getNSInfo();
            }
        },

        _loadNovedadFromRoute: function (sIdNovedad, sEmpresa) {
            var oView = this.getView();
            var that = this;

            // Asegurar que utilsModel tenga la empresa para NovedadesService.findNovedad
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

                    // InformeCammesaSet
                    if (oData.InformeCammesaSet && oData.InformeCammesaSet.results && oData.InformeCammesaSet.results.length > 0) {
                        var oCammesa = oData.InformeCammesaSet.results[0];
                        oCammesa.Autoriza = oCammesa.Autoriza === "S";
                        oCammesa.InformaCammesa = oCammesa.InformaCammesa === "S";
                        ModelHelper.getModel("CammesaFormJsonModel", oView).setData(oCammesa);
                    }

                    // ComentariosSet
                    if (oData.ComentariosSet && oData.ComentariosSet.results && oData.ComentariosSet.results.length > 0) {
                        ModelHelper.getModel("CommentsFormJsonModel", oView).setData(oData.ComentariosSet.results[0]);
                    }

                    // ConsecuentesSet: leer cada consecuente con $expand para traer su InformeCammesaSet y ComentariosSet
                    var aConsecuentes = (oData.ConsecuentesSet && oData.ConsecuentesSet.results) || [];
                    var oListModel = ModelHelper.getModel("ConsequentListJsonModel", oView);

                    if (aConsecuentes.length > 0) {
                        var aPromises = aConsecuentes.map(function (oConsec) {
                            return ConsecuenteServices.getConsecuente(oConsec.IdNovedad, sEmpresa)
                                .then(function (oFullConsec) {
                                    // Enriquecer con InformeCammesaSet
                                    if (oFullConsec.InformeCammesaSet && oFullConsec.InformeCammesaSet.results && oFullConsec.InformeCammesaSet.results.length > 0) {
                                        var oCam = oFullConsec.InformeCammesaSet.results[0];
                                        oFullConsec.InformaCammesa = oCam.InformaCammesa === "S" || oCam.InformaCammesa === "X";
                                        oFullConsec.Texto = oCam.Texto || "";
                                        oFullConsec.Autoriza = oCam.Autoriza === "S" || oCam.Autoriza === "X";
                                        oFullConsec.FechaHoraCammesa = oCam.FechaHora || null;
                                    } else {
                                        oFullConsec.InformaCammesa = false;
                                    }
                                    // Enriquecer con ComentariosSet
                                    if (oFullConsec.ComentariosSet && oFullConsec.ComentariosSet.results && oFullConsec.ComentariosSet.results.length > 0) {
                                        oFullConsec.Comentario = oFullConsec.ComentariosSet.results[0].Comentario || "";
                                    }
                                    return oFullConsec;
                                })
                                .catch(function () {
                                    oConsec.InformaCammesa = false;
                                    return oConsec;
                                });
                        });

                        Promise.all(aPromises).then(function (aEnriched) {
                            oListModel.setData({ Consequents: aEnriched });
                        });
                    } else {
                        oListModel.setData({ Consequents: [] });
                    }

                    // ENS
                    if (oData.ENSRegXNS_NAV && oData.ENSRegXNS_NAV.results) {
                        oData.ENSRegXNS_NAV.results.forEach(function (element) {
                            element.ENSRow = (element.Corte / 60) * element.Potencia;
                        });
                        ModelHelper.getModel("ENSListJsonModel", oView).setData({
                            ENSRegisters: oData.ENSRegXNS_NAV.results
                        });
                    }

                    // Pre-llenar formulario de consecuente
                    var oFormModel = ModelHelper.getModel("ConsecuentesFormJsonModel", oView);
                    oFormModel.setProperty("/Tplnr", oData.Tplnr || "");
                    oFormModel.setProperty("/InicioNove", oData.InicioNove || null);
                    oFormModel.setProperty("/EntIndis", oData.EntIndis || null);

                    // Cargar equipos y causas
                    that.getNSInfo();
                })
                .catch(function (oError) {
                    sap.ui.core.BusyIndicator.hide();
                    ErrorHandler.handleODataError(oError, "cargar novedad " + sIdNovedad);
                });
        },

        getNSInfo: function () {
            var Empresa = ModelHelper.getModel("Empresa", this.getView()).getProperty("/selectedSociety");
            var oNovedad = ModelHelper.getModel("NovedadesFormJsonModel").getData();
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

        onVinculadostChange: function (oEvent) {
            var bSelected = oEvent.getParameter("selected");
            var oFormModel = ModelHelper.getModel("ConsecuentesFormJsonModel", this.getView());
            var sAppend = "Vinculado y sin tension.";
            if (bSelected) {
                oFormModel.setProperty("/InformaCammesa", true);
                var sTexto = oFormModel.getProperty("/Texto") || "";
                if (sTexto.indexOf(sAppend) === -1) {
                    oFormModel.setProperty("/Texto", sTexto ? sTexto + "\n" + sAppend : sAppend);
                }
            } else {
                var sTexto = oFormModel.getProperty("/Texto") || "";
                sTexto = sTexto.replace("\n" + sAppend, "").replace(sAppend, "").trim();
                oFormModel.setProperty("/Texto", sTexto);
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
         * Guarda el consecuente del formulario.
         * Usa una matriz de 4 escenarios según si la novedad padre está persistida
         * y si se está editando un consecuente existente.
         *
         * CASO A: nuevo + novedad NO persistida → push al array local
         * CASO B: nuevo + novedad persistida → POST consecuente → Promise.all([POST Cammesa, POST Comentarios])
         * CASO C: edit + novedad NO persistida → update en array local
         * CASO D: edit + novedad persistida → Promise.all([PUT consecuente, POST Cammesa, POST Comentarios])
         */
        onSaveConsecuente: function () {
            var oView = this.getView();
            var oFormModel = ModelHelper.getModel("ConsecuentesFormJsonModel", oView);
            var oListModel = ModelHelper.getModel("ConsequentListJsonModel", oView);
            var oNovedadModel = ModelHelper.getModel("NovedadesFormJsonModel", oView);
            var oNovedad = oNovedadModel.getData();
            var oFormData = oFormModel.getData() || {};
            var sEmpresa = ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety");

            var oEditModel = sap.ui.getCore().getModel("editModel") || oView.getModel("editModel");
            var bEdition = oEditModel ? oEditModel.getProperty("/editableMode") : false;

            // Armar el item del consecuente
            var oItem = {
                IdNovedad: oFormData.IdNovedad || "",
                Empresa: oFormData.Empresa || "",
                Equnr: oFormData.Equnr || "",
                Tplnr: oFormData.Tplnr || "",
                InicioNove: oFormData.InicioNove || null,
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

            // Datos de Cammesa para la llamada separada (todo del formulario del consecuente)
            var oInformeCammesa = {
                InformaCammesa: oFormData.InformaCammesa || false,
                FechaHora: oFormData.FechaHora || null,
                Texto: oFormData.Texto || "",
                Autoriza: oFormData.Autoriza || false
            };

            // Datos de Comentario para la llamada separada
            var oComentario = {
                Comentario: oFormData.Comentario || ""
            };

            var iEditingIndex = oFormData.editingIndex;
            var bIsEdit = (iEditingIndex >= 0);
            var that = this;
            var aConsecuentes = oListModel.getProperty("/Consequents") || [];

            // Armar item completo para la lista local (consecuente + cammesa + comentario)
            var fnBuildLocalItem = function (oResultItem) {
                return jQuery.extend({}, oResultItem, oInformeCammesa, oComentario);
            };

            var fnUpdateLocalList = function (oSavedItem) {
                if (bIsEdit && iEditingIndex < aConsecuentes.length) {
                    aConsecuentes[iEditingIndex] = oSavedItem;
                } else if (that.addConsecuente) {
                    aConsecuentes.push(oSavedItem);
                }
                oListModel.setProperty("/Consequents", aConsecuentes);
                oListModel.refresh(true);
            };

            var fnSuccess = function (sMsg, sId) {
                that._clearForm(oFormModel, oFormData.Tplnr);
                sap.m.MessageToast.show(sMsg);
                Logger.info("Consecuente guardado", { isEdit: bIsEdit, idNovedad: sId });
                // Refrescar solo el consecuente guardado en la tabla
                that._refreshConsecuenteItem(sId, sEmpresa, iEditingIndex);
            };

            // CASO A y C: novedad padre NO persistida → solo array local
            if (!bEdition || !oNovedad.IdNovedad) {
                var oLocalItem = fnBuildLocalItem(oItem);
                fnUpdateLocalList(oLocalItem);
                that._clearForm(oFormModel, oFormData.Tplnr);
                sap.m.MessageToast.show(bIsEdit ? "Consecuente actualizado localmente" : "Consecuente agregado localmente");
                Logger.info("Consecuente guardado localmente", { isEdit: bIsEdit });
                return;
            }

            sap.ui.core.BusyIndicator.show(0);

            if (!bIsEdit) {
                // CASO B: nuevo + novedad persistida → POST secuencial, luego Cammesa + Comentarios en paralelo
                ConsecuenteServices.createConsecuente(oItem, oNovedad, sEmpresa)
                    .then(function (oResult) {
                        var sConsecuenteId = (oResult && oResult.IdNovedad) ? oResult.IdNovedad : oItem.IdNovedad;

                        return Promise.all([
                            CammesaService.postCammesa(oInformeCammesa, sConsecuenteId, sEmpresa),
                            ComentariosService.postComentario(oComentario, sConsecuenteId, sEmpresa)
                        ]).then(function () {
                            return oResult;
                        });
                    })
                    .then(function (oResult) {
                        fnSuccess("Consecuente creado exitosamente", oResult ? oResult.IdNovedad : "");
                    })
                    .catch(function (oError) {
                        sap.ui.core.BusyIndicator.hide();
                        ErrorHandler.handleODataError(oError, "crear consecuente");
                    });
            } else {
                // CASO D: edit + novedad persistida → PUT + POST Cammesa + POST Comentarios en paralelo
                var sConsecuenteId = oItem.IdNovedad;

                Promise.all([
                    ConsecuenteServices.updateConsecuente(oItem, oNovedad, sEmpresa),
                    CammesaService.postCammesa(oInformeCammesa, sConsecuenteId, sEmpresa),
                    ComentariosService.postComentario(oComentario, sConsecuenteId, sEmpresa)
                ])
                    .then(function () {
                        fnSuccess("Consecuente actualizado exitosamente", sConsecuenteId);
                    })
                    .catch(function (oError) {
                        sap.ui.core.BusyIndicator.hide();
                        ErrorHandler.handleODataError(oError, "actualizar consecuente");
                    });
            }
        },

        /**
         * Limpia el formulario y pre-llena campos desde la novedad padre y CAMMESA padre.
         */
        _clearForm: function (oFormModel, sTplnr) {
            var oNovedadModel = ModelHelper.getModel("NovedadesFormJsonModel");
            oFormModel.setData({
                Tplnr: (oNovedadModel ? oNovedadModel.getProperty("/Tplnr") : "") || sTplnr || "",
                Equnr: "",
                InicioNove: oNovedadModel ? oNovedadModel.getProperty("/InicioNove") : null,
                EntIndis: oNovedadModel ? oNovedadModel.getProperty("/EntIndis") : null,
                EntDispo: null,
                EntServicio: null,
                CodMotivo: "",
                CodCausa: "",
                Observ: "",
                Comentario: "",
                Texto: "",
                Vinculadost: false,
                InformaCammesa: false,
                Autoriza: false,
                FechaHora: null,
                GenIndisponibilidad: false,
                Recierre: false,
                IdNovedad: "",
                Empresa: "",
                editingIndex: -1
            });

            this.addConsecuente = true;
        },

        _refreshConsecuenteItem: function (sIdConsecuente, sEmpresa, iEditingIndex) {
            var oView = this.getView();
            var oListModel = ModelHelper.getModel("ConsequentListJsonModel", oView);

            ConsecuenteServices.getConsecuente(sIdConsecuente, sEmpresa)
                .then(function (oFullConsec) {
                    if (oFullConsec.InformeCammesaSet && oFullConsec.InformeCammesaSet.results && oFullConsec.InformeCammesaSet.results.length > 0) {
                        var oCam = oFullConsec.InformeCammesaSet.results[0];
                        oFullConsec.InformaCammesa = oCam.InformaCammesa === "S" || oCam.InformaCammesa === "X";
                        oFullConsec.Texto = oCam.Texto || "";
                        oFullConsec.Autoriza = oCam.Autoriza === "S" || oCam.Autoriza === "X";
                        oFullConsec.FechaHoraCammesa = oCam.FechaHora || null;
                    } else {
                        oFullConsec.InformaCammesa = false;
                    }
                    if (oFullConsec.ComentariosSet && oFullConsec.ComentariosSet.results && oFullConsec.ComentariosSet.results.length > 0) {
                        oFullConsec.Comentario = oFullConsec.ComentariosSet.results[0].Comentario || "";
                    }

                    var aConsecuentes = oListModel.getProperty("/Consequents") || [];
                    if (iEditingIndex >= 0 && iEditingIndex < aConsecuentes.length) {
                        aConsecuentes[iEditingIndex] = oFullConsec;
                    } else {
                        aConsecuentes.push(oFullConsec);
                    }
                    oListModel.setProperty("/Consequents", aConsecuentes);
                    oListModel.refresh(true);
                    sap.ui.core.BusyIndicator.hide();
                })
                .catch(function () {
                    sap.ui.core.BusyIndicator.hide();
                });
        },

        _refreshConsecuentesList: function (sIdNovedadPadre, sEmpresa) {
            var oView = this.getView();
            var oListModel = ModelHelper.getModel("ConsequentListJsonModel", oView);

            NovedadesService.findNovedad([], sIdNovedadPadre)
                .then(function (oData) {
                    var aConsecuentes = (oData && oData.ConsecuentesSet && oData.ConsecuentesSet.results) || [];
                    if (aConsecuentes.length === 0) {
                        oListModel.setData({ Consequents: [] });
                        sap.ui.core.BusyIndicator.hide();
                        return;
                    }
                    var aPromises = aConsecuentes.map(function (oConsec) {
                        return ConsecuenteServices.getConsecuente(oConsec.IdNovedad, sEmpresa)
                            .then(function (oFullConsec) {
                                if (oFullConsec.InformeCammesaSet && oFullConsec.InformeCammesaSet.results && oFullConsec.InformeCammesaSet.results.length > 0) {
                                    var oCam = oFullConsec.InformeCammesaSet.results[0];
                                    oFullConsec.InformaCammesa = oCam.InformaCammesa === "S" || oCam.InformaCammesa === "X";
                                    oFullConsec.Texto = oCam.Texto || "";
                                    oFullConsec.Autoriza = oCam.Autoriza === "S" || oCam.Autoriza === "X";
                                    oFullConsec.FechaHoraCammesa = oCam.FechaHora || null;
                                } else {
                                    oFullConsec.InformaCammesa = false;
                                }
                                if (oFullConsec.ComentariosSet && oFullConsec.ComentariosSet.results && oFullConsec.ComentariosSet.results.length > 0) {
                                    oFullConsec.Comentario = oFullConsec.ComentariosSet.results[0].Comentario || "";
                                }
                                return oFullConsec;
                            })
                            .catch(function () {
                                oConsec.InformaCammesa = false;
                                return oConsec;
                            });
                    });
                    Promise.all(aPromises).then(function (aEnriched) {
                        oListModel.setData({ Consequents: aEnriched });
                        sap.ui.core.BusyIndicator.hide();
                    });
                })
                .catch(function () {
                    sap.ui.core.BusyIndicator.hide();
                });
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

            // Si el consecuente no tiene IdNovedad (no persistido), no duplicar al guardar
            if (!oRow.data.IdNovedad) {
                this.addConsecuente = false;
            } else {
                this.addConsecuente = true;
            }

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
            var sIdNovedad = oData.IdNovedad || "";
            var that = this;

            // Setear datos iniciales del formulario con lo que tenemos localmente
            var fnSetFormData = function (oSrc) {
                oFormModel.setData({
                    Tplnr: oSrc.Tplnr || sTplnr,
                    Equnr: "",
                    InicioNove: oSrc.InicioNove || null,
                    EntIndis: oSrc.EntIndis || null,
                    EntDispo: oSrc.EntDispo || oSrc.EntDisp || null,
                    EntServicio: oSrc.EntServicio || null,
                    CodMotivo: oSrc.CodMotivo || sCodMotivo,
                    CodCausa: "",
                    Vinculadost: oSrc.Vinculadost || oSrc.VinculadoSinTension || false,
                    Observ: oSrc.Observ || oSrc.Comment || "",
                    Comentario: oSrc.Comentario || "",
                    GenIndisponibilidad: oSrc.GenIndisponibilidad || false,
                    Recierre: oSrc.Recierre || false,
                    IdNovedad: oSrc.IdNovedad || sIdNovedad,
                    Empresa: oSrc.Empresa || "",
                    Subindice: oSrc.Subindice || "0",
                    Cantidadtorrescaidas: oSrc.Cantidadtorrescaidas || 0,
                    InformaCammesa: false,
                    Texto: "",
                    Autoriza: false,
                    FechaHora: null,
                    editingIndex: iEditingIndex
                });
            };

            // Función para cargar equipos y causas después de setear el formulario
            var fnLoadDependencies = function (oSrc) {
                var sEq = oSrc.Equnr || sEqunr;
                var sTp = oSrc.Tplnr || sTplnr;
                var sMot = oSrc.CodMotivo || sCodMotivo;
                var sCau = oSrc.CodCausa || sCodCausa;

                if (sTp) {
                    EquiposService.LoadLTEquipos(sTp, Empresa).then(function () {
                        oFormModel.setProperty("/Equnr", sEq);
                    });
                }

                if (sMot) {
                    var oNovedadModel = ModelHelper.getModel("NovedadesFormJsonModel");
                    var sCodNovedad = oNovedadModel.getProperty("/CodNovedad");
                    CausasServices.loadModel(sCodNovedad, sMot, Empresa).then(function () {
                        oFormModel.setProperty("/CodCausa", sCau);
                    });
                }
            };

            // Si el consecuente tiene Id, leer datos completos con $expand en una sola llamada
            if (sIdNovedad && iEditingIndex >= 0) {
                ConsecuenteServices.getConsecuente(sIdNovedad, Empresa)
                    .then(function (oFullData) {
                        if (!oFullData) {
                            fnSetFormData(oData);
                            fnLoadDependencies(oData);
                            return;
                        }

                        fnSetFormData(oFullData);
                        fnLoadDependencies(oFullData);

                        // Mapear InformeCammesaSet del expand al formulario del consecuente
                        if (oFullData.InformeCammesaSet && oFullData.InformeCammesaSet.results && oFullData.InformeCammesaSet.results.length > 0) {
                            var oNSData = oFullData.InformeCammesaSet.results[0];
                            oFormModel.setProperty("/InformaCammesa", oNSData.InformaCammesa === "S" || oNSData.InformaCammesa === "X" || oNSData.InformaCammesa === true);
                            oFormModel.setProperty("/FechaHora", oNSData.FechaHora || null);
                            oFormModel.setProperty("/Texto", oNSData.Texto || oNSData.Observacio || "");
                            oFormModel.setProperty("/Autoriza", oNSData.Autoriza === "S" || oNSData.Autoriza === "X");
                        }

                        // Mapear ComentariosSet del expand
                        if (oFullData.ComentariosSet && oFullData.ComentariosSet.results && oFullData.ComentariosSet.results.length > 0) {
                            oFormModel.setProperty("/Comentario", oFullData.ComentariosSet.results[0].Comentario || "");
                        }
                    })
                    .catch(function () {
                        fnSetFormData(oData);
                        fnLoadDependencies(oData);
                    });
            } else {
                fnSetFormData(oData);
                fnLoadDependencies(oData);
            }

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
