sap.ui.define([], function () {
	"use strict";
	return {

		getModel: function () {
			if (!this._model) {
				var url = "/sap/opu/odata/sap/Z_SCP_OPERACIONES_SRV/";
				this._model = new sap.ui.model.odata.v2.ODataModel(url, {
					useBatch: false
				});
			}
			return this._model;
		}
	};
});
