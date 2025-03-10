sap.ui.define([
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/ModelHelper"
], function (oDataServices, ModelHelper) {
	"use strict";
	return {
		// _entitySet: "/NSEquiposSet",
        _entitySet: "/EquiposSet",
		lineas: ["L1", "L2", "L3", "L4", "L5", "L6", "L9"],
		LoadEquipos: function (estatacionId,empresa) {
			var filters = [];
			if (!estatacionId) {
				this.onSuccessEquipos({
					results: []
				});
				return;
			}
			filters.push(new sap.ui.model.Filter("Estacion", sap.ui.model.FilterOperator.EQ, estatacionId));
            filters.push(new sap.ui.model.Filter("Empresa", sap.ui.model.FilterOperator.EQ, empresa));
			var odataModel = oDataServices.getModel();
			odataModel.read("/EquiposSet", {
				filters: filters,
				success: this.onSuccessEquipos,
				error: this.onErrorEquipos
			});
		},

		loadNSEquipos: function (tipo, estacion, empresa) {
			//var k = '"' + tipo + '"';
			var aFilter = [new sap.ui.model.Filter("IEmpresa", sap.ui.model.FilterOperator.EQ, empresa),
				new sap.ui.model.Filter("IEqart", sap.ui.model.FilterOperator.EQ, tipo)
			];
			if (!estacion && !this.lineas.includes(tipo)) {
				return;
			}
			if (this.lineas.includes(tipo)) {
				estacion = null;
			}
			if (estacion) {
				aFilter.push(new sap.ui.model.Filter("Estacion", sap.ui.model.FilterOperator.EQ, estacion));
			}
			var odataModel = oDataServices.getModel();
			odataModel.read("/NSEquiposSet", {
				filters: aFilter,
				success: this.onSuccessEquipos,
				error: this.onErrorEquipos
			});
		},
		onSuccessEquipos: function (data) {
			var Equipos = data.results;

			ModelHelper.getModel("EquiposModel").setData({
				Equipos: Equipos,
				busy: false
			});
		},
		onErrorEquipos: function () {},

	};
});