sap.ui.define([], function () {
	"use strict";
	return {
		_getBaseUrl: function () {

			var mBaseUrl = sap.ui.getCore().getModel("appCurrentInfo").appUrl;
			return mBaseUrl;
		},
		getModel: function () {
			if (!this._model) {
				var url = "/sap/opu/odata/sap/Z_SCP_OPERACIONES_SRV/";
				var baseurl = this._getBaseUrl();
				var url = baseurl + "/destinations/SAP_Gateway/sap/opu/odata/sap/Z_SCP_OPERACIONES_SRV"

				this._model = new sap.ui.model.odata.v2.ODataModel(url, {
					useBatch: false
				});
			}
			return this._model;
		}
	};
});
