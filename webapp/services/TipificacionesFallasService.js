sap.ui.define([
	//helpers
	"transener/registrocronologicoeventos/utils/FioriHelper",
	"transener/registrocronologicoeventos/utils/FioriComponentHelper",
	"transener/registrocronologicoeventos/utils/FormatHelper",
	"transener/registrocronologicoeventos/utils/i18nTranslationHelper",
	"transener/registrocronologicoeventos/utils/MessageBoxHelper",
	"transener/registrocronologicoeventos/services/oDataServices"
], function (FioriHelper, FioriComponentHelper, FormatHelper, i18nTranslationHelper, MessageBoxHelper, oDataService) {
	"use strict";

	return {
		_entitySet: "/FixedValuesSet",

		_getTipificacion: function () {
			//gets component

			//gets model
			var jsonModel = sap.ui.getCore().getModel("TipificacionesFallas");
			//checks if the model exists
			if (!jsonModel) {
				jsonModel = new sap.ui.model.json.JSONModel();
				jsonModel.setSizeLimit(999999);
			sap.ui.getCore().setModel(jsonModel, "TipificacionesFallas");
				//initilializing
				jsonModel.setData({
					Busy: false,
					TipificacionesFallas: []
				});
			}
			return jsonModel;
		},

		_readODataOnSuccess: function (data) {
			//toma modelo
			var jsonModel = this._getTipificacion();
			//setea busy
			jsonModel.setProperty("/Busy", false);
			//setea datos
			jsonModel.setProperty("/TipificacionesFallas", data.results);
			//updates model
			jsonModel.updateBindings(true);
		},

		_readODataOnError: function (error) {
			//gets model
			var jsonModel = this._getUsuario();
			//sets busy
			jsonModel.setProperty("/Busy", false);
			//verifies if session is still active
			var sessionTimeoutResponseCode = 503;
			if (error.response.statusCode === sessionTimeoutResponseCode) {
				//session timeout
				FioriHelper.showSessionTimeoutMessageBox();
				return;
			}

			//gets error
			var errorText = error.response.body;
			//parses error
			var contentType = error.response.headers["Content-Type"];
			if (contentType.indexOf("text/html") >= 0) {
				//HTML
				errorText = $(error.response.body).text();
			} else if (contentType.indexOf("application/json") >= 0) {
				//JSON
				try {
					var oError = JSON.parse(errorText);
					errorText = oError.error.message.value;
				} catch (ex) {
					//error in parsing
					errorText = error.response.body;
				}
			}

			//error
			errorText = i18nTranslationHelper.getTranslation("ErrorLoadingInstruccionesOperativas") + ". \n\n" + errorText;
			MessageBoxHelper.showAlert("Error", errorText);
		},

		loadModel: function (filter) {
			//busy
			var filters = [
				new sap.ui.model.Filter({
					path: "Tabname",
					operator: "EQ",
					value1: "ZTAP_OP_NS_GRAL"
				}),
				new sap.ui.model.Filter({
					path: "Fieldname",
					operator: "EQ",
					value1: "COD_TIP_FALLA"
				})
			];
			var model = this._getTipificacion();
			model.setProperty("/Busy", true);
			model.setProperty("/TipificacionesFallas", []);
			//gets master Firmantes
			var odataModel = oDataService.getModel("TransenerOperaciones");
			odataModel.setUseBatch(false);
			odataModel.read(this._entitySet, {
				filters: filters,
				success: jQuery.proxy(this._readODataOnSuccess, this),
				error: jQuery.proxy(this._readODataOnError, this)
			});
		}

	};
});