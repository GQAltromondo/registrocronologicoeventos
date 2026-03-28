sap.ui.define([
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/ModelHelper",
	"transener/registrocronologicoeventos/utils/Logger"
], function (oDataServices, ModelHelper, Logger) {
	"use strict";

	return {

		_entitySet: "/SenializacionesSet",

		/**
		 * POST individual en modo edicion.
		 * @param {object} oSignal - payload con campos de la entidad
		 * @param {string} sIdNovedad - Id de la novedad padre
		 * @param {string} sEmpresa - codigo de empresa
		 * @returns {Promise}
		 */
		IndividualPOSTEdition: function (oSignal, sIdNovedad, sEmpresa) {
			oSignal.Id = sIdNovedad;
			oSignal.Empresa = sEmpresa;
			return this.POSTPromiseSignal(oSignal);
		},

		/**
		 * Crea una senializacion via POST a /SenializacionesSet.
		 * @param {object} oSignal - payload con campos de la entidad Senializaciones
		 * @returns {Promise}
		 */
		POSTPromiseSignal: function (oSignal) {
			Logger.info("ProteccionesService.POSTPromiseSignal", { posicion: oSignal.Posicion });
			return new Promise(function (resolve, reject) {
				oDataServices.getModel().create("/SenializacionesSet", oSignal, {
					success: function (data) {
						Logger.info("Senializacion creada exitosamente", { posicion: oSignal.Posicion });
						resolve(oSignal.Id);
					},
					error: function (error) {
						Logger.error("Error al crear senializacion", error);
						reject(error);
					}
				});
			});
		},

		/**
		 * Elimina una senializacion por clave compuesta.
		 * @param {object} signal - objeto con Empresa, Posicion, Id
		 * @returns {Promise}
		 */
		remove: function (signal) {
			var sPath = "/SenializacionesSet(Empresa='" + signal.Empresa +
				"',Posicion='" + signal.Posicion + "',Id='" + signal.Id + "')";
			Logger.info("ProteccionesService.remove", { path: sPath });

			return new Promise(function (resolve, reject) {
				oDataServices.getModel().remove(sPath, {
					success: function () {
						Logger.info("Senializacion eliminada exitosamente", { posicion: signal.Posicion });
						resolve(signal.Id);
					},
					error: function (error) {
						Logger.error("Error al eliminar senializacion", error);
						reject(error);
					}
				});
			});
		},

		/**
		 * Construye array de operaciones para batch POST.
		 * Asigna Id, Empresa y Posicion a cada signal.
		 * @param {Array} aSignals - array de payloads OData
		 * @param {string} sIdNovedad - Id de la novedad padre
		 * @param {string} sEmpresa - codigo de empresa
		 * @returns {Array} array de objetos {entity, data}
		 */
		buildBatchArray: function (aSignals, sIdNovedad, sEmpresa) {
			var aOperation = [];
			for (var i = 0; i < aSignals.length; i++) {
				aSignals[i].Posicion = (i + 1).toString();
				aSignals[i].Id = sIdNovedad;
				aSignals[i].Empresa = sEmpresa;
				aOperation.push({
					entity: "/SenializacionesSet",
					data: aSignals[i]
				});
			}
			return aOperation;
		},

		/**
		 * Guarda todas las protecciones de la tabla via POST individual secuencial.
		 * Se usa en modo creacion despues de persistir la novedad padre.
		 * @param {string} sIdNovedad - Id de la novedad recien creada
		 * @param {string} sEmpresa - codigo de empresa
		 * @returns {Promise}
		 */
		saveAllSignals: function (sIdNovedad, sEmpresa) {
			var oProteccionesModel = ModelHelper.getModel("NovedadesProtecciones");
			var aProtecciones = oProteccionesModel.getProperty("/Protecciones") || [];
			var that = this;

			if (aProtecciones.length === 0) {
				return Promise.resolve();
			}

			var aPayloads = aProtecciones.map(function (oItem, iIndex) {
				var oPayload = jQuery.extend({}, oItem._signalData || {});
				oPayload.Id = sIdNovedad;
				oPayload.Empresa = sEmpresa;
				oPayload.Posicion = (iIndex + 1).toString();
				// Limpiar propiedades internas de UI
				delete oPayload.__metadata;
				delete oPayload._signalData;
				delete oPayload._formData;
				return oPayload;
			});

			var aPromises = aPayloads.map(function (oPayload) {
				return that.POSTPromiseSignal(oPayload);
			});

			return Promise.all(aPromises);
		},

		/**
		 * Limpia el modelo NovedadesProtecciones reiniciandolo a su estado inicial.
		 */
		cleanForm: function () {
			var oModel = ModelHelper.getModel("NovedadesProtecciones");
			if (oModel) {
				oModel.setProperty("/Protecciones", []);
			}
		}
	};
});
