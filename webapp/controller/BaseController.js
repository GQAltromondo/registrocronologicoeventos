sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/core/routing/History", "sap/ui/core/UIComponent"], function (Controller, History,
	UIComponent) {
	"use strict";

	return Controller.extend("transener.registrocronologicoeventos.controller.BaseController", {
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},
		getVersion: function () {
			const oComponent = this.getOwnerComponent();
			const oView = this.getView();

			// 1️⃣ Obtener versión una sola vez
			const sVersion = oComponent.getManifestEntry("/sap.app/applicationVersion/version");

			// 2️⃣ Obtener o crear modelo
			let oModel = sap.ui.getCore().getModel("appCurrentInfo");

			if (!oModel) {
				oModel = new sap.ui.model.json.JSONModel();
				oModel.setSizeLimit(9999);

				// setear el modelo una sola vez
				sap.ui.getCore().setModel(oModel, "appCurrentInfo");
				oView.setModel(oModel, "appCurrentInfo");
			}

			// 3️⃣ Setear datos SIEMPRE (caso nuevo o existente)
			oModel.setData({
				version: sVersion
			});
			oView.setModel(oModel, "appCurrentInfo");
		},

		onNavBack: function () {
			//var oHistory, sPreviousHash;

			//oHistory = History.getInstance();
			//sPreviousHash = oHistory.getPreviousHash();

			//if (sPreviousHash !== undefined) {
			//  window.history.go(-1);
			//} else {

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("RouteMain");

		},
		onNavHome: function () {
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			oCrossAppNavigator.toExternal({
				target: {
					shellHash: "Shell-home"
				}
			});
		},
	});
});