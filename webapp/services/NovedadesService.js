sap.ui.define([
	"sap/m/MessageBox",
	"transener/registrocronologicoeventos/utils/FioriHelper",
	"transener/registrocronologicoeventos/utils/FormatHelper",
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/BusyDialogHelper",
	"transener/registrocronologicoeventos/utils/ModelHelper",
	"transener/registrocronologicoeventos/utils/Logger",
	"transener/registrocronologicoeventos/utils/ErrorHandler",
	"transener/registrocronologicoeventos/utils/Constants",
	"transener/registrocronologicoeventos/utils/OperationErrorsHelper"
], function (MessageBox, FioriHelper, FormatHelper, oDataServices, BusyDialogHelper, ModelHelper, Logger, ErrorHandler, Constants, OperationErrorsHelper) {
	"use strict";

	return {

		_expandProperties: Constants.ODATA_EXPAND_PROPERTIES,

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
		/**
		 * Busca novedades con filtros
		 * @param {Array} aFilter - Array de filtros
		 * @param {Function} callback - Callback a ejecutar con los resultados
		 */
		FIND: function (aFilter, callback) {
			const empresa = ModelHelper.getModel("utilsModel").getProperty("/Empresa");
			aFilter.push(new sap.ui.model.Filter("Empresa", sap.ui.model.FilterOperator.EQ, empresa));

			this.findNovedad(aFilter)
				.then((data) => {
					this.successFindNovedad(data);
					if (callback && typeof callback === "function") {
						callback(data);
					}
				})
				.catch((error) => {
					this.errorFindNovedad(error);
				});
		},

		/**
		 * Actualiza una novedad (wrapper para compatibilidad)
		 * @param {sap.ui.core.mvc.View} oView - Vista actual
		 */
		PUT: function (oView) {
			this.PUTPromise(oView)
				.then((sNovedadId) => this.successPUT(sNovedadId))
				.catch((error) => this.errorPUT(error));
		},

		PUTPromise: function (oView) {
			return new Promise((resolve, reject) => {
				const oModel = oDataServices.getModel("");
				let oNovedad = ModelHelper.getModel("NovedadesFormJsonModel", oView).getData();
				ModelHelper.deleteNavigationProperties(oNovedad)
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


		/**
		 * Callback de éxito para actualizar novedad
		 * @param {string} sNovedadId - ID de la novedad actualizada
		 */
		successPUT: function (sNovedadId) {
			Logger.info("Novedad actualizada exitosamente", { novedadId: sNovedadId });
			ErrorHandler.showSuccess("Se ha modificado la novedad " + sNovedadId + " de manera exitosa");
		},

		/**
		 * Callback de error para actualizar novedad
		 * @param {Error|Object} error - Error ocurrido
		 */
		errorPUT: function (error) {
			ErrorHandler.handleODataError(error, "modificar novedad");
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

		/**
		 * Callback de error para buscar novedad
		 * @param {Error|Object} error - Error ocurrido
		 */
		errorFindNovedad: function (error) {
			BusyDialogHelper.close();
			ErrorHandler.handleError(error, "buscar novedad", false);
		},

		POSTNovedad: function () {
			return new Promise((resolve, reject) => {
				let oNovedad = ModelHelper.getModel("NovedadesFormJsonModel").getData();
				let empresa = ModelHelper.getModel("Empresa").getProperty("/selectedSociety")
				// Limpiar navigation properties y campos calculados antes del POST
				ModelHelper.deleteNavigationProperties(oNovedad);
				//le saco los segundos y los milisegundos a las fechas para poder compararlas correctamente en caso que sea necesario
				for (var prop in oNovedad) {
					var data = oNovedad[prop];
					if (data && data.setSeconds) {
						data.setSeconds(0, 0);
					}
				}
				// Normalizar valores numéricos
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

		/**
		 * Crea una nueva novedad
		 * @returns {Promise} Promise que se resuelve cuando la novedad se crea
		 */
		POST: function () {
			OperationErrorsHelper.cleanMessages();
			return this.POSTNovedad()
				.then((data) => this.successPOST(data))
				.catch((error) => this.errorPOST(error));
		},

		/**
		 * Callback de éxito para crear novedad
		 * @param {Object} data - Datos de la novedad creada
		 */
		successPOST: function (data) {
			const sPath = FioriHelper.getAppPath();
			const sNovedadId = data.IdNovedad;

			// Resetear modelo de novedades
			ModelHelper.getModel("NovedadesFormJsonModel").loadData(sPath + "model/NovedadesFormJsonModel.json", "", false);
			ModelHelper.getModel("utilsModel").setProperty("/editableDate", true);
			ModelHelper.getModel("SelectedNovedadJsonModel").setProperty("/novedadId", sNovedadId);

			OperationErrorsHelper.addMessage("Novedad con id Nº " + sNovedadId, "Novedad: ");

			Logger.info("Novedad creada exitosamente", { novedadId: sNovedadId });
			ErrorHandler.showSuccess("Novedad de Servicio Nº " + sNovedadId + " creada exitosamente");
		},

		/**
		 * Callback de error para crear novedad
		 * @param {Error|Object} error - Error ocurrido
		 */
		errorPOST: function (error) {
			OperationErrorsHelper.addMessage("Se ha producido un error al crear novedad", "Novedad:");
			const oContent = OperationErrorsHelper.generateMessageContent();
			ErrorHandler.handleODataError(error, "crear novedad");
		},

		deleteNovedad: function (idNovedad) {
			return new Promise(function (resolve, reject) {
				var empresa = ModelHelper.getModel("utilsModel").getProperty("/Empresa");
				if (!empresa) {
					empresa = ModelHelper.getModel("Empresa").getProperty("/selectedSociety");
				}
				var entity = "/NovedadesServicioSet(IdNovedad='" + idNovedad + "',Empresa='" + empresa + "')";
				oDataServices.getModel("").remove(entity, {
					success: resolve,
					error: reject
				});
			});
		},

		blockNovedad: function (idNovedad) {
			return new Promise(function (resolve, reject) {
				var empresa = ModelHelper.getModel("Empresa").getProperty("/selectedSociety");
				var entity = "/BloqueoNovedadSet(Idnovedad='" + idNovedad + "',Empresa='" + empresa + "')";
				oDataServices.getModel("").read(entity, {
					success: resolve,
					error: reject
				});
			});
		},

		unblockNovedad: function (idNovedad, oView) {
			return new Promise(function (resolve, reject) {
				var empresa = ModelHelper.getModel("Empresa").getProperty("/selectedSociety");
				var entity = "/BloqueoNovedadSet(Idnovedad='" + idNovedad + "',Empresa='" + empresa + "')";
				oDataServices.getModel("").remove(entity, {
					success: resolve,
					error: reject
				});
			});
		}

	};
});