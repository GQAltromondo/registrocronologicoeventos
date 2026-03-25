sap.ui.define([
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/ModelHelper",
	"transener/registrocronologicoeventos/utils/Logger"
], function (oDataServices, ModelHelper, Logger) {
	"use strict";

	return {

		_entitySet: "/InformeCammesaSet",

		/**
		 * Crea un registro de InformeCammesa para un consecuente/novedad.
		 * @param {Object} oInformeCammesa - datos del informe (FechaHora, InformaCammesa, Texto, Autoriza)
		 * @param {string} sIdNovedad - Id de la novedad asociada
		 * @param {string} sEmpresa - código de empresa
		 * @returns {Promise}
		 */
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
