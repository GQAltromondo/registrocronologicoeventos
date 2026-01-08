sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"transener/registrocronologicoeventos/utils/ModelHelper",
	"transener/registrocronologicoeventos/services/EquiposService",
	"transener/registrocronologicoeventos/services/NovedadesService",
	"transener/registrocronologicoeventos/services/SubindiceService",
	"transener/registrocronologicoeventos/services/MotivosService",
	"sap/ui/core/UIComponent"]
	, function (Controller, MessageBox, ModelHelper, EquiposService, NovedadesService, SubindiceService, MotivosService, UIComponent) {
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
				const oHistory = sap.ui.core.routing.History.getInstance();
				const sPrev = oHistory.getPreviousHash();

				if (sPrev !== undefined) {
					window.history.go(-1);
				} else {
					this.getOwnerComponent().getRouter().navTo("RouteMain", {}, true);
				}
			},

			onNavHome: function () {
				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "Shell-home"
					}
				});
			},
			onUbicacionChange: function (evt) {
				const oView = this.getView()
				var oEquiposModel = ModelHelper.getModel("EquiposModel", oView)
				ModelHelper.getModel("NovedadesFormJsonModel", oView).setProperty("/Equnr", "");
				var Empresa = ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety");
				var oSelectedItem = evt.getParameter("selectedItem");

				if (oSelectedItem) {
					var sKey = oSelectedItem.getKey();
					oEquiposModel.setProperty("/busy", true);
					EquiposService.LoadEquipos(sKey, Empresa);
				} else {
					sap.m.MessageToast.show("No se seleccionó ninguna ubicación.");
				}
			},
			inicioNoveChanged: function (evt) {
				const oView = this.getView()
				var date = evt.getSource().getDateValue();
				var valid = evt.getParameters().valid;

				if (date && valid) {
					ModelHelper.getModel("NovedadesFormJsonModel", oView).setProperty("/EntIndis", date);
					ModelHelper.getModel("CammesaFormJsonModel", oView).setProperty("/FechaHora", date);
					ModelHelper.getModel("ConsecuentesFormJsonModel", oView).setProperty("/FechaHora", date);
					this.getSubindice();
					var consecuenteModel = ModelHelper.getModel("ConsecuentesFormJsonModel", oView);
					var novedadesModel = ModelHelper.getModel("NovedadesFormJsonModel", oView);
					consecuenteModel.setProperty("/InicioNove", novedadesModel.getProperty("/InicioNove"));
					consecuenteModel.setProperty("/EntIndis", novedadesModel.getProperty("/EntIndis"));
				}
			},
			getSubindice: function () {
				const oView = this.getView()
				var CodNovedad = ModelHelper.getModel("NovedadesFormJsonModel", oView).getProperty("/CodNovedad");
				var Tplnr = ModelHelper.getModel("NovedadesFormJsonModel", oView).getProperty("/Tplnr");
				var Equnr = ModelHelper.getModel("NovedadesFormJsonModel", oView).getProperty("/Equnr");
				var InicioNove = ModelHelper.getModel("NovedadesFormJsonModel", oView).getProperty("/InicioNove");
				var CodTipo = ModelHelper.getModel("NovedadesFormJsonModel", oView).getProperty("/CodTipo");
				if (CodNovedad && Equnr && (Tplnr || this.lineas.includes(CodTipo)) && InicioNove) {
					SubindiceService.getSubindice(CodNovedad, Tplnr, Equnr, InicioNove);
				}
			},
			recierreChanged: function () {
				const oView = this.getView()
				var genIndisponibilidad = ModelHelper.getModel("NovedadesFormJsonModel", oView).getProperty("/GenIndisponibilidad");
				if (genIndisponibilidad === false) {
					ModelHelper.getModel("utilsModel", oView).setProperty("/editableDate", false);
					var novedadForm = ModelHelper.getModel("NovedadesFormJsonModel", oView).getData();
					delete (novedadForm.EntIndis);
					delete (novedadForm.EntDispo);
					delete (novedadForm.EntServicio);
					ModelHelper.getModel("NovedadesFormJsonModel", oView).refresh();
				} else {
					ModelHelper.getModel("utilsModel", oView).setProperty("/editableDate", true);
				}
			},
			onCheckBoxSelect: function (oEvent) {
				var oSelectedCheckBox = oEvent.getSource();
				var bSelected = oEvent.getParameter("selected");
				var utilsModel = this.getView().getModel("utilsModel");
				var empresa = utilsModel.getProperty("/CodEmpresa");
				var oModel = ModelHelper.getModel("NovedadesFormJsonModel");
				var oData = oModel.getData();

				var oHBox = oSelectedCheckBox.getParent();
				var aCheckBoxes = oHBox.getItems().filter(function (oItem) {
					return oItem.isA("sap.m.CheckBox");
				});

				if (bSelected) {
					aCheckBoxes.forEach(function (oCheckBox) {
						if (oCheckBox !== oSelectedCheckBox) {
							oCheckBox.setSelected(false);
						}
					});
				}

				var oChecked = aCheckBoxes.find(function (cb) {
					return cb.getSelected();
				});

				var sCheckedId = oChecked ? oChecked.getId().split("--").pop() : "";

				oData.Recierre = false;
				oData.GenIndisponibilidad = false;


				switch (sCheckedId) {
					case "chkRecierre":
						oData.CodNovedad = "P";
						oData.Recierre = true;

						break;

					case "chkDeseng":
						oData.CodNovedad = "P";
						oData.GenIndisponibilidad = true;
						break;

					case "chkRecDeseng":
						oData.CodNovedad = "P";
						oData.Recierre = true;
						oData.GenIndisponibilidad = true;
						break;

					case "chkEmergencia":
						oData.CodNovedad = "D";
						oData.GenIndisponibilidad = true;
						break;
				}
				this.recierreChanged()
				oModel.setData(oData);
				MotivosService.loadModel(oData.CodNovedad, empresa);
			}
			,
			onSaveNovedad: function () {

				if (!this.novedadesFormValid()) {
					MessageBoxHelper.alert("Existen campos de novedad vacios");

					return;
				}


				const oView = this.getView();
				const promises = [];

				const data = ModelHelper.getModel("NovedadesFormJsonModel", oView).getData();

				const oEditModel = ModelHelper.getModel("editModel", oView);
				const sMode = (oEditModel.getProperty("/mode") || "").toLowerCase();   // "create" | "edit"
				const bUiEditable = !!oEditModel.getProperty("/editableMode");

				console.log(data, "mode:", sMode, "uiEditable:", bUiEditable);

				// ===== Validaciones (SIN TOCAR) =====
				let bool = data.InicioNove <= data.EntIndis;

				if (data.EntDispo && data.EntServicio) {
					if (data.EntIndis > data.EntDispo || data.EntDispo > data.EntServicio) {
						bool = false;
					}
				} else if (data.EntDispo) {
					if (!(data.EntIndis < data.EntDispo)) {
						bool = false;
					}
				} else if (data.EntServicio) {
					MessageBox.alert("Si carga Ent. en servicio, debe cargar Ent. Disponibilidad");
					return;
				}

				if (!bool && (!data.Recierre || data.GenIndisponibilidad)) {
					MessageBox.show(
						" Ent. Indisponibilidad debe ser mayor que Inicio de Novedad\n" +
						" Ent. Disponibilidad debe ser mayor que Ent. Indisponibilidad\n" +
						" Ent. Servicio debe ser mayor que Ent. Disponibilidad\n"
					);
					return;
				}

				// (Opcional) si estás en edit pero UI NO editable, no dejes guardar
				if (sMode === "edit" && !bUiEditable) {
					MessageBox.alert("Activá 'Editar' antes de guardar.");
					return;
				}

				// ===== Decisión PUT / POST (CORRECTA) =====
				if (sMode === "edit") {
					promises.push(NovedadesService.PUT());
				} else {
					// default: create
					promises.push(NovedadesService.POST());
				}

				this.updateCounts = promises.length;

				Promise.all(promises.map(jQuery.proxy(this.reflectProgress, this)))
					.then((results) => {
						let message = "";
						let count = 0;

						if (!results[0].resolved) {
							message += "Error al guardar la novedad\n";
							count++;
						}

						if (count) {
							if (count !== 3) {
								message += "Todos los demás cambios se han guardado satisfactoriamente";
							}
							MessageBox.alert(message);
						} else {
							// ✅ Unblock SOLO si es EDIT (porque solo ahí bloqueaste)
							if (sMode === "edit") {
								NovedadesService.unblockNovedad(data.IdNovedad, oView);
							}

							// (Opcional) al guardar, podés volver a modo lectura
							// oEditModel.setProperty("/editableMode", false);
						}
					});
			},
			reflectProgress: function (promise) {
				var that = this;
				return promise.then(data => ({
					resolved: true,
					data: data
				}), err => ({
					resolved: false,
					err: err
				})).finally(() => {
					var advance = 100 / that.updateCounts;
					//avanzar progress bar TODO
				});
			},
			novedadesFormValid: function () {
				var oNovedadesModel = ModelHelper.getModel("NovedadesFormJsonModel",this.getView());
				var oRules = {
					CodNovedad: ["required"],
					CodTipo: ["required"],
					InicioNove: ["required", "date"],
					EntIndis: ["required", "date"],
					CodWeather: ["required"],
					CodDispAct: ["required"],
					CodAreaResp: ["required"],
					CodCausa: ["required"],
					//CodTipFalla: ["required"],
					//CodUbFalla: ["required"],
					//Tplnr: ["required"],
					Equnr: ["required"],
					CodMotivo: ["required"],
					GenIndisponibilidad: ["required"]
				};
				var novedad = oNovedadesModel.getProperty("/CodNovedad");
				if (novedad === "C") {
					delete (oRules.CodDispAct);
					delete (oRules.CodAreaResp);
					delete (oRules.CodWeather);
					delete (oRules.GenIndisponibilidad);
				}
				if (novedad === "I") {
					delete (oRules.CodDispAct);
				}
				if (novedad === "D") {
					delete (oRules.CodDispAct);
					//delete(oRules.EntIndis);
				}
				var tipo = oNovedadesModel.getProperty("/CodTipo");
				if (!this.lineas.includes(tipo)) {
					oRules.Tplnr = ["required"];
				}
				var recierre = oNovedadesModel.getProperty("/Recierre");
				var genIndisponibilidad = oNovedadesModel.getProperty("/GenIndisponibilidad");
				if (recierre && genIndisponibilidad === false) {
					delete (oRules.EntIndis);
				}
				var data = oNovedadesModel.getData();
				var bValid = ValidateHelper.make(data, oRules);
				oNovedadesModel.refresh(true);
				return !bValid;
			},

		});
	});