sap.ui.define([
	//helpers
	"transener/registrocronologicoeventos/utils/FormatHelper",
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/ModelHelper",
	"transener/registrocronologicoeventos/utils/Logger",
	"transener/registrocronologicoeventos/utils/ErrorHandler"
], function (FormatHelper, oDataService, ModelHelper, Logger, ErrorHandler) {
	"use strict";

	return {
		//_entitySet: "/EstacionesSet",
		_entitySet: "/NSUbicacionesSet",

		loadEstaciones: function (empresa) {
			var aFilter = [new sap.ui.model.Filter("Empresa", sap.ui.model.FilterOperator.EQ, empresa)];
			this.getEstacionesPromise(aFilter).then($.proxy(this.successGetEstaciones, this))
				.catch($.proxy(this.errorGetEstaciones, this));
		},

		getEstacionesPromise: function (aFilter) {
			var that = this;
			return new Promise((resolve, reject) => {
				let entity = that._entitySet;
				oDataService.getModel("").read(entity, {
					filters: aFilter,
					success: function (data) {
						Logger.debug("Estaciones cargadas exitosamente", data);
						resolve(data);
					},
					error: function (error) {
						reject(error);
					}
				});
			});
		},

		successGetEstaciones: function (data) {
			var aData = FormatHelper.removeResults(data);
			ModelHelper.getModel("EstacionesJsonModel").setData({
				Estaciones: aData
			});

		},

		errorGetEstaciones: function (error) {
			ErrorHandler.handleODataError(error, "cargar estaciones", false);
		}

	};
});