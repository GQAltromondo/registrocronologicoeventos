sap.ui.define([
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/FormatHelper",
	"transener/registrocronologicoeventos/utils/ModelHelper"

], function (oDataService, FormatHelper, ModelHelper) {
	"use strict";

	return {
		_entitySet: "/MotivosSet",

		_getMotivos: function () {
			var jsonModel = sap.ui.getCore().getModel("MotivosJsonModel");
			//checks if the model exists
			if (!jsonModel) {
				jsonModel = new sap.ui.model.json.JSONModel();
				jsonModel.setSizeLimit(999999);
				sap.ui.getCore().setModel(jsonModel, "MotivosJsonModel");
				//initilializing
				jsonModel.setData({
					Busy: false,
					Motivos: []
				});
			}
			return jsonModel;
		},

		_readODataOnSuccess: function (data) {

			var aData = FormatHelper.removeResults(data);
			console.log("Motivos", aData)
			ModelHelper.getModel("MotivosJsonModel").setData(aData);
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

		loadModel: function (codNovedad, empresa) {
			var filters = [
				new sap.ui.model.Filter("CodigoNovedad", sap.ui.model.FilterOperator.EQ, codNovedad),
				new sap.ui.model.Filter("Empresa", sap.ui.model.FilterOperator.EQ, empresa)
			];

			var model = this._getMotivos();
			model.setProperty("/Busy", true);
			model.setProperty("/Motivos", []);
			oDataService.getModel("TransenerOperaciones").read("/MotivosSet", {
				filters: filters,
				success: $.proxy(this._readODataOnSuccess, this),
				error: $.proxy(this._readODataOnError, this)
			});
			// var model = this._getMotivos();
			// 		model.setProperty("/Busy", true);
			// 		model.setProperty("/Motivos", []);
			// //gets master Firmantes
			// var odataModel = oDataService.getModel();
			// odataModel.setUseBatch(false);
			// odataModel.read(this._entitySet, {
			// 	filters: filters,
			// 	success: jQuery.proxy(this._readODataOnSuccess, this),
			// 	error: jQuery.proxy(this._readODataOnError, this)
			// });
		}

	};
});