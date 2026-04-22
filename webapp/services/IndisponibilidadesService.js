sap.ui.define([
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/ModelHelper",
	"transener/registrocronologicoeventos/utils/Logger"
], function (oDataServices, ModelHelper, Logger) {
	"use strict";

	return {

		
		create: function (oIndisponibilidad, sIdNovedad, sEmpresa) {
			oIndisponibilidad.IdNovedad = sIdNovedad;
			oIndisponibilidad.Empresa = sEmpresa;
			delete oIndisponibilidad.__metadata;
			delete oIndisponibilidad._formData;

			Logger.info("IndisponibilidadesService.create", { posicion: oIndisponibilidad.Posicion });
			return new Promise(function (resolve, reject) {
				oDataServices.getModel().create("/IndisponibilidadesSet", oIndisponibilidad, {
					success: function (data) {
						Logger.info("Indisponibilidad creada exitosamente", { posicion: oIndisponibilidad.Posicion });
						resolve(oIndisponibilidad.IdNovedad);
					},
					error: function (error) {
						Logger.error("Error al crear indisponibilidad", error);
						reject(error);
					}
				});
			});
		},

		update: function (oIndisponibilidad, sIdNovedad, sEmpresa) {
			oIndisponibilidad.IdNovedad = sIdNovedad;
			oIndisponibilidad.Empresa = sEmpresa;
			delete oIndisponibilidad.__metadata;
			delete oIndisponibilidad._formData;

			var sPath = "/IndisponibilidadesSet(Empresa='" + sEmpresa +
				"',Posicion='" + oIndisponibilidad.Posicion + "',IdNovedad='" + sIdNovedad + "')";
			Logger.info("IndisponibilidadesService.update", { path: sPath });

			return new Promise(function (resolve, reject) {
				oDataServices.getModel().update(sPath, oIndisponibilidad, {
					success: function () {
						Logger.info("Indisponibilidad actualizada exitosamente", { posicion: oIndisponibilidad.Posicion });
						resolve(oIndisponibilidad.IdNovedad);
					},
					error: function (error) {
						Logger.error("Error al actualizar indisponibilidad", error);
						reject(error);
					}
				});
			});
		},

		upsert: function (oIndisponibilidad, sIdNovedad, sEmpresa) {
			var that = this;
			return this.update(jQuery.extend({}, oIndisponibilidad), sIdNovedad, sEmpresa)
				.catch(function (error) {
					var iStatus = error && (error.statusCode || (error.response && error.response.statusCode));
					if (iStatus === 404 || iStatus === "404") {
						return that.create(jQuery.extend({}, oIndisponibilidad), sIdNovedad, sEmpresa);
					}
					throw error;
				});
		},

		remove: function (oItem) {
			var sPath = "/IndisponibilidadesSet(Empresa='" + oItem.Empresa +
				"',Posicion='" + oItem.Posicion + "',IdNovedad='" + oItem.IdNovedad + "')";
			Logger.info("IndisponibilidadesService.remove", { path: sPath });

			return new Promise(function (resolve, reject) {
				oDataServices.getModel().remove(sPath, {
					success: function () {
						Logger.info("Indisponibilidad eliminada exitosamente", { posicion: oItem.Posicion });
						resolve(oItem.IdNovedad);
					},
					error: function (error) {
						Logger.error("Error al eliminar indisponibilidad", error);
						reject(error);
					}
				});
			});
		},

		saveAllIndisponibilidades: function (sIdNovedad, sEmpresa) {
			var oModel = ModelHelper.getModel("IndisponibilidadesModel");
			var aItems = oModel.getProperty("/Indisponibilidades") || [];
			var that = this;

			if (aItems.length === 0) {
				return Promise.resolve();
			}

			var aPromises = aItems.map(function (oItem, iIndex) {
				var oPayload = jQuery.extend({}, oItem);
				if (!oPayload.Posicion) {
					oPayload.Posicion = (iIndex + 1).toString();
				}
				return that.upsert(oPayload, sIdNovedad, sEmpresa);
			});

			return Promise.all(aPromises);
		},

		cleanForm: function () {
			var oModel = ModelHelper.getModel("IndisponibilidadesModel");
			if (oModel) {
				oModel.setProperty("/Indisponibilidades", []);
			}
		}
	};
});
