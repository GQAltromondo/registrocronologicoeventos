sap.ui.define([
	//helpers
	"transener/registrocronologicoeventos/utils/FioriHelper",
	"transener/registrocronologicoeventos/utils/FioriComponentHelper",
	"transener/registrocronologicoeventos/utils/FormatHelper",
	"transener/registrocronologicoeventos/utils/i18nTranslationHelper",
	"transener/registrocronologicoeventos/utils/MessageBoxHelper",
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/ModelHelper"
], function (FioriHelper, FioriComponentHelper, FormatHelper, i18nTranslationHelper, MessageBoxHelper, oDataService, ModelHelper) {
	"use strict";

	return {
		//_entitySet: "/NSEquiposSet", //muchos entity set
		getInformeCammesa: function (filters) {
			return new Promise(function (resolve, reject) {
				oDataService.getModel("TransenerOperaciones").read("/NSInformeCammesaSet", {
					filters: filters,
					success: function (data) {
						resolve(data.results);
					},
					error: reject
				});
			});
		},
		
		getInformeDiario: function (filters) {
			return new Promise(function (resolve, reject) {
				oDataService.getModel("TransenerOperaciones").read("/NSInformeDiarioSet", {
					filters: filters,
					success: function (data) {
						resolve(data.results);
					},
					error: reject
				});
			});
		},
		
		getNovedadesPorTipoEquipo: function(filters) {
			return new Promise(function (resolve, reject) {
				oDataService.getModel("TransenerOperaciones").read("/NSInformeNovedadesxTipoSet", {
					filters: filters,
					success: function (data) {
						resolve(data.results);
					},
					error: reject
				});
			});
		},
		
		getDestinatarios: function (filters) {
			return new Promise(function (resolve, reject) {
				oDataService.getModel("TransenerOperaciones").read("/NSDestinatariosSet", {
					filters: filters,
					success: function (data) {
						resolve(data.results);
					},
					error: reject
				});
			});
		},
		
		getEnreSalidas: function (filters) {
			return new Promise(function (resolve, reject) {
				oDataService.getModel("TransenerOperaciones").read("/NSEnreSalidasSet", {
					filters: filters,
					success: function (data) {
						resolve(data);
					},
					error: reject
				});
			});
		},
		
		getEnreTransformaciones: function (filters) {
			return new Promise(function (resolve, reject) {
				oDataService.getModel("TransenerOperaciones").read("/NSEnreTransformacionesSet", {
					filters: filters,
					success: function (data) {
						resolve(data);
					},
					error: reject
				});
			});
		},
		
		getEnrePotReactiva: function (filters) {
			return new Promise(function (resolve, reject) {
				oDataService.getModel("TransenerOperaciones").read("/NSEnrePotReactivaSet", {
					filters: filters,
					success: function (data) {
						resolve(data);
					},
					error: reject
				});
			});
		},
		
		getEnreCapacidadTransp: function (filters) {
			return new Promise(function (resolve, reject) {
				oDataService.getModel("TransenerOperaciones").read("/NSEnreCapacidadTranspSet", {
					filters: filters,
					success: function (data) {
						resolve(data);
					},
					error: reject
				});
			});
		},
		
		getEns: function (filters) {
			return new Promise(function (resolve, reject) {
				oDataService.getModel("TransenerOperaciones").read("/NSInformeENSSet", {
					filters: filters,
					success: function (data) {
						resolve(data);
					},
					error: reject
				});
			});
		},
		//LN 220 Y 132
		getEnre390LN220: function(filters) {
			return new Promise(function(resolve, reject) {
				oDataService.getModel("TransenerOperaciones").read("/Enre390Ln220132Set", {
					filters: filters,
					success: function (data) {
						resolve(data);
					},
					error: reject
				});
			});
		},
		
		getEnre390LN500: function(filters) {
			return new Promise(function(resolve, reject) {
				oDataService.getModel("TransenerOperaciones").read("/Enre390Ln500Set", {
					filters: filters,
					success: function (data) {
						resolve(data);
					},
					error: reject
				});
			});
		},
		
		getEnre390TrafoTR: function(filters) {
			return new Promise(function(resolve, reject) {
				oDataService.getModel("TransenerOperaciones").read("/Enre390TrafoTRSet", {
					filters: filters,
					success: function (data) {
						resolve(data);
					},
					error: reject
				});
			});
		},
		
		getEnre390TrafoTRTI: function(filters) {
			return new Promise(function(resolve, reject) {
				oDataService.getModel("TransenerOperaciones").read("/Enre390TrafoTRTISet", {
					filters: filters,
					success: function (data) {
						resolve(data);
					},
					error: reject
				});
			});
		},
		
		getEnre390Ln500TI: function(filters) {
			return new Promise(function(resolve, reject) {
				oDataService.getModel("TransenerOperaciones").read("/Enre390Ln500TISet", {
					filters: filters,
					success: function (data) {
						resolve(data);
					},
					error: reject
				});
			});
		},
		
		getEnre390: function(fechaDesde, fechaHasta) {
			//return Promise.resolve(true);
			var filters = [new sap.ui.model.Filter({
				path: "Fecha",
				operator: sap.ui.model.FilterOperator.BT,
				value1: fechaDesde,
				value2: fechaHasta
			})];
			
			var promises = [];
			promises.push(this.getEnre390LN500(filters));
			promises.push(this.getEnre390LN220(filters));
			promises.push(this.getEnre390TrafoTR(filters));
			promises.push(this.getEnre390TrafoTRTI(filters));
			promises.push(this.getEnre390Ln500TI(filters));
			return Promise.all(promises);
		},
		
		
		
		
		

	};
});