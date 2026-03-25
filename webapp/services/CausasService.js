sap.ui.define([
	//helpers
	"transener/registrocronologicoeventos/utils/FioriHelper",
	"transener/registrocronologicoeventos/utils/FormatHelper",
	"transener/registrocronologicoeventos/utils/i18nTranslationHelper",
	"transener/registrocronologicoeventos/utils/MessageBoxHelper",
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/ModelHelper"
], function (FioriHelper,  FormatHelper, i18nTranslationHelper, MessageBoxHelper, oDataService,
	ModelHelper) {
	"use strict";

	return {
		_entitySet: "/CausasSet",

		_getCausas: function () {
		
			var jsonModel = sap.ui.getCore().getModel("CausasJsonModel");
			//checks if the model exists
			if (!jsonModel) {
				jsonModel = new sap.ui.model.json.JSONModel();
				jsonModel.setSizeLimit(999999);
				sap.ui.getCore().setModel(jsonModel, "CausasJsonModel");
				//initilializing
				jsonModel.setData({
					Busy: false,
					Causas: []
				});
			}
			return jsonModel;
		},

		_readODataOnSuccess: function (data) {
			// Logger.debug("Causas cargadas", data); // Descomentar si se necesita logging
			var aData = FormatHelper.removeResults(data);
			ModelHelper.getModel("CausasJsonModel").setData({
				Causas: aData
			});
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

		loadAll: function (empresa) {
			var filters = [];
			filters.push(new sap.ui.model.Filter({
				path: "Empresa",
				value1: "100",
				operator: sap.ui.model.FilterOperator.EQ
			}));
			var model = this._getCausas();
			model.setProperty("/Busy", true);
			model.setProperty("/Causas", []);
			//gets master Firmantes
			var odataModel = oDataService.getModel("");
			odataModel.setUseBatch(false);
			odataModel.read(this._entitySet, {
				filters: filters,
				success: function (data) {
					var aData = FormatHelper.removeResults(data);
					ModelHelper.getModel("AllCausasJsonModel").setData({
						Causas: aData
					});
				},
				error: jQuery.proxy(this._readODataOnError, this)
			});
		},

		loadModel: function (codNovedad, codMotivo, empresa) {
			var that = this;
			var filters = [];
			filters.push(new sap.ui.model.Filter({
				path: "TipoNovedad",
				value1: codNovedad,
				operator: sap.ui.model.FilterOperator.EQ
			}));
			filters.push(new sap.ui.model.Filter({
				path: "Motivo",
				value1: codMotivo,
				operator: sap.ui.model.FilterOperator.EQ
			}));
			filters.push(new sap.ui.model.Filter({
				path: "Empresa",
				value1: empresa,
				operator: sap.ui.model.FilterOperator.EQ
			}));
			var model = this._getCausas();
			model.setProperty("/Busy", true);
			model.setProperty("/Causas", []);
			var odataModel = oDataService.getModel("");
			odataModel.setUseBatch(false);
			return new Promise(function (resolve, reject) {
				odataModel.read(that._entitySet, {
					filters: filters,
					success: function (data) {
						that._readODataOnSuccess(data);
						resolve(data);
					},
					error: function (error) {
						that._readODataOnError(error);
						reject(error);
					}
				});
			});
		}

	};
});