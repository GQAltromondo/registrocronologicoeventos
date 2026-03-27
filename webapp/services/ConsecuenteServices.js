sap.ui.define([
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/Logger",
	"transener/registrocronologicoeventos/utils/Constants"
], function (oDataServices, Logger, Constants) {
	"use strict";

	return {

		_entitySet: "/NovedadesServicioSet",

		/**
		 * Lee un consecuente desde NovedadesServicioSet por IdNovedad y Empresa.
		 * @param {string} sIdNovedad - Id de la novedad/consecuente
		 * @param {string} sEmpresa - código de empresa
		 * @returns {Promise} resuelve con los datos del consecuente o null
		 */
		getConsecuente: function (sIdNovedad, sEmpresa) {
			var sPath = "/NovedadesServicioSet(IdNovedad='" + sIdNovedad + "',Empresa='" + sEmpresa + "')";
			Logger.info("ConsecuenteServices.getConsecuente", { idNovedad: sIdNovedad, path: sPath });

			return new Promise(function (resolve, reject) {
				oDataServices.getModel().read(sPath, {
					urlParameters: {
						"$expand": Constants.ODATA_EXPAND_PROPERTIES
					},
					success: function (data) {
						Logger.info("Consecuente leído exitosamente", { idNovedad: sIdNovedad });
						resolve(data);
					},
					error: function (error) {
						Logger.error("Error al leer consecuente", error);
						reject(error);
					}
				});
			});
		},

		/**
		 * Construye el payload para POST/PUT de un consecuente.
		 * Solo envía los campos esenciales, siguiendo el patrón de la app original
		 * que limpia cuidadosamente las propiedades antes de enviar.
		 */
		_buildPayload: function (oItem, oParentNovedad, sEmpresa) {
			var oPayload = {
				Empresa: sEmpresa || "",
				Consecuente: oParentNovedad.IdNovedad || "",
				CodNovedad: oItem.CodNovedad || oParentNovedad.CodNovedad || "",
				CodTipo: oItem.CodTipo || oParentNovedad.CodTipo || "",
				Tplnr: oItem.Tplnr || "",
				Equnr: oItem.Equnr || "",
				CodMotivo: oItem.CodMotivo || "",
				CodCausa: oItem.CodCausa || "",
				CodWeather: oItem.CodWeather || "",
				CodDispAct: oItem.CodDispAct || "",
				CodAreaResp: oItem.CodAreaResp || "",
				InicioNove: oItem.InicioNove || null,
				EntIndis: oItem.EntIndis || oItem.EntIndisp || null,
				EntDispo: oItem.EntDispo || oItem.EntDisp || null,
				EntServicio: oItem.EntServicio || null,
				FechaFinNove: oItem.FechaFinNove || null,
				Observ: oItem.Observ || oItem.Comment || oItem.Comentario || "",
				GenIndisponibilidad: oItem.GenIndisponibilidad || false,
				Recierre: oItem.Recierre || false,
				Vinculadost: oItem.Vinculadost || oItem.VinculadoSinTension || false,
				Subindice: String(oItem.Subindice || "0"),
				Cantidadtorrescaidas: oItem.Cantidadtorrescaidas || 0
			};

			// Normalizar fechas: quitar segundos y milisegundos
			var aDateFields = ["InicioNove", "EntIndis", "EntDispo", "EntServicio", "FechaFinNove"];
			aDateFields.forEach(function (sField) {
				var dVal = oPayload[sField];
				if (dVal && dVal.setSeconds) {
					dVal.setSeconds(0, 0);
				}
			});

			return oPayload;
		},

		createConsecuente: function (oItem, oParentNovedad, sEmpresa) {
			var oPayload = this._buildPayload(oItem, oParentNovedad, sEmpresa);
			Logger.info("ConsecuenteServices.createConsecuente", { equnr: oPayload.Equnr, parent: oPayload.Consecuente });

			return new Promise(function (resolve, reject) {
				oDataServices.getModel().create("/NovedadesServicioSet", oPayload, {
					success: function (data) {
						Logger.info("Consecuente creado exitosamente", { idNovedad: data.IdNovedad });
						resolve(data);
					},
					error: function (error) {
						Logger.error("Error al crear consecuente", error);
						reject(error);
					}
				});
			});
		},

		updateConsecuente: function (oItem, oParentNovedad, sEmpresa) {
			var oPayload = this._buildPayload(oItem, oParentNovedad, sEmpresa);
			var sPath = "/NovedadesServicioSet(IdNovedad='" + oItem.IdNovedad + "',Empresa='" + sEmpresa + "')";
			Logger.info("ConsecuenteServices.updateConsecuente", { idNovedad: oItem.IdNovedad, path: sPath });

			// Limpiar propiedades de navegación y metadata
			delete oPayload.__metadata;
			delete oPayload.ConsecuentesSet;
			delete oPayload.InformeCammesaSet;
			delete oPayload.ComentariosSet;
			delete oPayload.ENSRegXNS_NAV;
			delete oPayload.SenialXNS_nav;
			delete oPayload.PruebasXNS_nav;
			delete oPayload.NovedadesServicio;

			// Limpiar campos temporales de UI y entidades expand
			delete oPayload.editMode;
			delete oPayload.NovedadPos;
			delete oPayload.HoraFin;
			delete oPayload.HoraIni;
			delete oPayload.Id;
			delete oPayload.Comentario;
			delete oPayload.FechaHora;
			delete oPayload.Autoriza;
			delete oPayload.InformaCammesa;
			delete oPayload.Texto;

			// Defaults para update
			oPayload.Ens = oPayload.Ens || false;
			oPayload.Borrado = oPayload.Borrado || false;
			oPayload.Cantidadtorrescaidas = oPayload.Cantidadtorrescaidas || 0;

			return new Promise(function (resolve, reject) {
				oDataServices.getModel().update(sPath, oPayload, {
					success: function () {
						Logger.info("Consecuente actualizado exitosamente", { idNovedad: oItem.IdNovedad });
						resolve({ IdNovedad: oItem.IdNovedad, Empresa: sEmpresa });
					},
					error: function (error) {
						Logger.error("Error al actualizar consecuente", error);
						reject(error);
					}
				});
			});
		},

		saveConsecuente: function (oItem, oParentNovedad, sEmpresa) {
			if (oItem.IdNovedad) {
				return this.updateConsecuente(oItem, oParentNovedad, sEmpresa);
			}
			return this.createConsecuente(oItem, oParentNovedad, sEmpresa);
		},

		deleteConsecuente: function (sIdNovedad, sEmpresa) {
			var sPath = "/NovedadesServicioSet(IdNovedad='" + sIdNovedad + "',Empresa='" + sEmpresa + "')";
			Logger.info("ConsecuenteServices.deleteConsecuente", { idNovedad: sIdNovedad, path: sPath });

			return new Promise(function (resolve, reject) {
				oDataServices.getModel().remove(sPath, {
					success: function () {
						Logger.info("Consecuente eliminado exitosamente", { idNovedad: sIdNovedad });
						resolve();
					},
					error: function (error) {
						Logger.error("Error al eliminar consecuente", error);
						reject(error);
					}
				});
			});
		}
	};
});
