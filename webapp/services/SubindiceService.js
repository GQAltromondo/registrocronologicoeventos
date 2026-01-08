sap.ui.define([
	"sap/m/MessageBox",
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/ModelHelper"
], function ( MessageBox, oDataService, ModelHelper) {
	"use strict";

	return {
		getSubindice: function (CodNovedad, Tplnr, Equnr, EntIndis) {
			EntIndis.setSeconds(0,0);
			var formatEntIndis = sap.ui.model.odata.ODataUtils.formatValue(EntIndis, "Edm.DateTime")
			var entity = "/CalculoSubindiceSet(CodNovedad='" + CodNovedad + "',Tplnr='" + (Tplnr || "") + "',Equnr='" + Equnr + "',EntIndis=" + formatEntIndis +
				")";
			oDataService.getModel("TransenerOperaciones").read(entity, {
				success: function(data) {
					ModelHelper.getModel("NovedadesFormJsonModel").setProperty("/Subindice", parseInt(data.Subindice));
					if(parseInt(data.Subindice) > 0) {
						MessageBox.alert("Ya existe una novedad con estos datos");
					}
				},
				error: function(err) {
					//TODO
				}
			});
		},

	};
});