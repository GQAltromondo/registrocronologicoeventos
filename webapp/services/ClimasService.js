sap.ui.define([
	//helpers
	"transener/registrocronologicoeventos/utils/FioriHelper",
	"transener/registrocronologicoeventos/utils/FormatHelper",
	"transener/registrocronologicoeventos/utils/i18nTranslationHelper",
	"transener/registrocronologicoeventos/utils/MessageBoxHelper",
	"transener/registrocronologicoeventos/services/oDataServices"
], function (FioriHelper, FormatHelper, i18nTranslationHelper, MessageBoxHelper, oDataService) {
	"use strict";

	return {
		_entitySet: "/ClimasSet",

		_getClimas: function () {

			var jsonModel = sap.ui.getCore().getModel("ClimasJsonModel");
			//checks if the model exists
			if (!jsonModel) {
				jsonModel = new sap.ui.model.json.JSONModel();
				jsonModel.setSizeLimit(999999);
				sap.ui.getCore().setModel(jsonModel, "ClimasJsonModel");
				//initilializing
				jsonModel.setData({
					Busy: false,
					Climas: []
				});
			}
			return jsonModel;
		},

		_readODataOnSuccess: function (data) {
			// Logger.debug("Climas cargados", data); // Descomentar si se necesita logging
				//toma modelo
			var jsonModel = this._getClimas();
			//setea busy
			jsonModel.setProperty("/Busy", false);
			//setea datos
			jsonModel.setProperty("/Climas", data.results);
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
			var filters = [];
			if (filter) {
				filters = this.prepareFilters(filter);
			}
			var model = this._getClimas();
			model.setProperty("/Busy", true);
			model.setProperty("/Climas", []);
			//gets master Firmantes
			var odataModel = oDataService.getModel();
			odataModel.setUseBatch(false);
			odataModel.read(this._entitySet, {
				filters: filters,
				success: jQuery.proxy(this._readODataOnSuccess, this),
				error: jQuery.proxy(this._readODataOnError, this)
			});
		}

	};
});