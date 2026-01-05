sap.ui.define([

    "transener/registrocronologicoeventos/services/oDataServices",

    "transener/registrocronologicoeventos/utils/ModelHelper",],
    function (oDataService, ModelHelper) {
        "use strict";

        return {
            saveLicence: function (data, onSuccessCallback, onErrorCallback) {
                var odataModel = oDataService.getModel("TransenerOperaciones");
                var IdNovedad = ModelHelper.getModel("SelectedNovedadJsonModel").getProperty("/novedadId") || ModelHelper.getModel("UtilsJsonModel").getProperty("/IdNovedad");
                data.IdNovedad = IdNovedad;
                odataModel.create("/NSLicenciasRelSet", data, {
                    success: onSuccessCallback,
                    error: onErrorCallback
                });
            },

            saveMultipleLicences: function (arrLT) {
                var promises = [];
                for (var i = 0; i < arrLT.length; i++) {
                    promises.push(this.saveLicence(arrLT[i]));
                }
                //TODO agregar reflection para hacerlas todas aunque una falle
                return Promise.all(promises).then(() => {
                    ModelHelper.getModel("LicencesListJsonModel").getData().Licences = [];
                    var now = new Date();
                    ModelHelper.getModel("NovedadesFormJsonModel").setProperty("/Anio", now.getFullYear().toString());
                    ModelHelper.getModel("LTFormJsonModel").setProperty("/IdLicencia", "");
                    ModelHelper.getModel("LicencesListJsonModel").updateBindings(true);
                    ModelHelper.getModel("NovedadesFormJsonModel").updateBindings(true);
                });
            },

            loadList: function (empresa, idNovedad) {
                let entity = "/NSLicenciasRelSet";

                return new Promise((resolve, reject) => {
                    oDataService.getModel("TransenerOperaciones").read(entity, {
                        filters: [
                            new sap.ui.model.Filter({
                                path: "Empresa",
                                operator: sap.ui.model.FilterOperator.EQ,
                                value1: empresa
                            }),
                            new sap.ui.model.Filter({
                                path: "IdNovedad",
                                operator: sap.ui.model.FilterOperator.EQ,
                                value1: idNovedad
                            })
                        ],
                        success: function (res) {
                            ModelHelper.getModel("LicencesListJsonModel").setData({
                                Licences: res.results
                            });
                            resolve(res.results);
                        },
                        error: function (err) {
                            reject(err);
                        }
                    });
                });
            }
            ,

            onDeleteLicence: function (licencia, onSuccessCallback, onErrorCallback) {
                var odataModel = oDataService.getModel("TransenerOperaciones");
                var url = this.getPathURL(licencia);
                odataModel.remove(url, {
                    success: onSuccessCallback,
                    error: onErrorCallback
                });
            },
            getPathURL: function (licencia) {
                return "/NSLicenciasRelSet(Empresa='" + licencia.Empresa + "',IdNovedad='" + licencia.IdNovedad + "',IdLicencia='" + licencia.IdLicencia + "',Anio='" + licencia.Anio + "')";
            }
        };
    });