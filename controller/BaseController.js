sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/core/routing/History", "sap/ui/core/UIComponent"], function (Controller, History,
	UIComponent) {
	"use strict";

	return Controller.extend("transener.registrocronologicoeventos.controller.BaseController", {
		getRouter: function () {
			return UIComponent.getRouterFor(this);
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