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
	"transener/registrocronologicoeventos/utils/ModelHelper",
	"sap/ui/core/routing/History"
], function (BaseController, MessageToast, Filter, FilterOperator, JSONModel, Fragment, MessageStrip, userDataService,
	PerturbacionesService,
	formatter, ModelHelper, History) {
	"use strict";
	var oDialog = null;

	return BaseController.extend("transener.registrocronologicoeventos.controller.Perturbaciones.Perturbaciones", {
		formatter: formatter,
		onInit: function () {
			this.getOwnerComponent().getRouter()
				.getRoute("Perturbaciones")
				.attachPatternMatched(this._onRouteMatched, this);
		},
		_onRouteMatched: function (oEvent) {
			const oArgs = oEvent.getParameter("arguments") || {};
			const sMode = (oArgs.mode || "edit").toLowerCase();

			// Modo (create/edit) para reutilizar la vista
			const oEditModel = sap.ui.getCore().getModel("editModel") || this.getView().getModel("editModel");
			if (oEditModel) {
				oEditModel.setProperty("/mode", sMode);
				oEditModel.setProperty("/editableMode", sMode === "create" ? true : oEditModel.getProperty("/editableMode"));
			}

			// Importante: NO necesitás recargar nada si venís desde Main,
			// porque Main ya llenó los modelos antes de navegar.
		},

		_loadPerturbacionById: function (sIdNovedad) {
			// OPCIÓN A: si ya tenés todo en un JSONModel en memoria, buscás y seteás
			// OPCIÓN B: leer de OData por key y setear NovedadesFormJsonModel

			const oView = this.getView();
			const oDataModel = this.getOwnerComponent().getModel(); // OData
			const oNovedadModel = ModelHelper.getModel("NovedadesFormJsonModel", oView);

			return new Promise((resolve, reject) => {
				// Ajustá entityset + keys reales (ejemplo)
				const sPath = oDataModel.createKey("/NovedadesServicioSet", {
					IdNovedad: sIdNovedad,
					Empresa: ModelHelper.getModel("utilsModel", oView).getProperty("/Empresa")
				});

				oDataModel.read(sPath, {
					success: function (oData) {
						oNovedadModel.setData(oData);
						resolve(oData);
					},
					error: function (e) {
						reject(e);
						sap.m.MessageBox.error("No se pudo cargar la perturbación.");
					}
				});
			});
		},

	});
});