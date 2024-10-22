sap.ui.define(["transener/registrocronologicoeventos/utils/ModelHelper"], function (ModelHelper) {
	"use strict";
	return {
		oDialog: null,

		setPercentValues: function (iValue, sValue) {
			ModelHelper.getModel("ProgressBarJsonModel").setProperty("/PercentValue", iValue);
			ModelHelper.getModel("ProgressBarJsonModel").setProperty("/DisplayValue", sValue);
		},

		getDialog: function () {
			var oDialog = new sap.m.Dialog({
				title: "Cargando",
				content: [
					new sap.m.ProgressIndicator({
						percentValue: "{ProgressBarJsonModel>/PercentValue}",
						displayValue: "{ProgressBarJsonModel>/DisplayValue}",
						state: sap.ui.core.ValueState.Success
					})
				]
			}).addStyleClass("dialogProgress");
			this.oDialog = oDialog;
			return oDialog;
		},

		openDialog: function () {
			this.oDialog.open();
		},

		closeDialog: function () {
			this.oDialog.close();
		}
	};

});