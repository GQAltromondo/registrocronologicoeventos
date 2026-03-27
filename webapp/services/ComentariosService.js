sap.ui.define([
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/Logger"
], function (oDataServices, Logger) {
	"use strict";

	return {

		_entitySet: "/ComentariosSet",

		/**
		 * Lee el comentario desde ComentariosSet para un consecuente dado.
		 * @param {string} sIdNovedad - Id de la novedad/consecuente
		 * @param {string} sEmpresa - código de empresa
		 * @returns {Promise} resuelve con el primer resultado o null
		 */
		getComentario: function (sIdNovedad, sEmpresa) {
			var aFilters = [
				new sap.ui.model.Filter("IdNovedad", sap.ui.model.FilterOperator.EQ, sIdNovedad),
				new sap.ui.model.Filter("Empresa", sap.ui.model.FilterOperator.EQ, sEmpresa)
			];

			return new Promise(function (resolve, reject) {
				oDataServices.getModel().read("/ComentariosSet", {
					filters: aFilters,
					success: function (data) {
						var aResults = (data && data.results) ? data.results : [];
						Logger.info("ComentariosSet leído", { idNovedad: sIdNovedad, count: aResults.length });
						resolve(aResults.length > 0 ? aResults[0] : null);
					},
					error: function (error) {
						Logger.error("Error al leer ComentariosSet", error);
						reject(error);
					}
				});
			});
		},

		/**
		 * Crea un registro de comentario en ComentariosSet.
		 * @param {Object} oComentario - datos del comentario
		 * @param {string} sIdNovedad - Id de la novedad/consecuente
		 * @param {string} sEmpresa - código de empresa
		 * @returns {Promise}
		 */
		postComentario: function (oComentario, sIdNovedad, sEmpresa) {
			var oPayload = {
				IdNovedad: sIdNovedad,
				Empresa: sEmpresa,
				Comentario: oComentario.Comentario || ""
			};

			// Limpiar propiedades de navegación
			delete oPayload.__metadata;
			delete oPayload.NovedadesServicio;

			var sEntitySet = this._entitySet;
			Logger.info("ComentariosService.postComentario", { idNovedad: sIdNovedad });

			return new Promise(function (resolve, reject) {
				oDataServices.getModel().create(sEntitySet, oPayload, {
					success: function (data) {
						Logger.info("Comentario creado exitosamente", { idNovedad: sIdNovedad });
						resolve(data);
					},
					error: function (error) {
						Logger.error("Error al crear Comentario", error);
						reject(error);
					}
				});
			});
		}
	};
});
