sap.ui.define([
	"transener/registrocronologicoeventos/controller/BaseController",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/m/MessageStrip",
	"transener/registrocronologicoeventos/services/UserDataService",
	"transener/registrocronologicoeventos/services/PerturbacionesService",
	"transener/registrocronologicoeventos/utils/formatter",
	"transener/registrocronologicoeventos/utils/ModelHelper"
], function (BaseController, MessageToast, Filter, FilterOperator, JSONModel, Fragment, MessageStrip, userDataService,
	PerturbacionesService,
	formatter, ModelHelper) {
	"use strict";
	var oDialog = null;

	return BaseController.extend("transener.registrocronologicoeventos.controller.Perturbaciones.Perturbaciones", {
			formatter: formatter,
		onInit: function () {
			var oModel = new sap.ui.model.json.JSONModel();

			// Set the model to the view
			this.getView().setModel(oModel, "NovedadesTipo");

			PerturbacionesService.loadModel()
		}
	});
});