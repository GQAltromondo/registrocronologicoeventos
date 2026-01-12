sap.ui.define([
	//helpers
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/Logger"
], function (oDataService, Logger) {
	"use strict";

	return {
		_entitySet: "/FixedValuesSet",

		_getTipificacion: function () {
		
			var jsonModel = sap.ui.getCore().getModel("NovedadesTipo");
			//checks if the model exists
			if (!jsonModel) {
				jsonModel = new sap.ui.model.json.JSONModel();
				jsonModel.setSizeLimit(999999);
			sap.ui.getCore().setModel(jsonModel, "NovedadesTipo");
				//initilializing
				jsonModel.setData({
					Busy: false,
					NovedadesTipo: []
				});
			}
			return jsonModel;
		},

		_readODataOnSuccess: function (data) {
			Logger.debug("Perturbaciones cargadas exitosamente", data);
			//toma modelo
			var jsonModel = this._getTipificacion();
			//setea busy
			jsonModel.setProperty("/Busy", false);
			//setea datos
			jsonModel.setProperty("/", data.results);
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
					value1: "COD_NOVEDAD"
				})
			];
			var model = this._getTipificacion();
			model.setProperty("/Busy", true);
			model.setProperty("/TipificacionesFallas", []);
			//gets master Firmantes
			var odataModel = oDataService.getModel("");
			odataModel.setUseBatch(false);
			odataModel.read(this._entitySet, {
				filters: filters,
				success: jQuery.proxy(this._readODataOnSuccess, this),
				error: jQuery.proxy(this._readODataOnError, this)
			});
		}

	};
});