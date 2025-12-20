sap.ui.define([], function (FioriComponentHelper) {
	"use strict";
	return {
		// globales 
		_oApp: null,
		isPhone: null,

		setApp: function (oApp) {
			this._oApp = oApp;
		},

		getModel: function (sModelName, oView) {
			var jsonModel = sap.ui.getCore().getModel(sModelName);
			if (!jsonModel) {
				jsonModel = new sap.ui.model.json.JSONModel();
				jsonModel.setSizeLimit(9999);
				sap.ui.getCore().setModel(jsonModel, sModelName);
			}
			if (oView) {
				oView.setModel(jsonModel, sModelName);
			}
			return jsonModel;
		},

		getApp: function () {
			return this._oApp;
		},

		getAppRouter: function () {
			return FioriComponentHelper.getComponent().getRouter();
		},

		getUser: function () {
			var oUserData = this.getModel("UserJsonModel").getData();
			return oUserData.nombre + " " + oUserData.apellido;
		},

		getLoginName: function () {
			var oUserData = this.getModel("UserJsonModel").getData();
			return oUserData.login_name;
		},

		getStringUserLegacy: function () {
			var oUserData = this.getModel("UserJsonModel").getData();
			var oUserDataCu = this.getModel("CurrentUser").getData();
			var name = oUserData.nombre + " " + oUserData.apellido;
			var legacy = oUserDataCu.Legajo ? oUserDataCu.Legajo + " - " : "";
			return `${legacy} ${name}`;
		},

		getUserLegacy: function () {
			return this.getModel("CurrentUser").getData();
		},

		handleTramitacionesLicenciaExpand: function (aTramitacionesExpand) {
			if (aTramitacionesExpand.length) {
				aTramitacionesExpand.forEach(tramitacion => {
					if (tramitacion.Estado === "01") {
						tramitacion.Enabled = false;
					}
					if (tramitacion.Estado === "02") {
						tramitacion.Enabled = true;
					}
					tramitacion.CalendarDates = [];
				});
				return aTramitacionesExpand;
			}
			return []
		},

		setNavigationProperties: function (oObject) {
			this.getModel("CoordinationTableJsonModel").setData({
				Coordinations: oObject.CoordinacionesLicencia_nav
			});
			this.getModel("TramitacionListJsonModel").setData({
				Tramitaciones: this.handleTramitacionesLicenciaExpand(oObject.TramitacionesLicencia_nav)
			});
			this.getModel("ObservationTableJsonModel").setData({
				Observations: oObject.ObservacionesLicencia_nav
			});
			this.getModel("SuspensionTableJsonModel").setData({
				Suspensions: oObject.SuspensionLicencia_nav
			});
			this.getModel("ReanudationTableJsonModel").setData({
				Reanudations: oObject.ReanudacionLicencia_nav
			});
			this.getModel("TransferListJsonModel").setData({
				Transfers: oObject.TransferenciaJefeTrabajo_nav
			});
			this.getModel("FileListJsonModel").setData({
				Files: oObject.AttachmentXLicencia_nav
			});
		},
		deleteNavigationProperties: function (oObject) {
			delete oObject.ConsecuentesSet;
			delete oObject.InformeCammesaSet;
			delete oObject.ComentariosSet;
			delete oObject.ENSRegXNS_NAV;
			delete oObject.SenialXNS_nav;
			delete oObject.PruebasXNS_nav;
		},

	};
});