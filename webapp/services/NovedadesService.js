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
				oDataServices.getModel("").read(entity, {
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
			var oDataModel = oDataServices.getModel("");
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

		PUT: function (oView) {
			this.PUTPromise(oView).then($.proxy(this.successPUT, this)).catch(this.errorPUT, this)
		},

		PUTPromise: function (oView) {
			return new Promise((resolve, reject) => {
				const oModel = oDataServices.getModel("");
				let oNovedad = ModelHelper.getModel("NovedadesFormJsonModel", oView).getData();
				function toRelativeODataPath(oModel, sMetadataUri) {
					if (!sMetadataUri) return "";

					// Service URL del modelo (puede ser absoluto o relativo)
					const sServiceUrl = (oModel.sServiceUrl || "").replace(/\/$/, "");

					// Parseo URL de ambos (si alguno es relativo, lo anclo a un dummy)
					const oMetaUrl = new URL(sMetadataUri, window.location.origin);
					const oServUrl = new URL(sServiceUrl, window.location.origin);

					// Ej:
					// oServUrl.pathname: /sap/opu/odata/sap/Z_SCP_OPERACIONES_SRV
					// oMetaUrl.pathname: /sap/opu/odata/sap/Z_SCP_OPERACIONES_SRV/NovedadesServicioSet(...)
					const sServPath = oServUrl.pathname.replace(/\/$/, "");
					const sMetaPath = oMetaUrl.pathname;

					// Si el metadata incluye el service path, recorto lo que viene después
					if (sMetaPath.startsWith(sServPath + "/")) {
						return sMetaPath.substring(sServPath.length); // => /NovedadesServicioSet(...)
					}

					// Fallback 1: si por proxy no matchea, extraigo desde el EntitySet
					// (sirve si sabés el set exacto)
					const m = sMetaPath.match(/\/NovedadesServicioSet\(.*\)$/);
					if (m) return m[0];

					// Fallback 2: devuelvo el pathname completo (al menos no devuelve dominio)
					return sMetaPath;
				}
				oNovedad.Cantidadtorrescaidas = oNovedad.Cantidadtorrescaidas || 0;
				oNovedad.Subindice = String(oNovedad.Subindice);

				const sUri = oNovedad.__metadata?.uri || oNovedad.__metadata?.id;
				if (!sUri) return reject("No existe __metadata.uri / __metadata.id");

				const sPath = toRelativeODataPath(oModel, sUri);

				// ✅ En tu caso debería quedar exactamente:
				// /NovedadesServicioSet(Empresa='',IdNovedad='0000000076')
				oModel.update(sPath, oNovedad, {
					success: () => resolve(oNovedad.IdNovedad),
					error: (e) => reject(e)
				});
			});
		}
		,


		successPUT: function (sNovedadId) {
			MessageBox.success("Se ha modificado la novedad " + sNovedadId + " de manera exitosa");
		},

		errorPUT: function (error) {
			MessageBox.error("Alerta", "Se ha producido un error al modificar la novedad");
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
				let empresa = ModelHelper.getModel("Empresa").getProperty("/selectedSociety")
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
			return this.POSTNovedad().then($.proxy(this.successPOST, this)).catch($.proxy(this.errorPOST, this));
		},

		successPOST: function (data) {

			var sPath = FioriHelper.getAppPath();
			ModelHelper.getModel("SelectedNovedadJsonModel").setProperty("/CodNovedad"),
				ModelHelper.getModel("NovedadesFormJsonModel").getProperty("/CodNovedad");
			ModelHelper.getModel("NovedadesFormJsonModel").loadData(sPath + "model/NovedadesFormJsonModel.json", "", false);
			ModelHelper.getModel("utilsModel").setProperty("/editableDate", true);
			//	ProgressDialogHelper.setPercentValues(25, "25%");
			ModelHelper.getModel("SelectedNovedadJsonModel").setProperty("/novedadId", data.IdNovedad);
			var sNovedadId = ModelHelper.getModel("SelectedNovedadJsonModel").getProperty("/novedadId");
			OperationErrorsHelper.addMessage("Novedad con id Nº " + sNovedadId, "Novedad: ");
			MessageBox.success("Novedad de Servicio Nº " + sNovedadId + " creada exitosamente")
			//	LicenciaService.saveMultipleLicences(ModelHelper.getModel("LicencesListJsonModel").getData().Licences);
			//	ConsecuenteService.POST();
		},

		errorPOST: function (error) {
			//	ProgressDialogHelper.closeDialog();
			OperationErrorsHelper.addMessage("Se ha producido un error al crear novedad", "Novedad:");
			var oContent = OperationErrorsHelper.generateMessageContent();
			MessageBox.error(oContent);
		},

		deleteNovedad: function (idNovedad) {
			return new Promise(function (resolve, reject) {
				var empresa = ModelHelper.getModel("utilsModel").getProperty("/Empresa");
				var entity = "/NovedadesServicioSet(IdNovedad='" + idNovedad + "',Empresa='" + empresa + "')";
				oDataServices.getModel("").remove(entity, {
					success: resolve,
					error: reject
				});
			});
		},

		blockNovedad: function (idNovedad) {
			return new Promise(function (resolve, reject) {
				var empresa = ModelHelper.getModel("utilsModel").getProperty("/Empresa");
				var entity = "/BloqueoNovedadSet(Idnovedad='" + idNovedad + "',Empresa='" + empresa + "')";
				oDataServices.getModel("").read(entity, {
					success: resolve,
					error: reject
				});
			});
		},

		unblockNovedad: function (idNovedad,oView) {
			return new Promise(function (resolve, reject) {
				var empresa = ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety");
				var entity = "/BloqueoNovedadSet(Idnovedad='" + idNovedad + "',Empresa='" + empresa + "')";
				oDataServices.getModel("").remove(entity, {
					success: resolve,
					error: reject
				});
			});
		}

	};
});