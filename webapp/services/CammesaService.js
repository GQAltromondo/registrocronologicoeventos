sap.ui.define([
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/ModelHelper",
	"transener/registrocronologicoeventos/utils/Logger"
], function (oDataServices, ModelHelper, Logger) {
	"use strict";

	return {

		_entitySet: "/InformeCammesaSet",

		/**
		 * Lee el InformeCammesa desde NSInformeCammesaSet para un consecuente dado.
		 * @param {string} sIdNovedad - Id de la novedad/consecuente
		 * @param {string} sEmpresa - código de empresa
		 * @returns {Promise} resuelve con el primer resultado o null
		 */
		getInformeCammesa: function (sIdNovedad, sEmpresa) {
			var aFilters = [
				new sap.ui.model.Filter("Idnov", sap.ui.model.FilterOperator.EQ, sIdNovedad),
				new sap.ui.model.Filter("Sociedad", sap.ui.model.FilterOperator.EQ, sEmpresa)
			];

			return new Promise(function (resolve, reject) {
				oDataServices.getModel("").read("/NSInformeCammesaSet", {
					filters: aFilters,
					success: function (data) {
						var aResults = (data && data.results) ? data.results : [];
						resolve(aResults.length > 0 ? aResults[0] : null);
					},
					error: function (error) {
						Logger.error("Error al leer NSInformeCammesaSet", error);
						reject(error);
					}
				});
			});
		},

		postCammesa: function (oInformeCammesa, sIdNovedad, sEmpresa) {
			var oCammesa = {
				Id: sIdNovedad,
				Empresa: sEmpresa,
				FechaHora: oInformeCammesa.FechaHora || null,
				Autoriza: oInformeCammesa.Autoriza ? "S" : "N",
				InformaCammesa: oInformeCammesa.InformaCammesa ? "X" : "",
				Texto: oInformeCammesa.Texto || ""
			};

			// Limpiar propiedades de navegación
			delete oCammesa.__metadata;
			delete oCammesa.NovedadesServicio;

			var sEntitySet = this._entitySet;
			Logger.info("CammesaService.postCammesa", { id: sIdNovedad });

			return new Promise(function (resolve, reject) {
				oDataServices.getModel().create(sEntitySet, oCammesa, {
					success: function (data) {
						Logger.info("InformeCammesa creado exitosamente", { id: sIdNovedad });
						resolve(data);
					},
					error: function (error) {
						Logger.error("Error al crear InformeCammesa", error);
						reject(error);
					}
				});
			});
		}
	};
});
