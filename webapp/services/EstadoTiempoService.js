sap.ui.define([
	//helpers
	"transener/registrocronologicoeventos/utils/FioriHelper",
	"transener/registrocronologicoeventos/utils/FioriComponentHelper",
	"transener/registrocronologicoeventos/utils/FormatHelper",
	"transener/registrocronologicoeventos/utils/i18nTranslationHelper",
	"transener/registrocronologicoeventos/utils/MessageBoxHelper",
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/ModelHelper",
	"transener/registrocronologicoeventos/utils/ErrorHandler"
], function (FioriHelper, FioriComponentHelper, FormatHelper, i18nTranslationHelper, MessageBoxHelper, oDataService, ModelHelper, ErrorHandler) {
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
				value1: "COD_WEATHER"
			})
		],
		loadModel: function () {
			oDataService.getModel("").read(this._entitySet, {
				filters: this._filters,
				success: function (data) {
					var model = ModelHelper.getModel("EstadoTiempoJsonModel");
					model.setData(data.results);
				},
				error: function (error) {
					ErrorHandler.handleODataError(error, "cargar estado del tiempo", false);
				}
			});
		}

	};
});