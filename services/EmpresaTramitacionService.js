sap.ui.define([
	//helpers
	"transener/registrocronologicoeventos/utils/FormatHelper",
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/ModelHelper"
], function (FormatHelper, oDataService, ModelHelper) {
	"use strict";

	return {
		_entitySet: "/EmpresasLTSet",

		loadTramitacion: function (sKey) {
			var aFilter = [new sap.ui.model.Filter("Empresa", sap.ui.model.FilterOperator.EQ, sKey)];
			this.getPromise(aFilter).then($.proxy(this.success, this)).catch($.proxy(this.error, this));
		},
		//
		getPromise: function (aFilter) {
			let entity = this._entitySet;
			return new Promise((resolve, reject) => {
				oDataService.getModel().read(entity, {
					filters: aFilter,
					success: resolve,
					error: reject
				})
			})
		},

		success: function (data) {
			var aData = FormatHelper.removeResults(data);
			ModelHelper.getModel("EmpresaTramitacionJsonModel").setData({
				Empresas: aData
			})
		},

		error: function (error) {
			console.log("Error al cargar Empresas");
		}

	};
});