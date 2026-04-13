sap.ui.define([
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/Logger"
], function (oDataServices, Logger) {
	"use strict";

	return {

		_entitySet: "/NormalizacionSet",

		getNormalizacion: function (sIdNovedad, sEmpresa) {
			var aFilters = [
				new sap.ui.model.Filter("IdNovedad", sap.ui.model.FilterOperator.EQ, sIdNovedad),
				new sap.ui.model.Filter("Empresa", sap.ui.model.FilterOperator.EQ, sEmpresa)
			];

			return new Promise(function (resolve, reject) {
				oDataServices.getModel().read("/NormalizacionSet", {
					filters: aFilters,
					success: function (data) {
						var aResults = (data && data.results) ? data.results : [];
						Logger.info("NormalizacionSet leído", { idNovedad: sIdNovedad, count: aResults.length });
						resolve(aResults.length > 0 ? aResults[0] : null);
					},
					error: function (error) {
						Logger.error("Error al leer NormalizacionSet", error);
						reject(error);
					}
				});
			});
		},

		_toDate: function (vValue) {
			if (!vValue) {
				return null;
			}
			if (vValue instanceof Date) {
				return vValue;
			}
			if (typeof vValue === "string" && vValue.indexOf("/Date(") === 0) {
				var iTime = parseInt(vValue.replace(/\/Date\((\d+)\)\//, "$1"), 10);
				return new Date(iTime);
			}
			return new Date(vValue);
		},

		_buildPayload: function (oNormalizacion, sIdNovedad, sEmpresa) {
			var oPayload = {
				Empresa: sEmpresa || "",
				IdNovedad: sIdNovedad || "",
				EnergizoDesde: oNormalizacion.EnergizoDesde || "",
				EnergizoFecha: this._toDate(oNormalizacion.EnergizoFecha),
				CargoDesde: oNormalizacion.CargoDesde || "",
				CargoFecha: this._toDate(oNormalizacion.CargoFecha),
				Comentarios: oNormalizacion.Comentarios || "",
				InformaEmpresa: oNormalizacion.InformaEmpresa || "",
				InformaEmpComentarios: oNormalizacion.InformaEmpComentarios || ""
			};

			delete oPayload.__metadata;
			delete oPayload.NovedadesServicio;

			return oPayload;
		},

		createNormalizacion: function (oNormalizacion, sIdNovedad, sEmpresa) {
			var oPayload = this._buildPayload(oNormalizacion, sIdNovedad, sEmpresa);
			Logger.info("NormalizacionService.createNormalizacion", { idNovedad: sIdNovedad });

			return new Promise(function (resolve, reject) {
				oDataServices.getModel().create("/NormalizacionSet", oPayload, {
					success: function (data) {
						Logger.info("Normalización creada exitosamente", { idNovedad: sIdNovedad });
						resolve(data);
					},
					error: function (error) {
						Logger.error("Error al crear Normalización", error);
						reject(error);
					}
				});
			});
		},

		updateNormalizacion: function (oNormalizacion, sIdNovedad, sEmpresa) {
			var oPayload = this._buildPayload(oNormalizacion, sIdNovedad, sEmpresa);
			var sPath = "/NormalizacionSet(Empresa='" + sEmpresa + "',IdNovedad='" + sIdNovedad + "')";
			Logger.info("NormalizacionService.updateNormalizacion", { idNovedad: sIdNovedad, path: sPath });

			return new Promise(function (resolve, reject) {
				oDataServices.getModel().update(sPath, oPayload, {
					success: function () {
						Logger.info("Normalización actualizada exitosamente", { idNovedad: sIdNovedad });
						resolve({ IdNovedad: sIdNovedad, Empresa: sEmpresa });
					},
					error: function (error) {
						Logger.error("Error al actualizar Normalización", error);
						reject(error);
					}
				});
			});
		},

		_hasData: function (oNormalizacion) {
			return !!(oNormalizacion.EnergizoDesde || oNormalizacion.CargoDesde || oNormalizacion.Comentarios || oNormalizacion.InformaEmpresa || oNormalizacion.InformaEmpComentarios);
		},

		saveNormalizacion: function (oNormalizacion, sIdNovedad, sEmpresa, bExists) {
			if (!this._hasData(oNormalizacion) && !bExists) {
				return Promise.resolve();
			}
			if (bExists) {
				return this.updateNormalizacion(oNormalizacion, sIdNovedad, sEmpresa);
			}
			return this.createNormalizacion(oNormalizacion, sIdNovedad, sEmpresa);
		},

		deleteNormalizacion: function (sIdNovedad, sEmpresa) {
			var sPath = "/NormalizacionSet(Empresa='" + sEmpresa + "',IdNovedad='" + sIdNovedad + "')";
			Logger.info("NormalizacionService.deleteNormalizacion", { idNovedad: sIdNovedad, path: sPath });

			return new Promise(function (resolve, reject) {
				oDataServices.getModel().remove(sPath, {
					success: function () {
						Logger.info("Normalización eliminada exitosamente", { idNovedad: sIdNovedad });
						resolve();
					},
					error: function (error) {
						Logger.error("Error al eliminar Normalización", error);
						reject(error);
					}
				});
			});
		}
	};
});
