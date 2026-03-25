sap.ui.define([
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/Logger"
], function (oDataServices, Logger) {
	"use strict";

	return {

		_entitySet: "/NovedadesServicioSet",

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
				Cantidadtorrescaidas: oItem.Cantidadtorrescaidas || 0,
				InformaCammesa: oItem.InformaCammesa ? "X" : "",
				FechaHora: oItem.FechaHora || null,
				Texto: oItem.Texto || ""
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
