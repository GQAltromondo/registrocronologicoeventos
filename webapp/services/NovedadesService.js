sap.ui.define([
	//helpers
	"sap/m/MessageBox",
	"transener/registrocronologicoeventos/utils/FioriHelper",
	"transener/registrocronologicoeventos/utils/FioriComponentHelper",
	"transener/registrocronologicoeventos/utils/FormatHelper",
	"transener/registrocronologicoeventos/utils/i18nTranslationHelper",
	"transener/registrocronologicoeventos/utils/MessageBoxHelper",
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/BusyDialogHelper",
	"transener/registrocronologicoeventos/utils/ModelHelper",
	// "transener/registrocronologicoeventos/services/ConsecuenteService",
	// "transener/registrocronologicoeventos/services/LicenciaService",
	"transener/registrocronologicoeventos/utils/OperationErrorsHelper",
	// "transener/registrocronologicoeventos/utils/ProgressDialogHelper"
], function (MessageBox, FioriHelper, FioriComponentHelper, FormatHelper, i18nTranslationHelper, MessageBoxHelper, oDataServices,
	BusyDialogHelper,
	ModelHelper,
	// ConsecuenteService, LicenciaService,
	OperationErrorsHelper
	// , ProgressDialogHelper
) {
	"use strict";

	return {
		_entitySet: "/NovedadesSet",
		_expandProperties: "ConsecuentesSet,InformeCammesaSet,ComentariosSet,ENSRegXNS_NAV,SenialXNS_nav,PruebasXNS_nav",

		findNovedad: function (aFilter, nroNovedad) {
			var sNovedadId = ModelHelper.getModel("utilsModel").getProperty("/nroNovedad");
			if (nroNovedad) sNovedadId = nroNovedad;
			var empresa = ModelHelper.getModel("utilsModel").getProperty("/Empresa");
			let entity = "";
			if (sNovedadId !== "")
				entity = "/NovedadesServicioSet(IdNovedad='" + sNovedadId + "',Empresa='" + empresa + "')";
			else
				entity = "/NovedadesServicioSet";
			return new Promise((resolve, reject) => {
				oDataService.getModel("TransenerOperaciones").read(entity, {
					urlParameters: {
						"$expand": this._expandProperties
					},
					filters: aFilter,
					success: resolve,
					error: reject
				});
			});
		},
		SearchNovedad: function (data, successCallback, ErrorCallback) {
			var entity = "/NovedadesServicioSet(IdNovedad='" + data.NroNovedad + "',Empresa='" + data.Empresa + "')";
			var oDataModel = oDataService.getModel("TransenerOperaciones");
			oDataModel.read(entity, {
				urlParameters: {
					"$expand": this._expandProperties
				},
				success: successCallback,
				error: ErrorCallback
			});

		},
		FIND: function (aFilter, callback) {
			var that = this;
			var empresa = ModelHelper.getModel("utilsModel").getProperty("/Empresa");
			aFilter.push(new sap.ui.model.Filter("Empresa", sap.ui.model.FilterOperator.EQ, empresa));
			this.findNovedad(aFilter).then($.proxy(function (data) {
				$.proxy(that.successFindNovedad(data), that);
				callback(data);
			}, this)).catch($.proxy(this.errorFindNovedad, this));
		},

		PUT: function () {
			this.PUTPromise().then($.proxy(this.successPUT, this)).catch(this.errorPUT, this)
		},

		PUTPromise: function () {
			return new Promise((resolve, reject) => {
				let oNovedad = ModelHelper.getModel("NovedadesFormJsonModel").getData();
				oNovedad.Empresa = ModelHelper.getModel("utilsModel").getProperty("/Empresa");
				ModelHelper.deleteNavigationProperties(oNovedad);
				oNovedad.Cantidadtorrescaidas = oNovedad.Cantidadtorrescaidas || 0;
				oNovedad.Subindice = String(oNovedad.Subindice);
				let entity = "/NovedadesServicioSet(IdNovedad='" + oNovedad.IdNovedad + "',Empresa='" + oNovedad.Empresa + "')";
				oDataService.getModel("TransenerOperaciones").update(entity, oNovedad, {
					success: function (data) {
						resolve(oNovedad.IdNovedad);
					},
					error: function (error) {
						reject(error)
					}
				});
			})
		},

		successPUT: function (sNovedadId) {
			MessageBoxHelper.showAlert("Alerta", "Se ha modificado la novedad de manera exitosa");
		},

		errorPUT: function (error) {
			MessageBoxHelper.showAlert("Alerta", "Se ha producido un error al modificar la novedad");
		},

		successFindNovedad: function (data) {
			var oNovedadesModel = ModelHelper.getModel("NovedadesListJsonModel");
			var aData = FormatHelper.removeResults(data);
			if (aData.constructor === Array) {
				oNovedadesModel.setData({
					Novedades: aData
				});
			} else {
				var aArray = [];
				aArray.push(aData);
				oNovedadesModel.setData({
					Novedades: aArray
				});
			}
			BusyDialogHelper.close();
		},

		errorFindNovedad: function (error) {
			BusyDialogHelper.close();
			console.log(error);
		},

		POSTNovedad: function () {
			return new Promise((resolve, reject) => {
				let oNovedad = ModelHelper.getModel("NovedadesFormJsonModel").getData();
				let empresa = ModelHelper.getModel("utilsModel").getProperty("/Empresa");
				//le saco los segundos y los milisegundos a las fechas para poder compararlas correctamente en caso que sea necesario
				for (var prop in oNovedad) {
					var data = oNovedad[prop];
					if (data && data.setSeconds) {
						data.setSeconds(0, 0);
					}
				}
				//TODO ESPERAR QUE DEMIAN ME AGREGUE EL NULLABLE
				oNovedad.Cantidadtorrescaidas = oNovedad.Cantidadtorrescaidas || 0;
				let entity = "/NovedadesServicioSet";
				oNovedad.Empresa = empresa;
				oNovedad.Subindice += "";
				oNovedad.Consecuente = oNovedad.Consecuente || "";
				oDataServices.getModel().create(entity, oNovedad, {
					success: function (data) {
						resolve(data);
					},
					error: function (error) {
						reject(error)
					}
				});
			})
		},

		POST: function () {
			OperationErrorsHelper.cleanMessages();
			// var oPercentModel = ModelHelper.getModel("ProgressBarJsonModel");
			// ProgressDialogHelper.setPercentValues(0, "0");
			// ProgressDialogHelper.getDialog().setModel(oPercentModel, "ProgressBarJsonModel");
			// ProgressDialogHelper.openDialog();
			this.POSTNovedad().then($.proxy(this.successPOST, this)).catch($.proxy(this.errorPOST, this));
		},

		successPOST: function (data) {
			console.log(data)
			var sPath = FioriHelper.getAppPath();
			ModelHelper.getModel("SelectedNovedadJsonModel").setProperty("/CodNovedad"),
			ModelHelper.getModel("NovedadesFormJsonModel").getProperty("/CodNovedad");
			ModelHelper.getModel("NovedadesFormJsonModel").loadData(sPath + "model/NovedadesFormJsonModel.json", "", false);
			ModelHelper.getModel("utilsModel").setProperty("/editableDate", true);
		//	ProgressDialogHelper.setPercentValues(25, "25%");
			ModelHelper.getModel("SelectedNovedadJsonModel").setProperty("/novedadId", data.IdNovedad);
			var sNovedadId = ModelHelper.getModel("SelectedNovedadJsonModel").getProperty("/novedadId");
			OperationErrorsHelper.addMessage("Novedad con id Nº " + sNovedadId, "Novedad: ");
		//	LicenciaService.saveMultipleLicences(ModelHelper.getModel("LicencesListJsonModel").getData().Licences);
		//	ConsecuenteService.POST();
		},

		errorPOST: function (error) {
			//	ProgressDialogHelper.closeDialog();
			OperationErrorsHelper.addMessage("Se ha producido un error al crear novedad", "Novedad:");
			var oContent = OperationErrorsHelper.generateMessageContent();
			MessageBox.show(oContent);
		},

		deleteNovedad: function (idNovedad) {
			return new Promise(function (resolve, reject) {
				var empresa = ModelHelper.getModel("utilsModel").getProperty("/Empresa");
				var entity = "/NovedadesServicioSet(IdNovedad='" + idNovedad + "',Empresa='" + empresa + "')";
				oDataService.getModel("TransenerOperaciones").remove(entity, {
					success: resolve,
					error: reject
				});
			});
		},

		blockNovedad: function (idNovedad) {
			return new Promise(function (resolve, reject) {
				var empresa = ModelHelper.getModel("utilsModel").getProperty("/Empresa");
				var entity = "/BloqueoNovedadSet(Idnovedad='" + idNovedad + "',Empresa='" + empresa + "')";
				oDataService.getModel("TransenerOperaciones").read(entity, {
					success: resolve,
					error: reject
				});
			});
		},

		unblockNovedad: function (idNovedad) {
			return new Promise(function (resolve, reject) {
				var empresa = ModelHelper.getModel("utilsModel").getProperty("/Empresa");
				var entity = "/BloqueoNovedadSet(Idnovedad='" + idNovedad + "',Empresa='" + empresa + "')";
				oDataService.getModel("TransenerOperaciones").remove(entity, {
					success: resolve,
					error: reject
				});
			});
		}

	};
});