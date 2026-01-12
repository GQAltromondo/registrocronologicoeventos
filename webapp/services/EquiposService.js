sap.ui.define([
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/ModelHelper",
	"transener/registrocronologicoeventos/utils/Logger",
	"transener/registrocronologicoeventos/utils/ErrorHandler",
	"transener/registrocronologicoeventos/utils/Constants"
], function (oDataServices, ModelHelper, Logger, ErrorHandler, Constants) {
	"use strict";
	return {
		lineas: Constants.LINEAS,
		LoadEquipos: function (estatacionId, empresa) {
			var filters = [];
			if (!estatacionId) {
				this.onSuccessEquipos({
					results: []
				});
				return;
			}
			filters.push(new sap.ui.model.Filter("Estacion", sap.ui.model.FilterOperator.EQ, estatacionId));
			filters.push(new sap.ui.model.Filter("Empresa", sap.ui.model.FilterOperator.EQ, empresa));
			var odataModel = oDataServices.getModel();
			odataModel.read("/EquiposSet", {
				filters: filters,
				success: this.onSuccessEquipos,
				error: this.onErrorEquipos
			});
		},

		loadNSEquipos: function (tipo, estacion, empresa) {
			//var k = '"' + tipo + '"';
			var aFilter = [new sap.ui.model.Filter("IEmpresa", sap.ui.model.FilterOperator.EQ, empresa),
			new sap.ui.model.Filter("IEqart", sap.ui.model.FilterOperator.EQ, tipo)
			];
			if (!estacion && !this.lineas.includes(tipo)) {
				return;
			}
			if (this.lineas.includes(tipo)) {
				estacion = null;
			}
			if (estacion) {
				aFilter.push(new sap.ui.model.Filter("Estacion", sap.ui.model.FilterOperator.EQ, estacion));
			}
			var odataModel = oDataServices.getModel();
			odataModel.read("/NSEquiposSet", {
				filters: aFilter,
				success: this.onSuccessEquipos,
				error: this.onErrorEquipos
			});
		},
		onSuccessEquipos: function (data) {
			var Equipos = data.results;

			ModelHelper.getModel("EquiposModel").setData({
				Equipos: Equipos,
				busy: false
			});
		},
		onErrorEquipos: function () { },
		LoadLTEquipos: function (sKey, Empresa) {

			let roles = ModelHelper.getModel("UserJsonModel").getProperty("/roles");

			var aFilter = [
				new sap.ui.model.Filter("Estacion", sap.ui.model.FilterOperator.EQ, sKey),
				new sap.ui.model.Filter("Empresa", sap.ui.model.FilterOperator.EQ, Empresa)
			];


			aFilter.push(new sap.ui.model.Filter({
				path: "Rol",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: roles.includes("ope_solic-lic_transener") ? "ope_solic-lic_transener" : roles[0]
			}));



			this.getEquiposPromise(aFilter)
				.then((data) => this.successGetEquipos(data))
				.catch((error) => this.errorGetEquipos(error));
		},
		getEquiposPromise: function (aFilter) {
			return new Promise((resolve, reject) => {
				oDataServices.getModel().read("/EquiposRolesSet", {
					filters: aFilter,
					success: function (data) {
						resolve(data);
					},
					error: function (error) {
						reject(error);
					}
				})
			})
		},
		successGetEquipos: function (data) {
			var aData = data.results;
			ModelHelper.getModel("EquiposModel").setData({
				Equipos: aData
			})
		},

		/**
		 * Maneja errores al cargar equipos
		 * @param {Error|Object} error - Error ocurrido
		 */
		errorGetEquipos: function (error) {
			ErrorHandler.handleError(error, "cargar equipos", false);
		}

	};
});