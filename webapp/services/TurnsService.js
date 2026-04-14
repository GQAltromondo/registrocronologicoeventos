sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"transener/registrocronologicoeventos/utils/Constants",
	"transener/registrocronologicoeventos/utils/Logger",
	"transener/registrocronologicoeventos/services/UserService"
], function (Filter, FilterOperator, Constants, Logger, UserService) {
	"use strict";

	return {

		_getModel: function (oView) {
			var oModel = null;
			if (oView) {
				oModel = oView.getModel("LGuardias") || oView.getModel("NewRec");
			}
			if (!oModel) {
				oModel = sap.ui.getCore().getModel("LGuardias") || sap.ui.getCore().getModel("NewRec");
			}
			return oModel;
		},

		_adjustTimezone: function (date) {
			var d = new Date(date.getTime());
			d.setHours(d.getHours() + Constants.TURNO.TIMEZONE_OFFSET_HOURS);
			return d;
		},

		loadCurrentTurn: function (fechaNovedad, oView) {
			var oModel = this._getModel(oView);
			if (!oModel) {
				return Promise.reject(new Error("No se pudo obtener el modelo OData de turnos"));
			}

			var fechaBuscada = fechaNovedad ? new Date(fechaNovedad.getTime()) : new Date();
			fechaBuscada = this._adjustTimezone(fechaBuscada);

			var andFilter = new Filter({
				filters: [
					new Filter("Fromdate", FilterOperator.LE, fechaBuscada),
					new Filter("Todate", FilterOperator.GE, fechaBuscada)
				],
				and: true
			});
			var openFilter = new Filter("Status", FilterOperator.EQ, Constants.TURNO.STATUS_ABIERTO);

			return new Promise(function (resolve, reject) {
				oModel.read("/TurnosHeaderSet", {
					urlParameters: { $expand: "TurnoUsuarioSet" },
					filters: [andFilter, openFilter],
					success: function (resp) { resolve(resp); },
					error: function (err) { reject(err); }
				});
			});
		},

		loadDateTurn: function (fechaNovedad, oView) {
			var oModel = this._getModel(oView);
			if (!oModel) {
				return Promise.reject(new Error("No se pudo obtener el modelo OData de turnos"));
			}

			var andFilter = new Filter({
				filters: [
					new Filter("Fromdate", FilterOperator.LE, fechaNovedad),
					new Filter("Todate", FilterOperator.GE, fechaNovedad)
				],
				and: true
			});

			return new Promise(function (resolve, reject) {
				oModel.read("/TurnosHeaderSet", {
					urlParameters: { $expand: "TurnoUsuarioSet" },
					filters: [andFilter],
					success: function (resp) { resolve(resp); },
					error: function (err) { reject(err); }
				});
			});
		},

		processTurnResponse: function (results) {
			var currentOps = [];
			var currentBosses = [];

			results.forEach(function (turno) {
				if (turno.TurnoUsuarioSet && turno.TurnoUsuarioSet.results) {
					currentOps = currentOps.concat(
						turno.TurnoUsuarioSet.results.map(function (el) {
							return el.Legajo;
						})
					);
				}
				currentOps.push(turno.Legajo);
				currentBosses.push(turno.Legajo);
			});

			return { currentOps: currentOps, currentBosses: currentBosses, turnos: results };
		},

		_isUserInTurn: function (currentOps) {
			var sLegajo = UserService.getLegajo();
			if (sLegajo && currentOps.indexOf(sLegajo) !== -1) {
				return true;
			}
			var sLoginName = UserService.getLoginName();
			return currentOps.indexOf(sLoginName) !== -1;
		},

		_isUserBoss: function (currentBosses) {
			var sLegajo = UserService.getLegajo();
			if (sLegajo && currentBosses.indexOf(sLegajo) !== -1) {
				return true;
			}
			return false;
		},

		validateCreatePermission: function (fechaNovedad, empresa, oView) {
			var that = this;

			return this.loadDateTurn(fechaNovedad, oView).then(function (respAll) {
				var aResults = respAll.results || [];
				var bTurnoCerrado = aResults.some(function (turno) {
					return turno.Status === Constants.TURNO.STATUS_CERRADO && turno.Empresa === empresa;
				});

				if (bTurnoCerrado) {
					Logger.warn("validateCreatePermission: turno cerrado para fecha", { fecha: fechaNovedad });
					return { allowed: false, message: Constants.ERROR_MESSAGES.TURNO_CERRADO };
				}

				return that.loadCurrentTurn(fechaNovedad, oView).then(function (respOpen) {
					var aOpenResults = respOpen.results || [];
					if (aOpenResults.length === 0) {
						Logger.warn("validateCreatePermission: no se encontró turno abierto", { fecha: fechaNovedad });
						return { allowed: false, message: Constants.ERROR_MESSAGES.NO_TURNO_ENCONTRADO };
					}

					if (UserService.isSuperOperator()) {
						return { allowed: true };
					}

					var oProcessed = that.processTurnResponse(aOpenResults);
					if (!that._isUserInTurn(oProcessed.currentOps)) {
						Logger.warn("validateCreatePermission: usuario no pertenece al turno");
						return { allowed: false, message: Constants.ERROR_MESSAGES.NO_PERTENECE_TURNO };
					}

					return { allowed: true };
				});
			});
		},

		validateEditDeletePermission: function (fechaNovedad, creadoPor, accion, oView) {
			var that = this;
			var sLoginName = UserService.getLoginName();
			var sMessage = accion === "eliminar"
				? Constants.ERROR_MESSAGES.NO_PUEDE_ELIMINAR_AJENO
				: Constants.ERROR_MESSAGES.NO_PUEDE_EDITAR_AJENO;

			if (creadoPor === sLoginName) {
				return Promise.resolve({ allowed: true });
			}

			if (UserService.isSuperOperator()) {
				return Promise.resolve({ allowed: true });
			}

			var fechaAjustada = new Date(fechaNovedad.getTime());
			fechaAjustada.setHours(fechaAjustada.getHours() + 3);

			return this.loadCurrentTurn(fechaAjustada, oView).then(function (resp) {
				var aResults = resp.results || [];
				var oProcessed = that.processTurnResponse(aResults);

				if (that._isUserBoss(oProcessed.currentBosses)) {
					return { allowed: true };
				}

				Logger.warn("validateEditDeletePermission: usuario no puede " + accion + " registro ajeno", {
					creadoPor: creadoPor, loginName: sLoginName
				});
				return { allowed: false, message: sMessage };
			});
		}
	};
});
