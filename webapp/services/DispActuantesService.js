sap.ui.define([
	//helpers
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/ModelHelper",
	"transener/registrocronologicoeventos/utils/ErrorHandler"
], function ( oDataService, ModelHelper, ErrorHandler) {
	"use strict";

	return {
		_entitySet: "/FixedValuesSet",
		_filters: [
			new sap.ui.model.Filter({
				path: "Tabname",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: "ZTAP_OP_NS_GRAL"
			}),
			new sap.ui.model.Filter({
				path: "Fieldname",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: "COD_DISP_ACT"
			})
		],
		loadModel: function () {
			oDataService.getModel("").read(this._entitySet, {
				filters: this._filters,
				success: function (data) {
					var model = ModelHelper.getModel("DispActuantesJsonModel");
					model.setData(data.results);
				},
				error: function (error) {
					ErrorHandler.handleODataError(error, "cargar dispositivos actuantes", false);
				}
			});
		}

	};
});