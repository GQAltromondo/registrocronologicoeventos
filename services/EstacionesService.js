sap.ui.define([
	//helpers
	"transener/registrocronologicoeventos/utils/FioriHelper",
	"transener/registrocronologicoeventos/utils/FioriComponentHelper",
	"transener/registrocronologicoeventos/utils/FormatHelper",
	"transener/registrocronologicoeventos/utils/i18nTranslationHelper",
	"transener/registrocronologicoeventos/utils/MessageBoxHelper",
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/ModelHelper"
], function (FioriHelper, FioriComponentHelper, FormatHelper, i18nTranslationHelper, MessageBoxHelper, oDataService, ModelHelper) {
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
				oDataService.getModel("TransenerOperaciones").read(entity, {
					filters: aFilter,
					success: function (data) {
						console.log("Estaciones",data)
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
			console.log("Error al cargar Estaciones");
		}

	};
});