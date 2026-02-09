sap.ui.define([
	"transener/registrocronologicoeventos/controller/BaseController",
	"transener/registrocronologicoeventos/utils/formatter",
	"transener/registrocronologicoeventos/utils/ModelHelper",
	"transener/registrocronologicoeventos/utils/Constants",
	"transener/registrocronologicoeventos/services/EquiposService",
    "transener/registrocronologicoeventos/services/CausasService",

], function (BaseController,formatter, ModelHelper, Constants, EquiposService,CausasService) {
	"use strict";
	var oDialog = null;

	return BaseController.extend("transener.registrocronologicoeventos.controller.Perturbaciones", {
		formatter: formatter,
		onInit: function () {
			this.getOwnerComponent().getRouter()
				.getRoute("Perturbaciones")
				.attachPatternMatched(this._onRouteMatched, this);

			ModelHelper.getModel("ConsequentListJsonModel", this.getView())
		},
		_onRouteMatched: function (oEvent) {
			const oArgs = oEvent.getParameter("arguments") || {};
			const sMode = (oArgs.mode || "edit").toLowerCase();
			const oView = this.getView();

			// Modo (create/edit/view) para reutilizar la vista
			const oEditModel = sap.ui.getCore().getModel("editModel") || oView.getModel("editModel");
			const oUtilsModel = ModelHelper.getModel("utilsModel", oView);

			if (oEditModel) {
				oEditModel.setProperty("/mode", sMode);
				// Si es modo "view", configurar readOnlyMode en utilsModel
				if (sMode === Constants.EDIT_MODES.VIEW) {
					oEditModel.setProperty("/editableMode", false);
					if (oUtilsModel) {
						oUtilsModel.setProperty("/readOnlyMode", true);
					}
				} else {
					oEditModel.setProperty("/editableMode", sMode === Constants.EDIT_MODES.CREATE ? true : oEditModel.getProperty("/editableMode"));
					if (oUtilsModel) {
						oUtilsModel.setProperty("/readOnlyMode", false);
					}
				}
			}
			this.getNSInfo()
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
		getNSInfo: function () {
			var Empresa = ModelHelper.getModel("Empresa", this.getView()).getProperty("/selectedSociety");
			const oNovedad = ModelHelper.getModel("NovedadesFormJsonModel").getData()
			EquiposService.LoadEquipos(oNovedad.Tplnr, Empresa)
			CausasService.loadModel(oNovedad.CodNovedad, oNovedad.CodMotivo, Empresa)
		},
		onMotivoChange: function () {
			var Empresa = ModelHelper.getModel("Empresa", this.getView()).getProperty("/selectedSociety");
			const NovedadModel = ModelHelper.getModel("NovedadesFormJsonModel")
			const oNovedad = NovedadModel.getData()
			NovedadModel.setProperty("/CodCausa", "")
			CausasService.loadModel(oNovedad.CodNovedad, oNovedad.CodMotivo, Empresa)
		}
	});
});