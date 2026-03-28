sap.ui.define([
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/ModelHelper",
	"transener/registrocronologicoeventos/utils/Logger"
], function (oDataServices, ModelHelper, Logger) {
	"use strict";

	return {

		_entitySet: "/PruebasSet",

		/**
		 * POST individual en modo edicion.
		 * @param {object} oPrueba - payload con campos de la entidad Pruebas
		 * @param {string} sIdNovedad - Id de la novedad padre
		 * @param {string} sEmpresa - codigo de empresa
		 * @returns {Promise}
		 */
		IndividualPOSTEdition: function (oPrueba, sIdNovedad, sEmpresa) {
			oPrueba.IdNovedad = sIdNovedad;
			oPrueba.Empresa = sEmpresa;
			delete oPrueba.__metadata;
			return this.POSTPromisePrueba(oPrueba);
		},

		/**
		 * Crea una prueba via POST a /PruebasSet.
		 * @param {object} oPrueba - payload con campos de la entidad Pruebas
		 * @returns {Promise}
		 */
		POSTPromisePrueba: function (oPrueba) {
			Logger.info("PruebasService.POSTPromisePrueba", { posicion: oPrueba.Posicion });
			return new Promise(function (resolve, reject) {
				oDataServices.getModel().create("/PruebasSet", oPrueba, {
					success: function (data) {
						Logger.info("Prueba creada exitosamente", { posicion: oPrueba.Posicion });
						resolve(oPrueba.IdNovedad);
					},
					error: function (error) {
						Logger.error("Error al crear prueba", error);
						reject(error);
					}
				});
			});
		},

		/**
		 * Elimina una prueba por clave compuesta.
		 * @param {object} prueba - objeto con Empresa, Posicion, IdNovedad
		 * @returns {Promise}
		 */
		remove: function (prueba) {
			var sPath = "/PruebasSet(Empresa='" + prueba.Empresa +
				"',Posicion='" + prueba.Posicion + "',IdNovedad='" + prueba.IdNovedad + "')";
			Logger.info("PruebasService.remove", { path: sPath });

			return new Promise(function (resolve, reject) {
				oDataServices.getModel().remove(sPath, {
					success: function () {
						Logger.info("Prueba eliminada exitosamente", { posicion: prueba.Posicion });
						resolve(prueba.IdNovedad);
					},
					error: function (error) {
						Logger.error("Error al eliminar prueba", error);
						reject(error);
					}
				});
			});
		},

		/**
		 * Guarda todas las pruebas de la tabla via POST individual.
		 * Se usa en modo creacion despues de persistir la novedad padre.
		 * @param {string} sIdNovedad - Id de la novedad recien creada
		 * @param {string} sEmpresa - codigo de empresa
		 * @returns {Promise}
		 */
		saveAllPruebas: function (sIdNovedad, sEmpresa) {
			var oPruebasModel = ModelHelper.getModel("TestProtecciones");
			var aPruebas = oPruebasModel.getProperty("/PruebasProtecciones") || [];
			var that = this;

			if (aPruebas.length === 0) {
				return Promise.resolve();
			}

			var aPromises = aPruebas.map(function (oItem, iIndex) {
				var oPayload = jQuery.extend({}, oItem);
				oPayload.IdNovedad = sIdNovedad;
				oPayload.Empresa = sEmpresa;
				oPayload.Posicion = (iIndex + 1).toString();
				delete oPayload.__metadata;
				return that.POSTPromisePrueba(oPayload);
			});

			return Promise.all(aPromises);
		},

		/**
		 * Limpia el modelo de pruebas.
		 */
		cleanForm: function () {
			var oModel = ModelHelper.getModel("TestProtecciones");
			if (oModel) {
				oModel.setProperty("/PruebasProtecciones", []);
			}
		}
	};
});
