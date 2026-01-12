sap.ui.define([
	//helpers
	"transener/registrocronologicoeventos/utils/FormatHelper",
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/ModelHelper",
	"transener/registrocronologicoeventos/utils/ErrorHandler"
], function (FormatHelper, oDataService, ModelHelper, ErrorHandler) {
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
			ErrorHandler.handleODataError(error, "cargar empresas de tramitación", false);
		}

	};
});