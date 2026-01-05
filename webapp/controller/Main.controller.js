jQuery.sap.require("transener/registrocronologicoeventos/libs/xlsx");
jQuery.sap.require("transener/registrocronologicoeventos/libs/jszip");
sap.ui.define([
	"transener/registrocronologicoeventos/controller/BaseController",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"sap/m/MessageStrip",
	"sap/m/VBox",
	"sap/m/Dialog",
	"transener/registrocronologicoeventos/services/UserService",
	"transener/registrocronologicoeventos/services/PerturbacionesService",
	"transener/registrocronologicoeventos/services/DispActuantesService",
	"transener/registrocronologicoeventos/services/TipificacionesFallasService",
	"transener/registrocronologicoeventos/services/EstadoTiempoService",
	"transener/registrocronologicoeventos/services/MotivosService",
	"transener/registrocronologicoeventos/services/ClimasService",
	"transener/registrocronologicoeventos/services/CausasService",
	"transener/registrocronologicoeventos/services/NovedadesService",
	"transener/registrocronologicoeventos/services/TiposNovedadesService",
	"transener/registrocronologicoeventos/services/EmpresaTramitacionService",
	"transener/registrocronologicoeventos/services/PersonalHabilitadoService",
	"transener/registrocronologicoeventos/services/LicenciaService",
	"transener/registrocronologicoeventos/services/EquiposService",
	"transener/registrocronologicoeventos/services/ReportesService",
	"transener/registrocronologicoeventos/services/EstacionesService",
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/formatter",
	"transener/registrocronologicoeventos/utils/ModelHelper",
	"transener/registrocronologicoeventos/utils/ValidateHelper",
	"transener/registrocronologicoeventos/utils/MessageBoxHelper",
	"transener/registrocronologicoeventos/utils/FormatHelper"
], function (BaseController, MessageToast, Filter, FilterOperator, JSONModel, Fragment, MessageBox, MessageStrip, VBox, Dialog, UserService,
	PerturbacionesService, DispActuantesService, TipificacionesFallasService, EstadoTiempoService, MotivosService, ClimasService,
	CausasService,
	NovedadesService, TiposNovedadesService, EmpresaTramitacionService,
	PersonalHabilitadoService, LicenciaService, EquiposService, ReportesService, EstacionesService, oDataService, formatter, ModelHelper, ValidateHelper,
	MessageBoxHelper,
	FormatHelper) {
	"use strict";
	var oDialog = null;

	return BaseController.extend("transener.registrocronologicoeventos.controller.Main", {
		testOperators: ["Bonavita", "Vandale", "Burbaud"],
		_expandProperties: "ConsecuentesSet,InformeCammesaSet,ComentariosSet,ENSRegXNS_NAV,SenialXNS_nav,PruebasXNS_nav",
		_valueHelpDialog3: null,
		currentUser: {},
		lineas: ["L1", "L2", "L3", "L4", "L5", "L6", "L9"],
		formatter: formatter,
		onInit: function () {
			this.getBaseURL()
			this.getVersion()
			this.globalBusyDialog = new sap.m.BusyDialog();
			UserService.loadModel()
			this.getView().setModel();
			this.getView().getModel('LGuardias')

		},

		loadModels: function () {
			var oView = this.getView()
			ModelHelper.getModel("utilsModel", oView)
			ModelHelper.getModel('MotivosJsonModel', oView)
			ModelHelper.getModel('EquiposModel', oView)
			ModelHelper.getModel('ClimasJsonModel', oView)
			ModelHelper.getModel('CausasJsonModel', oView)
			ModelHelper.getModel("NovedadesFormJsonModel", oView)
			ModelHelper.getModel("EmpresaTramitacionJsonModel", oView)
			ModelHelper.getModel("PersonalHabilitadoModel", oView)
			ModelHelper.getModel("InformeFiltersJsonModel", oView)
			ModelHelper.getModel("NovedadesPorEquiposJsonModel", oView)
			ModelHelper.getModel("EstacionesJsonModel", oView)
			ModelHelper.getModel("RegionesEnsJsonModel", oView)
			ModelHelper.getModel("editModel", oView).setData({ "isEdit": false })
			ModelHelper.getModel("formPerturbacionesModel", oView).setData({
				"chkRecierre": false,
				"chkRecDeseng": false,
				"chkDeseng": false,
				"chkEmergencia": false
			})
			ModelHelper.getModel('oNovedadesModel', oView).setData({ data: [], count: 0 })
			ModelHelper.getModel('oPerturbacionesModel', oView).setData({ data: [], count: 0 })
			ModelHelper.getModel('oTProgramadasModel', oView).setData({ data: [], count: 0 })
			ModelHelper.getModel('oFilteredModel', oView).setData({ data: [], count: 0 })

			this.loadModelsData()
		},
		loadModelsData: function () {
			var Empresa = ModelHelper.getModel("Empresa", this.getView()).getProperty("/selectedSociety");
			ClimasService.loadModel()
			CausasService.loadModel()
			DispActuantesService.loadModel();
			EstadoTiempoService.loadModel();
			TipificacionesFallasService.loadModel();
			//TODO cambiar a empresa seleccionada
			this.loadTipoNovedades(this.society);
			this.loadEstaciones();

			this.loadTipoEquipo();
			TiposNovedadesService.loadModel()

			EmpresaTramitacionService.loadTramitacion(Empresa)

			PersonalHabilitadoService.getPersonalPromise(Empresa);
		},
		getBaseURL: function () {

			var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");

			//var appId = this.getManifestEntry("/sap.app/id");
			var appPath = appId.replaceAll(".", "/");
			var appModulePath = jQuery.sap.getModulePath(appPath);

			var jsonModel = sap.ui.getCore().getModel("appCurrentInfo");
			//checks if the model exists
			if (!jsonModel) {
				jsonModel = new sap.ui.model.json.JSONModel();
				jsonModel.setSizeLimit(9999);
				jsonModel.appUrl = appModulePath;
				sap.ui.getCore().setModel(jsonModel, "appCurrentInfo");
				//initilializing = appModulePath; 
				jsonModel.setData({});
			}
			return appModulePath;

		},

		onAfterRendering: function () {
			this.loadSociety();



		},
		onComboBoxChange: function (oEvent) {
			var sSelectedKey = oEvent.getSource().getSelectedKey();
			var sFragmentPath;
			if (sSelectedKey) {
				sFragmentPath = "transener.registrocronologicoeventos.fragments.novedades." + sSelectedKey;
			}

			this.openDialog(sFragmentPath)

		},
		onSelectionChange: function (oEvent) {

			var oSource = oEvent.getSource();
			var sSelectedKey = oSource.getSelectedKey();

			// Referencia al ComboBox que necesita actualizarse
			var oComboBox = this.byId("cmbPlaceTeam");

			// Encuentra el item que corresponde con el selectedKey
			var aItems = oComboBox.getItems();
			for (var i = 0; i < aItems.length; i++) {
				var oItem = aItems[i];
				if (oItem.getKey() === sSelectedKey) {
					oComboBox.setSelectedItem(oItem);
					break;
				}
			}
		},
		handleChangeF: function (evt) {

			var estacion = evt.getParameter("value");
			var codigo = evt.getSource().getSelectedKey();

			//var tipo = this.byId("TipoEquipoFilter").getSelectedKey();

			// equiposModel.setData({
			// 	Equipos: [],
			// 	busy: true
			// });
			EquiposService.LoadEquipos(codigo, "100");
			if (!estacion) {
				this.getView().byId("EquipoFilter").setEnabled(true);
			}
		},
		loadSociety: async function () {
			const that = this;
			let oBusyDialog = that.crearDialogoBusy();
			that.abrirDialogoBusy(oBusyDialog);

			const bIsLocal = window.location.hostname.includes("applicationstudio.cloud.sap");

			if (bIsLocal) {
				that.InitSociety();
				that.cerrarDialogoBusy(oBusyDialog);
				return;
			}

			let oModelOperaciones = this.getView().getModel("Operaciones");

			try {
				await new Promise((resolve, reject) => {
					oModelOperaciones.read("/EmpresaUsuarioSet", {
						success: function (data) {
							resolve(data);
							let empresa = data.results[0].Empresa;
							if (empresa == 999) {
								that.InitSociety();
							} else {
								ModelHelper.getModel("Empresa", that.getView()).setProperty("/selectedSociety", empresa)
								that.society = empresa;

								that.loadModels()
							}
							that.cerrarDialogoBusy(oBusyDialog);
						},
						error: function (oError) {
							reject(oError);
							that.cerrarDialogoBusy(oBusyDialog);
						}
					});
				});
			} catch (err) {
				console.log(err);
				throw err;
			}


		},
		crearDialogoBusy: function () {
			let oDialogoBusy = new sap.m.BusyDialog({
				title: "Actualizando datos...",
				text: "Espere un momento por favor",
				showCancelButton: false
			});
			return oDialogoBusy;
		},
		abrirDialogoBusy: function (data) {
			data.open();
		},
		cerrarDialogoBusy: function (data) {
			data.close();
		},
		loadTipoNovedades: function (Empresa) {
			var that = this;
			var filters = [];
			filters.push(new sap.ui.model.Filter("Empresa", sap.ui.model.FilterOperator.EQ, Empresa));
			var oModeld = this.getView().getModel("LGuardias");
			oModeld.read("/TipoNovedadSet", {
				/*urlParameters: {
					$expand: "TurnoUsuarioSet"
				},*/
				filters: filters,
				success: function (data) {
					ModelHelper.getModel("Novedades", that.getView()).setData({ novs: data.results })

				},
				error: function (err) {
					//do something;
				}
			});
		},
		InitSociety: function () {
			var oNavigation = performance.getEntriesByType("navigation")[0];
			if (!sessionStorage.getItem("empresa") || (oNavigation && oNavigation.type !== "reload")) {
				this.dialogSociety = new sap.m.Dialog({
					type: sap.m.DialogType.Message,
					title: "Selección de Empresa",
					escapeHandler: function (oPromise) {
						oPromise.reject();
					},
					content: [
						new sap.m.VBox({
							items: [
								new sap.m.Label({ text: "Debe seleccionar la empresa:" }),
								new sap.m.Select({
									selectedKey: "{Society>/Code}",
									change: [this.ValidateCombo, this],
									items: {
										path: "Society>/Empresas",
										template: new sap.ui.core.Item({
											key: "{Society>Code}",
											text: "{Society>Name}"
										})
									}
								})
							]
						})
					],
					buttons: [
						new sap.m.Button({
							icon: "sap-icon://save",
							type: sap.m.ButtonType.Emphasized,
							text: "Guardar",
							press: [this.onSelectedSociety, this]
						})
					]
				});


				var oModel = new sap.ui.model.json.JSONModel({
					Code: "",
					Empresas: [
						{ Code: "", Name: "Elija Uno" },
						{ Code: "100", Name: "TRANSENER S.A." },
						{ Code: "300", Name: "TRANSBA S.A." }
					]
				});

				this.dialogSociety.setModel(oModel, "Society");
				this.dialogSociety.open();
			} else {
				this.society = sessionStorage.getItem("empresa");

			}
		}
		,
		onSelectedSociety: function () {
			var empresa = this.dialogSociety.getModel("Empresa").getData().Code;

			if (empresa !== "" && typeof empresa !== "undefined") {

				ModelHelper.getModel("Empresa", this.getView()).setProperty("/selectedSociety", empresa);


				// this.loadTipoNovedades();
				// this.loadEstaciones();

				// //this.loadLineas();
				//this.loadTipoEquipo();
				this.loadModels()
				//	this.byId("FromDateFilter").setDateValue(this.dateWeekAgo());

				// this.byId("smartFilterBar").search();

				//var oBinding = this.getView().byId("innerUi5Table").getBinding("items");
				/*if(oBinding)*/
				//oBinding.filter([new Filter("Empresa", sap.ui.model.FilterOperator.EQ, this.society)]); //apply the filter
				this.dialogSociety.close();
			} else {
				MessageBox.alert("Debe seleccionar una de empresa!", {
					title: "Selección de Empresa"
				});
			}
		},
		loadEstaciones: function () {
			var that = this;
			var oModeld = this.getView().getModel("Operaciones");
			var filters = [];
			filters.push(new sap.ui.model.Filter("Empresa", sap.ui.model.FilterOperator.EQ, this.society));
			oModeld.read("/EstacionesSet", {
				/*urlParameters: {
					$expand: "TurnoUsuarioSet"
				},*/
				filters: filters,
				success: function (data) {

					var model = new sap.ui.model.json.JSONModel({
						Estaciones: data.results
					});
					model.setSizeLimit(10000);
					that.getView().setModel(model, "Estaciones");
					sap.ui.getCore().setModel(model, "Estaciones");
				},
				error: function (err) {
					//do something;
				}
			});
		},
		loadTipoEquipo: function () {
			var that = this;
			var oModeld = this.getView().getModel("Operaciones");
			var filters = [];
			filters.push(new sap.ui.model.Filter("Empresa", sap.ui.model.FilterOperator.EQ, this.society));
			oModeld.read("/TipoEquipoSet", {
				filters: filters,
				success: function (data) {
					var model = new sap.ui.model.json.JSONModel({
						Tipo: data.results
					});
					model.setSizeLimit(10000);
					that.getView().setModel(model, "TipoModel");
					sap.ui.getCore().setModel(model, "TipoModel");
				},
				error: function (err) {
					//do something;
				}
			});
		},


		ValidateCombo: function (oEvent) {
			var society = this.dialogSociety.getModel("Society").getData().Code;
			//  sessionStorage.setItem("empresa", society);
			if (society !== "") {
				oEvent.getSource().setValueState("None");
			} else {
				oEvent.getSource().setValueState("Error");
			}
		},
		// onEditP: function (oEvent) {
		// 	ModelHelper.getModel("editModel").setProperty("/editableMode", true);
		// 	var oButton = oEvent.getSource();
		// 	var oColumnListItem = oButton.getParent();
		// 	const formPerturbaciones = ModelHelper.getModel("formPerturbacionesModel").getData()

		// 	var oContext = oColumnListItem.getBindingContext("oPerturbacionesModel");
		// 	var oSelectedData = oContext.getObject();

		// 	// Guarda los datos seleccionados en el modelo
		// 	ModelHelper.getModel("NovedadesFormJsonModel").setData(oSelectedData);


		// 	if (oSelectedData.CodNovedad === "P" && oSelectedData.Recierre && oSelectedData.GenIndisponibilidad) {
		// 		formPerturbaciones.chkRecDeseng = true
		// 	} else if (oSelectedData.CodNovedad === "P" && oSelectedData.Recierre) {
		// 		formPerturbaciones.chkRecierre = true
		// 	} else if (oSelectedData.CodNovedad === "P" && oSelectedData.GenIndisponibilidad) {
		// 		formPerturbaciones.chkDeseng = true
		// 	} else if (oSelectedData.CodNovedad === "D" && oSelectedData.GenIndisponibilidad && oSelectedData.Forzada) {
		// 		formPerturbaciones.chkEmergencia = true
		// 	}
		// 	EquiposService.LoadEquipos(oSelectedData.Tplnr, "100")
		// 	MotivosService.loadModel(oSelectedData.CodNovedad, "100")

		// 	this.openDialog("transener.registrocronologicoeventos.fragments.forms.formPerturbaciones")
		// },
		// onEditProg: function (oEvent) {
		// 	var oButton = oEvent.getSource();
		// 	var oColumnListItem = oButton.getParent();


		// 	var oContext = oColumnListItem.getBindingContext("oTProgramadasModel");
		// 	var oSelectedData = oContext.getObject();


		// 	ModelHelper.getModel("NovedadesFormJsonModel").setData(oSelectedData);


		// 	EquiposService.LoadEquipos(oSelectedData.Tplnr, "100")
		// 	MotivosService.loadModel(oSelectedData.CodNovedad, "100")
		// 	this.openDialog("transener.registrocronologicoeventos.fragments.forms.formProgramadas")
		// },
		onEditNove: function (oEvent) {
			var oButton = oEvent.getSource();
			var oColumnListItem = oButton.getParent();


			var oContext = oColumnListItem.getBindingContext("oNovedadesModel");
			var oSelectedData = oContext.getObject();

			// Guarda los datos seleccionados en el modelo
			ModelHelper.getModel("NovedadesFormJsonModel").setData(oSelectedData);



			this.openDialog("transener.registrocronologicoeventos.fragments.forms.formNovedades")
		},

		onCloseDialog: function () {

			if (oDialog) {
				oDialog.close();
				oDialog.destroy()
				oDialog = null
			}
		},

		onSearchLGuard: function (evt) {
			var generales = []
			var novedades = [];
			var perturbaciones = [];
			var trabajosProgramados = [];

			var oView = this.getView();
			var oTable = oView.byId("generalTable"),
				oTableNS = oView.byId("tableNovedades"),
				oTablePS = oView.byId("tablePerturbaciones"),
				oTableTP = oView.byId("tableProgramadas")

			oTable.setBusy(true)
			oTableNS.setBusy(true)
			oTablePS.setBusy(true)
			oTableTP.setBusy(true)

			var oGuardiasSetModel = this.getView().getModel('LGuardias')

			var oOperacionesSetModel = this.getView().getModel('Operaciones')

			ModelHelper.getModel('oNovedadesModel')
			ModelHelper.getModel('oPerturbacionesModel')
			ModelHelper.getModel('oTProgramadasModel')

			var serverFilters = [];
			var NSFilters = [];
			var oMs = sap.ui.getCore().byId("msgStrip");
			if (oMs) {
				oMs.destroy();
			}
			var lugarFilter = this.byId("LugarFilter").getSelectedKey();
			var lugarValue = this.byId("LugarFilter").getSelectedItem()?.getText();
			var novedadesFilter = this.byId("NovedadesFilter").getSelectedKeys();
			var tipoEquipoFilter = this.byId("EquipoFilter").getSelectedKey();
			var FromDateFilter = this.byId("FromDateFilter").getDateValue();
			var ToDateFilter = this.byId("ToDateFilter").getDateValue();
			var InitialDate = this.byId("InitialDate").getDateValue();


			if (lugarFilter) {
				serverFilters.push(
					new Filter("Lugar", FilterOperator.EQ, lugarFilter)
				);
				NSFilters.push(
					new Filter("Tplnr", FilterOperator.EQ, lugarValue)
				);
			}

			if (novedadesFilter && novedadesFilter.length > 0) {

				var novedadesArrayFilters = []

				novedadesFilter.forEach(nov => {
					novedadesArrayFilters.push(new Filter("Tiponovedad", FilterOperator.EQ, nov))
				})

				var novFilter = new Filter(novedadesArrayFilters, false)
				serverFilters.push(novFilter)
			}

			if (tipoEquipoFilter) {
				serverFilters.push(
					new Filter("Equipo", FilterOperator.EQ, tipoEquipoFilter)
				);
				NSFilters.push(
					new Filter("Equnr", FilterOperator.EQ, tipoEquipoFilter)
				);
			}

			if (FromDateFilter && ToDateFilter) {
				serverFilters.push(new sap.ui.model.Filter({
					path: "Fechahora",
					operator: sap.ui.model.FilterOperator.BT,
					value1: FromDateFilter,
					value2: ToDateFilter
				}))
				NSFilters.push(new sap.ui.model.Filter({
					path: "InicioNove",
					operator: sap.ui.model.FilterOperator.BT,
					value1: FromDateFilter,
					value2: ToDateFilter
				}));
			}
			if (InitialDate) {
				serverFilters.push(new sap.ui.model.Filter({
					path: "Fechahora",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: InitialDate
				}))
				NSFilters.push(new sap.ui.model.Filter({
					path: "InicioNove",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: new Date(InitialDate)
				}));
			}

			oGuardiasSetModel.read('/GuardiasListSet', {
				filters: serverFilters,
				success: (data) => {
					generales.push(...data.results);
					oTable.setShowOverlay(false);
					oTable.setBusy(false)
					console.log(data)
				},
				error: (error) => {
					console.log(error)
					oTable.setBusy(false)
				}
			})

			oOperacionesSetModel.read('/NovedadesServicioSet', {
				filters: NSFilters,
				urlParameters: {
					"$expand": this._expandProperties
				},
				success: (data) => {

					data.results.forEach(function (item) {
						if (item.CodNovedad === 'P' || item.CodNovedad === 'C') {
							perturbaciones.push(item);
						} else {
							trabajosProgramados.push(item);
						}
					});



					ModelHelper.getModel('oNovedadesModel').setData({ data: generales, count: generales.length })
					ModelHelper.getModel('oPerturbacionesModel').setData({ data: perturbaciones, count: perturbaciones.length })
					ModelHelper.getModel('oTProgramadasModel').setData({ data: trabajosProgramados, count: trabajosProgramados.length })
					ModelHelper.getModel('oFilteredModel').setData({ data: data.results, count: data.results.length });


					oTableNS.setBusy(false)
					oTablePS.setBusy(false)
					oTableTP.setBusy(false)
					oTableNS.setShowOverlay(false);
					oTablePS.setShowOverlay(false);
					oTableTP.setShowOverlay(false);

					console.log(data)
				},
				error: (error) => {
					console.log(error)
					oTableNS.setBusy(false)
					oTablePS.setBusy(false)
					oTableTP.setBusy(false)
					oTableNS.setShowOverlay(false);
					oTablePS.setShowOverlay(false);
					oTableTP.setShowOverlay(false);
				}
			})

		},
		onSelectionChange: function () {
			this.getView().byId("generalTable").setShowOverlay(true);
			this.getView().byId("tableNovedades").setShowOverlay(true);
			this.getView().byId("tablePerturbaciones").setShowOverlay(true);
			this.getView().byId("tableProgramadas").setShowOverlay(true);
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
		onClearFilters: function () {
			var oView = this.getView();
			oView.byId("LugarFilter").setSelectedKey("");
			oView.byId("EquipoFilter").setSelectedKey("");
			oView.byId("NovedadesFilter").setSelectedItems("");
			oView.byId("FromDateFilter").setValue(null);
			oView.byId("ToDateFilter").setValue(null);
			oView.byId("InitialDate").setValue(null);
			oView.byId("fastSearch").setValue(null);
		},
		openDialog: function (fragment) {
			if (oDialog) {
				oDialog.destroy();
			}

			return Fragment.load({
				name: fragment,
				controller: this,
				type: "XML"
			}).then(
				function (oFragment) {
					oDialog = oFragment;
					this.getView().addDependent(oDialog);
					oDialog.open();
				}.bind(this)
			);

		},
		onTabSelect: function (oEvent) {
			var selectedKey = oEvent.getParameter("key");

		},
		closeDialog: function () {
			if (oDialog) {
				oDialog.close();
			}
		},
		dateWeekAgo: function () {
			var now = new Date();
			return new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
		},
		_getNroNovedad: function (oResult, oLocalData) {
			// oResult puede venir de create/update; oLocalData es tu "data" del modelo
			return oResult?.IdNovedad || oLocalData?.IdNovedad || "";
		},

		_showSaveMessage: function (bEditable, sId) {
			const sAction = bEditable ? "Se actualizó" : "Se creó";
			const sText = sId
				? `${sAction} la novedad número ${sId}`
				: `${sAction} la novedad`;

			sap.m.MessageToast.show(sText, { duration: 4000 });
		},

		onSaveNovedad: function () {
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
		}

		,
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
		onDelete: function () {
			MessageToast.show("Delete Pressed");
		},
		onCheckBoxSelect: function (oEvent) {
			var oSelectedCheckBox = oEvent.getSource();
			var bSelected = oEvent.getParameter("selected");
			var utilsModel = this.getView().getModel("utilsModel");
			const empresa = utilsModel.getProperty("/CodEmpresa")
			const oModel = ModelHelper.getModel("NovedadesFormJsonModel")
			if (bSelected) {
				// Obtener todos los CheckBoxes en el HBox
				var oHBox = oSelectedCheckBox.getParent();
				var aCheckBoxes = oHBox.getItems().filter(function (oItem) {
					return oItem.isA("sap.m.CheckBox");
				});

				// Desmarcar todos los demás CheckBoxes
				aCheckBoxes.forEach(function (oCheckBox) {
					if (oCheckBox !== oSelectedCheckBox) {
						oCheckBox.setSelected(false);
					}
				});
			}

			var oData = oModel.getData();

			console.log(oSelectedCheckBox.getId())

			switch (oSelectedCheckBox.getId()) {
				case "chkRecierre":
					oData.CodNovedad = "P"
					oData.Recierre = bSelected;
					break;
				case "chkDeseng":
					oData.CodNovedad = "P"
					oData.GenIndisponibilidad = bSelected;
					break;
				case "chkRecDeseng":
					oData.CodNovedad = "P"
					oData.Recierre = bSelected;
					oData.GenIndisponibilidad = bSelected;
					break;
				case "chkEmergencia":
					oData.CodNovedad = "D"
					oData.GenIndisponibilidad = bSelected;
					break;
			}
			oModel.setData(oData)

			MotivosService.loadModel(oModel.getProperty("/CodNovedad"), empresa)

			console.log(oData)
		},
		novedadesFormValid: function () {
			var oNovedadesModel = ModelHelper.getModel("NovedadesFormJsonModel");
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
		resetNovedadesModel: function () {
			const oView = this.getView();
			const oModel = ModelHelper.getModel("NovedadesFormJsonModel", oView);

			// evita cache (útil en FLP / cambios frecuentes)
			const sUrl = sap.ui.require.toUrl("transener/registrocronologicoeventos/model/NovedadesFormJsonModel.json")
				+ "?_ts=" + Date.now();

			return new Promise((resolve, reject) => {
				oModel.attachRequestCompleted(function onDone() {
					oModel.detachRequestCompleted(onDone);
					resolve(oModel.getData());
				});

				oModel.attachRequestFailed(function onFail(oEvent) {
					oModel.detachRequestFailed(onFail);
					reject(oEvent.getParameter("message") || "No se pudo cargar el JSON de Novedades");
				});

				oModel.loadData(sUrl, null, true /* async */);
			});
		},



		onEditPerturbacion: function (sIdNovedad) {
			const oView = this.getView();
			ModelHelper.getModel("editModel", oView).setProperty("/editableMode", false); // si querés entrar “ver” y luego Edit
			// o true si querés entrar directamente editando

			this.getOwnerComponent().getRouter().navTo(
				"Perturbaciones",
				{ mode: "edit" },
				{ query: { id: sIdNovedad } }
			);
		},

		onPerturbacionesPress: function () {
			const oView = this.getView();
			ModelHelper.getModel("editModel", oView).setProperty("/editableMode", true);

			this.resetNovedadesModel(); // deja modelos en blanco/default
			this.getOwnerComponent().getRouter().navTo("Perturbaciones", { mode: "create" });
		},

		onProgramadasPress: function () {
			const oView = this.getView();
			ModelHelper.getModel("editModel", oView).setProperty("/editableMode", true);
			this.resetNovedadesModel()
			this.getOwnerComponent().getRouter().navTo("Programadas", { mode: "create" });
		},
		onNovedadesPress: function () {
			this.resetNovedadesModel()
			this.openDialog("transener.registrocronologicoeventos.fragments.forms.formNovedades");
		},
		//Reporte informe Diario
		filtersInformeDiario: function () {
			var that = this;
			var model = ModelHelper.getModel("InformeFiltersJsonModel");
			model.setData({});

			if (this.society == 300) {
				var fromDate = new Date();
				fromDate.setDate(fromDate.getDate() - 1)
				model.setProperty("/desde", fromDate);
				model.setProperty("/hasta", new Date());
			}

			this.dialogReportesDBF = new sap.m.Dialog({
				type: sap.m.DialogType.Message,
				title: "Informe Diario",
				escapeHandler: function (oPromise) {
					oPromise.reject();
				},
				content: [
					new sap.m.VBox({
						items: [
							new sap.m.HBox({
								items: [
									new sap.m.HBox({
										alignItems: "Center",
										items: [
											new sap.m.Label({
												text: "Desde",
												width: "90px"
											}).addStyleClass("CustomLabel"),
											new sap.m.DatePicker({
												dateValue: "{InformeFiltersJsonModel>/desde}",
											})
										]
									}).addStyleClass("sapUiTinyMarginEnd"),
									new sap.m.HBox({
										alignItems: "Center",
										items: [
											new sap.m.Label({
												text: "Hasta",
												width: "90px"
											}).addStyleClass("CustomLabel"),
											new sap.m.DatePicker({
												dateValue: "{InformeFiltersJsonModel>/hasta}",
											})
										]
									})
								]
							})
						]
					})
				],
				buttons: [
					new sap.m.Button({
						//icon: "sap-icon://save",
						type: sap.m.ButtonType.Emphasized,
						text: "Exportar",
						press: [function () {
							console.log("ACA")
							var filters = [];
							var filtersData = ModelHelper.getModel("InformeFiltersJsonModel").getData();


							if (!filtersData.desde || !filtersData.hasta) {
								return;
							}

							function addDay(fecha) {
								var dat = new Date(fecha)
								dat.setDate(dat.getDate() + 1);
								return dat;
							}
							var dateArray = [];
							var currentDate = new Date(new Date(filtersData.desde).setHours(0, 0, 0, 0));
							while (currentDate <= new Date(new Date(filtersData.hasta).setHours(0, 0, 0, 0))) {
								dateArray.push(currentDate);
								currentDate = addDay(currentDate);
							}
							if (this.society == 300) {
								filtersData.desde.setHours(6, 0, 0, 0); //6 am
								filtersData.hasta.setHours(6, 0, 0, 0); //6 am
							} else {
								filtersData.hasta.setHours(23, 59, 59, 999);
							}
							//filtersData.hasta.setHours(23, 59, 59, 999);
							filters.push(new sap.ui.model.Filter("InicioNove", sap.ui.model.FilterOperator.BT, filtersData.desde, filtersData.hasta));
							this.reporteDBFFilters = filters;
							this.reportesDBFFechas = dateArray;
							this.reportInformeDiario(filtersData.desde);
							this.dialogReportesDBF.close();
						}, this]
					}),
					new sap.m.Button({
						//icon: "sap-icon://save",
						type: sap.m.ButtonType.Emphasized,
						text: "Cancelar",
						press: [function () {
							this.dialogReportesDBF.close();
						}, this]
					})
				]
			});

			this.getView().addDependent(this.dialogReportesDBF);

			this.dialogReportesDBF.open();
		},
		reportInformeDiario: function (fechaDesde) {
			var that = this;
			jQuery.sap.require("transener/registrocronologicoeventos/libs/docx");
			jQuery.sap.require("transener/registrocronologicoeventos/libs/FileSaver");

			function addDestinatarios(doc, destinatarios) {
				if (destinatarios.length) {
					var paragraph = doc.createParagraph();
					paragraph.createTextRun("A: ").bold().font("arial").size(22);
					paragraph.createTextRun(destinatarios[0].Destinatario).tab().font("arial").size(22);
				}
				for (var i = 1; i < destinatarios.length; i++) {
					paragraph.createTextRun(destinatarios[i].Destinatario).tab().break().font("arial").size(22);
				}
			}

			function addForzadas(doc, forzadas) {

				function createForzada(doc, forzada) {
					var paragraph = doc.createParagraph();
					paragraph.createTextRun(forzada.Equipo + "  " + forzada.DescEquipo).bold().break().font("arial");
					if (forzada.EntServ) {
						paragraph.createTextRun("Salió de Servicio el " + FormatHelper.formatDate(forzada.IndDesde) + " a las " + FormatHelper.formatTime(
							forzada.IndDesde) + " hs.").bold().break().font("arial");
						paragraph.createTextRun("Entró en Servicio el " + FormatHelper.formatDate(forzada.EntServ) + " a las " + FormatHelper.formatTime(
							forzada.EntServ) + " hs.").break().font("arial");
					} else {
						paragraph.createTextRun("Salió de Servicio el " + FormatHelper.formatDate(forzada.IndDesde) + " a las " + FormatHelper.formatTime(
							forzada.IndDesde) + " hs. y continúa").bold().break().font("arial");
					}
					//TODOLUCAS esto se borro porque lo pidieron
					if (!forzada.Consecuente || that.society == 300) {
						if (forzada.Causa) paragraph.createTextRun("Causa: " + forzada.Causa).break().font("arial");
					}

					if (forzada.Comentario && that.society != 300) paragraph.createTextRun("Comentarios: " + forzada.Comentario).break().font("arial"); //TODO verificar y cambiar

					if (that.society == 300) {

						if (forzada.Recierre) {
							if (!forzada.GenIndisp) {
								paragraph.createTextRun("RECIERRE EXITOSO").break();
							} else {
								paragraph.createTextRun("RECIERRE NO EXITOSO").break();
							}

						}

						if (forzada.pruebas) {
							for (var k = 0; k < forzada.pruebas.length; k++) {
								var prueba = forzada.pruebas[k];
								var text = "Prueba efectuada el " + FormatHelper.formatDate(prueba.HoraPrueba) + " a las " +
									FormatHelper.formatTime(prueba.HoraPrueba) + " - " + prueba.Comentarios;
								paragraph.createTextRun(text).break().font("arial");
							}
						}

						if (forzada.seniales.length) paragraph.createTextRun("Señalizaciones registradas").break().font("arial");
						for (var j = 0; j < forzada.seniales.length; j++) {
							var row = forzada.seniales[j];

							var ezSignals = ["Fn", "Fr", "Fs", "Ft", "Tx", "Rx", "T2", "Ts2"];
							var pzSignals = ["Li", "Rr"];
							var text = "";

							if (row.Senializacion) {
								text += row.Senializacion + " ";
							}

							var row1Signals = ["Rrpi", "Bz", "PITR", "Pito", "Pit1", "Pili"];

							row1Signals.forEach(function (key) {
								if (row[key] === true) {
									if (key === "Pito") key = "Pit0";
									if (text) text += "-" + key.toUpperCase()
									else text += key.toUpperCase()
								}
							});
							if (text) paragraph.createTextRun(text).break().font("arial");
							text = "";

							var row2Signals = ["Km", "Fn", "Fr", "Fs", "Ft", "Tx", "Rx", "T2", "Ts2", "Li", "Rr"];

							if (row.Et) {
								text += row.Et + ": ";
							}

							row2Signals.forEach(function (key) {
								if (row[key] === true) {
									if (ezSignals.includes(key)) key = "EZ" + key;
									if (pzSignals.includes(key)) key = "PZ" + key;
									if (text) text += "-" + key.toUpperCase()
									else text += key.toUpperCase()
								}
							});

							if (row.Km) text += " DIST: " + row.Km + " KM";

							if (text) paragraph.createTextRun(text).break().font("arial");
							text = "";

							if (row.Et2) {
								text += row.Et2 + ": ";
							}

							var row3Signals = ["Km2", "Fn2", "Fr2", "Fs2", "Ft2", "Tx2", "Rx2", "T22", "Ts22", "Li2", "Rr2"];

							row3Signals.forEach(function (key) {
								if (row[key] === true) {
									key = key.slice(0, -1);
									if (ezSignals.includes(key)) key = "EZ" + key;
									if (pzSignals.includes(key)) key = "PZ" + key;
									if (text) text += "-" + key.toUpperCase()
									else text += key.toUpperCase()
								}
							});

							if (row.Km2) text += " DIST: " + row.Km2 + " KM";

							if (text) paragraph.createTextRun(text).break().font("arial");

						}
						if (!forzada.Consecuente) {
							paragraph.createTextRun("Factor de Reducción:" + forzada.Factred).break().font("arial");
							for (var j = 0; j < forzada.ens.length; j++) {
								var row = forzada.ens[j];
								paragraph.createTextRun("Potencia Restituida " + (j + 1) + ": " + row.Potencia +
									" Tiempo Reposicion " + (j + 1) + ": " + row.Corte).break().font("arial");
							}
							paragraph.createTextRun("Potencia Cortada:" + forzada.Potenafect + " MW").break().font("arial");
							paragraph.createTextRun("Energía No Suministrada:" + forzada.Ensval + " MWh").break().font("arial");
						}

					} else {
						if (forzada.UbicFalla) paragraph.createTextRun("Ubicación de la falla: " + forzada.UbicFalla).break().break().font("arial");
					}

					//paragraph.createTextRun("Ubicación de la falla " + forzada.UbicFalla).break().break();
					if (forzada.EstadoTiempo) paragraph.createTextRun("Estado del Tiempo: " + that.formatEstadoTiempo(forzada.EstadoTiempo)).break().font(
						"arial");
					if (forzada.DispAct) paragraph.createTextRun("Dispositivo Actuante: " + that.formatDispAct(forzada.DispAct)).break().font("arial");

					if (forzada.FinfCammesa) {
						paragraph.createTextRun("Se informó a CAMMESA el " +
							FormatHelper.formatDate(forzada.FinfCammesa) + " a las " + FormatHelper.formatTime(
								forzada.FinfCammesa) + " hs.").break().break().font("arial");

						paragraph.createTextRun(forzada.InfCammesa).break().font("arial");
					}
					//if (forzada.Causa) paragraph.createTextRun(forzada.Causa).break().font("arial");
				}

				if (forzadas.length) {
					var titulo = doc.createParagraph().center();
					titulo.createTextRun("FORZADAS").bold().underline().font("arial").size(22);
					for (var i = 0; i < forzadas.length; i++) {
						createForzada(doc, forzadas[i]);
					}
				}
			}

			function addProgramadas(doc, programadas) {

				function createProgramada(doc, programada) {
					var paragraph = doc.createParagraph();
					paragraph.createTextRun(programada.Equipo + "  " + programada.DescEquipo).bold().break().font("arial");

					if (programada.CodNovedad == "D") {
						if (programada.EntServ) {
							paragraph.createTextRun("Salió de Servicio el " + FormatHelper.formatDate(programada.InicioNove) +
								" a las " + FormatHelper.formatTime(programada.InicioNove) + " hs.").bold().break().font("arial");
							paragraph.createTextRun("Entró en Servicio el " + FormatHelper.formatDate(programada.EntServ) +
								" a las " + FormatHelper.formatTime(programada.EntServ) + " hs.").break().font("arial");
						} else {
							paragraph.createTextRun("Salió de Servicio el " + FormatHelper.formatDate(programada.InicioNove) +
								" a las " + FormatHelper.formatTime(programada.InicioNove) + " hs. y continúa").bold().break().font("arial");
						}
						paragraph.createTextRun("Causa: " + programada.Causa).break().font("arial");
						if (programada.FinfCammesa) {
							paragraph.createTextRun("Se informó a CAMMESA el " +
								FormatHelper.formatDate(programada.FinfCammesa) +
								" a las " + FormatHelper.formatTime(programada.FinfCammesa) + " hs.").break().break().font("arial");
							paragraph.createTextRun(programada.InfCammesa).break().font("arial");
							//paragraph.createTextRun("Número para Cammesa " + programada.Nroequipocammesa).break();
						}

					}

					if (programada.CodNovedad == "I") {
						if (programada.EntServ) {
							paragraph.createTextRun("Se Inició el " + FormatHelper.formatDate(programada.InicioNove) +
								" a las " + FormatHelper.formatTime(programada.InicioNove) + " hs.").bold().break().font("arial");
							paragraph.createTextRun("Finalizo el " + FormatHelper.formatDate(programada.EntServ) +
								" a las " + FormatHelper.formatTime(programada.EntServ) + " hs.").break().font("arial");
						} else {
							paragraph.createTextRun("Se Inició el " + FormatHelper.formatDate(programada.InicioNove) +
								" a las " + FormatHelper.formatTime(programada.InicioNove) + " hs. y continúa").bold().break().font("arial");
						}
						paragraph.createTextRun("Motivo: " + programada.Motivomtto).break().font("arial");
						paragraph.createTextRun("Causa: " + programada.Causa).break().font("arial");

					}
					if (programada.Comentario && that.society != 300) paragraph.createTextRun("Comentarios: " + programada.Comentario).break().font(
						"arial");

					/*paragraph.createTextRun("Se informó a CAMMESA el " + FormatHelper.formatDate(programada.FinfCammesa) + " a las " + FormatHelper.formatTime(
						programada.FinfCammesa) + " hs.").break().break();*/

				}

				if (programadas.length) {
					var titulo = doc.createParagraph().center();
					titulo.createTextRun("PROGRAMADAS").bold().underline().break().font("arial").size(22);
					for (var i = 0; i < programadas.length; i++) {
						createProgramada(doc, programadas[i]);
					}
				}
			}

			function addRecierres(doc, recierres) {

				function createRecierre(doc, recierre) {
					var paragraph = doc.createParagraph();
					paragraph.createTextRun(recierre.Equipo + "  " + recierre.DescEquipo).bold().break().font("arial");
					if (recierre.recierre && recierre.GenIndisp) {
						paragraph.createTextRun("Se Produjo el " + FormatHelper.formatDate(recierre.IndDesde) + " a las " + FormatHelper.formatTime(
							recierre.IndDesde) + " hs.").bold().break().font("arial");
					} else {
						paragraph.createTextRun("Se Produjo el " + FormatHelper.formatDate(recierre.InicioNove) + " a las " + FormatHelper.formatTime(
							recierre.InicioNove) + " hs.").bold().break().font("arial");
					}
					paragraph.createTextRun("Causa: " + recierre.Causa).break().font("arial");
					if (recierre.Comentario) paragraph.createTextRun("Comentarios: " + recierre.Comentario).break().font("arial"); //TODO verificar y cambiar
					if (that.society == 300) {
						if (recierre.Recierre) {
							if (!recierre.GenIndisp) {
								paragraph.createTextRun("RECIERRE EXITOSO").break();
							} else {
								paragraph.createTextRun("RECIERRE NO EXITOSO").break();
							}

						}

						if (recierre.pruebas) {
							for (var k = 0; k < recierre.pruebas.length; k++) {
								var prueba = recierre.pruebas[k];
								var text = "Prueba efectuada el " + FormatHelper.formatDate(prueba.HoraPrueba) + " a las " +
									FormatHelper.formatTime(prueba.HoraPrueba) + " - " + prueba.Comentarios;
								paragraph.createTextRun(text).break().font("arial");
							}
						}

						/*if (recierre.seniales.length) paragraph.createTextRun("Señalizaciones registradas").break().font("arial");
						for (var j = 0; j < recierre.seniales.length; j++) {
							var row = recierre.seniales[j];
							var text = "";
							for (var key in row) {
								if (row[key] === true) {
									if (text) text += "-" + key.toUpperCase()
									else text += key.toUpperCase()
								}
							}
							paragraph.createTextRun(text).break().font("arial");
						}*/
						if (recierre.seniales.length) paragraph.createTextRun("Señalizaciones registradas").break().font("arial");
						for (var j = 0; j < recierre.seniales.length; j++) {
							var row = recierre.seniales[j];

							var ezSignals = ["Fn", "Fr", "Fs", "Ft", "Tx", "Rx", "T2", "Ts2"];
							var pzSignals = ["Li", "Rr"];
							var text = "";

							if (row.Senializacion) {
								text += row.Senializacion + " ";
							}

							var row1Signals = ["Rrpi", "Bz", "PITR", "Pito", "Pit1", "Pili"];

							row1Signals.forEach(function (key) {
								if (row[key] === true) {
									if (key === "Pito") key = "Pit0";
									if (text) text += "-" + key.toUpperCase()
									else text += key.toUpperCase()
								}
							});
							if (text) paragraph.createTextRun(text).break().font("arial");
							text = "";

							var row2Signals = ["Fn", "Fr", "Fs", "Ft", "Tx", "Rx", "T2", "Ts2", "Li", "Rr"];

							if (row.Et) {
								text += row.Et + ": ";
							}

							row2Signals.forEach(function (key) {
								if (row[key] === true) {
									if (ezSignals.includes(key)) key = "EZ" + key;
									if (pzSignals.includes(key)) key = "PZ" + key;
									if (text) text += "-" + key.toUpperCase()
									else text += key.toUpperCase()
								}
							});

							if (row.Km) text += " DIST: " + row.Km + " KM";
							if (text) paragraph.createTextRun(text).break().font("arial");
							text = "";

							if (row.Et2) {
								text += row.Et2 + ": ";
							}

							var row3Signals = ["Fn2", "Fr2", "Fs2", "Ft2", "Tx2", "Rx2", "T22", "Ts22", "Li2", "Rr2"];

							row3Signals.forEach(function (key) {
								if (row[key] === true) {
									key = key.slice(0, -1);
									if (ezSignals.includes(key)) key = "EZ" + key;
									if (pzSignals.includes(key)) key = "PZ" + key;
									if (text) text += "-" + key.toUpperCase()
									else text += key.toUpperCase()
								}
							});

							if (row.Km2) text += " DIST: " + row.Km2 + " KM";
							if (text) paragraph.createTextRun(text).break().font("arial");

						}
					}

					/*					if (recierre.Recierre) {
											paragraph.createTextRun("RECIERRE EXITOSO").break();
										}
										paragraph.createTextRun("Comentarios: " + recierre.Comentario).break();*/
					/*if(recierre.UbicFalla)*/
					paragraph.createTextRun("Ubicación de la falla: " + recierre.UbicFalla).break().break().font("arial");
					/*if(recierre.EstadoTiempo)*/
					paragraph.createTextRun("Estado del Tiempo: " + that.formatEstadoTiempo(recierre.EstadoTiempo)).break().font("arial");
					paragraph.createTextRun("Dispositivo Actuante: " + that.formatDispAct(recierre.DispAct)).break().font("arial");
					//paragraph.createTextRun("Tipificación de la falla: " + that.getTipificacionFallaDesc(recierre.TipoFalla)).break();

				}

				if (recierres.length) {
					var titulo = doc.createParagraph().center();
					titulo.createTextRun("RECIERRES").bold().underline().break().font("arial").size(22);
					for (var i = 0; i < recierres.length; i++) {
						createRecierre(doc, recierres[i]);
					}
				}
			}

			function addComentarios(doc, comentarios) {

				function createComentario(doc, comentario) {
					var paragraph = doc.createParagraph();
					var parts = comentario.Comentario.split("\n");
					for (var i = 0; i < parts.length; i++) {
						paragraph.createTextRun(parts[i]).break().font("arial");
					}
					//paragraph.createTextRun(comentario.Comentario).break();
				}

				if (comentarios.length) {
					var titulo = doc.createParagraph().center();
					titulo.createTextRun("COMENTARIOS GENERALES").bold().underline().break().font("arial").size(22);
					for (var i = 0; i < comentarios.length; i++) {
						createComentario(doc, comentarios[i]);
					}
				}
			}

			var fechas = this.reportesDBFFechas;

			var filters = this.reporteDBFFilters;
			filters.push(new sap.ui.model.Filter({
				path: "Empresa",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.society
			}));
			this.globalBusyDialog.open();
			var premises = [];
			premises.push(ReportesService.getInformeDiario(filters));
			var destinatariosFilters = [new sap.ui.model.Filter({
				path: "Empresa",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.society
			})];
			premises.push(ReportesService.getDestinatarios(destinatariosFilters));

			Promise.all(premises).then(function (res) {
				var informes = res[0];

				var novedadesPromise = [];

				var service = oDataService.getModel("");
				/*var lineaPromise = new Promise(function (resolve, reject) {
					service.read("/InfPnlzLineasSet", {
						filters: filters,
						success: resolve,
						error: reject
					});
				});*/
				if (that.society == 300) {
					for (var i = 0; i < informes.length; i++) {
						var novedad = informes[i];
						if (novedad.Tipo == "2" || novedad.Tipo == "4") {
							continue;
						}
						var entity = "/NovedadesServicioSet(IdNovedad='" + novedad.IdNovedad +
							"',Empresa='" + novedad.Empresa + "')";
						var expands = "SenialXNS_nav,PruebasXNS_nav,ENSRegXNS_NAV";

						novedadesPromise.push(new Promise(function (resolve, reject) {
							var nov = novedad;
							var responseFunc = function (response) {
								resolve({
									res: response,
									novedad: nov
								});
							}

							service.read(entity, {
								urlParameters: {
									"$expand": expands
								},
								success: responseFunc,
								error: reject
							});
						}));
					}
				}

				var destinatarios = res[1];

				Promise.all(novedadesPromise).then(function (resNovedades) {
					//debugger;
					for (var i = 0; i < resNovedades.length; i++) {
						var nov = resNovedades[i];
						var inf = nov.novedad;

						inf.seniales = nov.res.SenialXNS_nav.results;
						inf.pruebas = nov.res.PruebasXNS_nav.results;
						inf.ens = nov.res.ENSRegXNS_NAV.results;
						//informes.push(inf);
					}
					//debugger;
					//TODO informediario

					destinatarios.sort(function (a, b) {
						return a.orden - b.orden;
					});

					var fechasDiarias = [];
					for (var i = 0; i < fechas.length; i++) {
						var fecha = fechas[i];
						var final = new Date(fecha);
						final.setHours(23, 59, 59, 999);
						fechasDiarias[i] = {
							forzadas: [],
							programadas: [],
							recierres: [],
							comentariosGenerales: []
						};
						informes.forEach(function (el) {
							var diaNovedad = new Date(el.InicioNove);
							diaNovedad.setHours(0, 0, 0, 0);
							if (that.society == 300) {
								//transba
								var fechaTransba = fecha;
								fechaTransba.setHours(0, 0, 0, 0);
								if (fecha.getTime() != diaNovedad.getTime()) {
									return;
								}
							} else {
								//transener
								if (fecha >= diaNovedad) {
									if (el.EntServ) {
										if (el.EntServ < fecha) {
											return;
										}
										if (el.EntServ < final) {
											el.finalizada = true;
										}
									} else {
										el.finalizada = false;
									}
								} else {
									return;
								}
							}

							switch (el.Tipo) {
								case "1":
									fechasDiarias[i].forzadas.push(el);
									break;
								case "2":
									fechasDiarias[i].programadas.push(el);
									break;
								case "3":
									if (diaNovedad.getTime() == fecha.getTime()) {
										fechasDiarias[i].recierres.push(el);
									}
									break;
								case "4":
									//TODO creo que solo lo agrega el primer dia
									if (diaNovedad.getTime() == fecha.getTime()) {
										fechasDiarias[i].comentariosGenerales.push(el);
									}

									break;
							}
						});
					}

					//console.log(fechasDiarias);

					/*var forzadas = informes.filter(function (el) {
						return el.Tipo == 1;
					});
					var programadas = informes.filter(function (el) {
						return el.Tipo == 2;
					});
					var recierres = informes.filter(function (el) {
						return el.Tipo == 3;
					});
					var comentariosGenerales = informes.filter(function (el) {
						return el.Tipo == 4;
					});*/

					var imgTransener = that.imageUrl;
					//imgTransener = this.imageUrl;
					var doc = new Document({
						pageNumberStart: 1,
						pageNumberFormatType: PageNumberFormat.DECIMAL,
					});
					if (that.imageUrl) {
						if (that.society == 100) {
							doc.Header.createImage(imgTransener, 140, 55);
						} else {
							doc.Header.createImage(imgTransener, 140, 55);
						}
					}
					//TODO arial 10 y arial 11 para fechas, y los titulos, forzadas, comentarios, etc
					//.font("arial")  .size(22)
					var paragraph = doc.Header.createParagraph().createBorder();
					paragraph.Borders.addBottomBorder("black", "100", "single", "10");
					paragraph.center().createTextRun("COMUNICACION INTERNA").bold().font("arial").size(22);

					doc.Header.createParagraph().createTextRun().break();

					var fechaHoy = doc.createParagraph().right();
					//fechaHoy.createTextRun().break();
					fechaHoy.createTextRun("Fecha: " + FormatHelper.formatDate(new Date())).bold().font("arial").size(22);

					addDestinatarios(doc, destinatarios);

					var paragraph = doc.createParagraph();
					paragraph.createTextRun("DE: ").bold().break().font("arial").size(22);
					paragraph.createTextRun("CENTRO DE CONTROL").tab().font("arial").size(22);

					paragraph = doc.createParagraph();
					paragraph.createTextRun("REF: ").bold().break().font("arial").size(22);
					paragraph.createTextRun("NOVEDADES DE SERVICIO").tab().font("arial").size(22);

					/*var fecha2 = doc.createParagraph().right();
					fecha2.createTextRun("Fecha:" + FormatHelper.formatDate(new Date())).bold().underline();*/
					const dias = [
						'Domingo',
						'Lunes',
						'Martes',
						'Miércoles',
						'Jueves',
						'Viernes',
						'Sábado',
					];
					for (var i = 0; i < fechasDiarias.length; i++) {
						var fechaActual = fechasDiarias[i];
						var fechaDia = fechas[i];
						if (!(fechaActual.forzadas.length || fechaActual.programadas.length ||
							fechaActual.recierres.length || fechaActual.comentariosGenerales.length)) {
							continue;
						}
						var numeroDia = new Date(fechaDia).getDay();
						var nombreDia = dias[numeroDia];
						doc.createParagraph().right()
							.createTextRun("Fecha: " + nombreDia + " " + FormatHelper.formatDate(fechaDia)).bold().underline().font("arial").size(22);

						/*//////// SECCIÓN FORZADAS ////////*/
						function sortByInicioNove(el1, el2) {
							var a = el1.InicioNove.getTime();
							var b = el2.InicioNove.getTime();

							if (a < b) { // a comes first
								return -1
							} else if (b < a) { // b comes first
								return 1
							} else { // equal, so order is irrelevant
								return 0 // note: sort is not necessarily stable in JS
							}
						}
						fechaActual.forzadas.sort(sortByInicioNove);
						addForzadas(doc, fechaActual.forzadas);

						/*//////// SECCIÓN PROGRAMADAS ////////*/
						fechaActual.programadas.sort(sortByInicioNove);
						addProgramadas(doc, fechaActual.programadas);

						/*//////// SECCIÓN RECIERRES ////////*/
						fechaActual.recierres.sort(sortByInicioNove);
						addRecierres(doc, fechaActual.recierres);

						/*//////// SECCIÓN COMENTARIOS GENERALES ////////*/
						fechaActual.comentariosGenerales.sort(sortByInicioNove);
						addComentarios(doc, fechaActual.comentariosGenerales);
					}

					/*var titulo3 = doc.createParagraph().center();
					titulo3.createTextRun("COMENTARIOS GENERALES").bold().underline().break();

					var body6 = doc.createParagraph();
					body6.createTextRun("Control de Tensión").bold().break();
					body6.createTextRun("A solicitud de Cammesa se operó fuera de banda:").break().break();

					doc.createParagraph().bullet().createTextRun(
						"De 00:00 a 24:00 hs y continúa en la ET RE 142 kV, por requerimiento de TRANSNOA, por baja tensión en Catamarca.").break();
					doc.createParagraph(
						"De 00:00 a 24:00 hs y continúa en la ET LA 142 kV, por requerimiento de TRANSNOA, por baja tensión en La Rioja").bullet();
					doc.createParagraph(
						"De 00:00 a 24:00 hs y continúa en la ET SI (T2SI) 142 kV, por requerimiento de EMSA por baja tensión en ET Puerto Mineral (ante falla en el sistema de EMSA)."
					).bullet();
					doc.createParagraph(
						"De 00:00 a 03:06 hs y de 07:58 a 24:00 hs y continúa en la ET OL-TIBA 141 kV por requerimiento de TRANSBA por baja tensión en La Costa, en ambos períodos."
					).bullet();
					doc.createParagraph("De 00:00 a 24:00 hs y continúa en la ET LU 140 kV, por requerimiento de EDESAL, por baja tensión en San Luis.")
						.bullet();
					doc.createParagraph("De 18:25 a 20:50 hs en la ET ST 140 kV, por requerimiento de la EPESF, por baja tensión en Ceres").bullet();
					doc.createParagraph("De 19:25 a 20:42 hs en la ET RO 140 kV, por requerimiento de la EPESF por baja tensión en Cañada de Gómez.").bullet();
					doc.createParagraph(
						"De 20:14 a 24:00 hs y continúa en la ET BR 140 kV, por requerimiento de TRANSNOA por baja tensión en Santiago del Estero.").bullet();

					doc.createParagraph("Ing. Alfonso Burbaud").right();*/

					var packer = new Packer();
					var empresa = "";
					var documentName = "";

					if (that.society === "100") {
						empresa = "TRANSENER";
						documentName = "Informe Diario " + empresa + ".docx";
					} else {
						documentName = "NOV " +
							that.formatDate(fechaDesde).replace(new RegExp("/", 'g'), "") + ".docx";
					}

					packer.toBlob(doc).then(blob => {
						saveAs(blob, documentName);
						that.globalBusyDialog.close();
					});
				});

				return;

			});

			return;

		},
		//Reporte Novedades por Tipo
		reportNovedadesTipoEquipo: function () {
			var that = this;
			var model = ModelHelper.getModel("NovedadesPorEquiposJsonModel");
			model.setData({});
			this.dialogReporteTipoEquipo = new sap.m.Dialog({
				type: sap.m.DialogType.Message,
				title: "Novedades Por Tipo",
				content: [
					new sap.m.VBox({
						items: [
							new sap.m.HBox({
								alignItems: "Center",
								items: [
									new sap.m.Label({
										text: "Región",
										width: "100px"
									}).addStyleClass("CustomLabel"),
									new sap.m.ComboBox({
										selectedKey: "{NovedadesPorEquiposJsonModel>/region}",
										items: {
											path: "EstacionesJsonModel>/Estaciones",
											template: new sap.ui.core.Item({
												key: "{EstacionesJsonModel>Estacion}",
												text: "{EstacionesJsonModel>Codigo}"
											})
										},
										layoutData: new sap.m.FlexItemData({
											growFactor: 1
										}),
										width: "120px"
									}),
									new sap.m.ComboBox({
										selectedKey: "{NovedadesPorEquiposJsonModel>/region}",
										items: {
											path: "EstacionesJsonModel>/Estaciones",
											template: new sap.ui.core.Item({
												key: "{EstacionesJsonModel>Estacion}",
												text: "{EstacionesJsonModel>Descripcion}"
											})
										},
										layoutData: new sap.m.FlexItemData({
											growFactor: 6
										}),
										width: "100%"
									})
								]
							}),
							new sap.m.HBox({
								alignItems: "Center",
								items: [
									new sap.m.Label({
										text: "Tipo de Equipo",
										width: "100px"
									}).addStyleClass("CustomLabel"),
									new sap.m.ComboBox({
										selectedKey: "{NovedadesPorEquiposJsonModel>/tipo}",
										items: {
											path: "TipoModel>/Tipo",
											template: new sap.ui.core.Item({
												key: "{TipoModel>Tipo}",
												text: "{TipoModel>Tipo}"
											})
										},
										layoutData: new sap.m.FlexItemData({
											growFactor: 1
										}),
										width: "120px"
									}),
									new sap.m.ComboBox({
										selectedKey: "{NovedadesPorEquiposJsonModel>/tipo}",
										items: {
											path: "TipoModel>/Tipo",
											template: new sap.ui.core.Item({
												key: "{TipoModel>Tipo}",
												text: "{TipoModel>Descripcion}"
											})
										},
										layoutData: new sap.m.FlexItemData({
											growFactor: 6
										}),
										width: "100%"
									})
								]
							}),
							new sap.m.HBox({

								items: [
									new sap.m.HBox({
										alignItems: "Center",
										items: [
											new sap.m.Label({
												text: "Desde",
												width: "100px"
											}).addStyleClass("CustomLabel"),
											new sap.m.DatePicker({
												dateValue: "{NovedadesPorEquiposJsonModel>/desde}",
												displayFormat: "dd/MM/yy HH:mm"
											})
										]
									}).addStyleClass("sapUiTinyMarginEnd"),
									new sap.m.HBox({
										alignItems: "Center",
										items: [
											new sap.m.Label({
												text: "Hasta",
												width: "100px"
											}).addStyleClass("CustomLabel"),
											new sap.m.DatePicker({
												dateValue: "{NovedadesPorEquiposJsonModel>/hasta}",
												displayFormat: "dd/MM/yy HH:mm"
											})
										]
									})
								]
							})
						]
					})
				],
				buttons: [
					new sap.m.Button({
						//icon: "sap-icon://save",
						type: sap.m.ButtonType.Emphasized,
						text: "Exportar",
						press: [this.exportNovedadesPorEquipo, this]
					}),
					new sap.m.Button({
						//icon: "sap-icon://save",
						type: sap.m.ButtonType.Emphasized,
						text: "Cancelar",
						press: [function () {
							this.dialogReporteTipoEquipo.close();
						}, this]
					})
				]
			});
			var oModel = new sap.ui.model.json.JSONModel();
			this.getView().addDependent(this.dialogReporteTipoEquipo);
			this.dialogReporteTipoEquipo.setModel(oModel, "novs");
			this.dialogReporteTipoEquipo.open();
		},
		exportNovedadesPorEquipo: function () {
			var that = this;

			/*jQuery.sap.registerModulePath("index", "https://unpkg.com/docx@4.0.0/build/");
			jQuery.sap.require("index.index");*/
			//jQuery.sap.require("transener/registrocronologicoeventos/libs/docx");
			//jQuery.sap.registerModulePath("File", "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/");
			jQuery.sap.require("transener/registrocronologicoeventos/libs/FileSaver");

			var filterData = ModelHelper.getModel("NovedadesPorEquiposJsonModel").getData();
			var filters = [];

			filters.push(new sap.ui.model.Filter({
				path: "Empresa",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.society
			}));

			if (filterData.region) {
				filters.push(new sap.ui.model.Filter({
					path: "Estacion",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: filterData.region
				}));
			}

			if (!filterData.tipo) {
				sap.m.MessageBox.alert("Debe seleccionar fecha desde, fecha hasta y tipo de equipo", {
					title: "Filtros reporte"
				});
				return;
			}

			filters.push(new sap.ui.model.Filter({
				path: "Tipoeq",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: filterData.tipo
			}));

			if (filterData.desde && filterData.hasta) {
				filterData.hasta.setHours(23, 59, 59, 999);
				filters.push(new sap.ui.model.Filter({
					path: "Salida",
					operator: sap.ui.model.FilterOperator.BT,
					value1: filterData.desde,
					value2: filterData.hasta
				}));
			} else {
				sap.m.MessageBox.alert("Debe seleccionar fecha desde, fecha hasta y tipo de equipo", {
					title: "Filtros reporte"
				});
				return;
			}

			var headers = ["CT", (filterData.tipo && this.lineas.includes(filterData.tipo)) ? "Desde - Hasta" : "Estacion", "Salida",
				"Código de equipo",
				"Circuito", "Ref", "Salida",
				"Entrada", "Indisp Tiempo", "Indisp Tipo", "Cond.Atmosf"
			];
			var data = [headers.join(";")];
			this.globalBusyDialog.open();
			ReportesService.getNovedadesPorTipoEquipo(filters).then(function (res) {
				//debugger;

				for (var i = 0; i < res.length; i++) {
					var nov = res[i];
					var row = [];
					row.push(i + 1);
					row.push(nov.Estacion || nov.Extremos || "");
					row.push("");
					row.push(nov.Equipo || "");
					row.push(nov.Circuito || "");
					row.push(nov.Ref || "");
					row.push(nov.Salida && that.formatDateTime(nov.Salida) || "");
					row.push(nov.Entrada && that.formatDateTime(nov.Entrada) || "");
					row.push(nov.IndispTm && Math.floor(nov.IndispTm.ms / 1000 / 60) || "0");
					row.push(nov.IndispTp || "");
					row.push(nov.CondAtmos || "");
					data.push(row.join(";"));
				}

				var string = data.join("\n");

				var blob = new Blob(['\ufeff' + string], {
					type: 'text/csv;charset=utf-8;'
				});
				that.globalBusyDialog.close();
				if (navigator.msSaveBlob) { // IE 10+
					navigator.msSaveBlob(blob, "Reporte.csv");
				} else {
					var link = document.createElement("a");
					var url = URL.createObjectURL(blob);
					var isSafari = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1;
					if (isSafari) //if Safari open in new window to save file with random filename.
						link.setAttribute("target", "_blank");
					link.setAttribute("href", url);
					link.setAttribute("download", "reporte.xls");
					link.style = "visibility:hidden";
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
				}

				//console.log(data);

				/*const doc = new Document();
				var fecha = doc.Header.createParagraph().right();
				fecha.createTextRun(that.formatDate(filterData.desde) + " a " + that.formatDate(filterData.hasta)).bold();
				var imgTransener = that.imageUrl;
				if (that.imageUrl) {
					if (that.society == 100) {
						doc.Header.createImage(imgTransener, 140, 55);
					} else {
						doc.Header.createImage(imgTransener, 140, 55);
					}
				}
				doc.Header.createParagraph().center().createTextRun(that.formatTipoEquipo(filterData.tipo)).bold();

				const table = doc.createTable(data.length, headers.length);
				for (i = 0; i < data.length; i++) {
					for (var j = 0; j < headers.length; j++) {
						table.getCell(i, j).addContent(new Paragraph(data[i][j]));
					}
				}*/

				/*const packer = new Packer();

				packer.toBlob(doc).then(blob => {
					saveAs(blob, "mydocument.docx");
					that.globalBusyDialog.close();
				});

				that.dialogReporteTipoEquipo.close();*/
			})

		},
		//Reporte ENS
		reportENS: function () {
			var that = this;
			var model = ModelHelper.getModel("InformeFiltersJsonModel");
			model.setData({});
			var regionesModel = ModelHelper.getModel("RegionesEnsJsonModel");
			if (this.society == 100) {
				regionesModel.setData({
					Regiones: [{
						Codigo: 102,
						Descripcion: "Transener SA-Gcia Reg Metropolitana"
					}, {
						Codigo: 103,
						Descripcion: "Transener SA-Gcia Reg Norte"
					}, {
						Codigo: 104,
						Descripcion: "Transener SA-Gcia Reg Sur"
					}]
				});
			} else {
				regionesModel.setData({
					Regiones: [{
						Codigo: 113,
						Descripcion: "NORTEBA"
					}, {
						Codigo: 114,
						Descripcion: "SURBA"
					}]
				});
			}
			this.dialogReporteEns = new sap.m.Dialog({
				type: sap.m.DialogType.Message,
				title: "Reportes ENS",
				content: [
					new sap.m.VBox({
						items: [
							new sap.m.HBox({
								alignItems: "Center",
								items: [
									new sap.m.Label({
										text: "Región",
										width: "100px"
									}).addStyleClass("CustomLabel"),
									new sap.m.ComboBox({
										selectedKey: "{InformeFiltersJsonModel>/region}",
										items: {
											path: "RegionesEnsJsonModel>/Regiones",
											template: new sap.ui.core.Item({
												key: "{RegionesEnsJsonModel>Codigo}",
												text: "{RegionesEnsJsonModel>Codigo}"
											})
										},
										layoutData: new sap.m.FlexItemData({
											growFactor: 1
										}),
										width: "120px"
									}),
									new sap.m.ComboBox({
										selectedKey: "{InformeFiltersJsonModel>/region}",
										items: {
											path: "RegionesEnsJsonModel>/Regiones",
											template: new sap.ui.core.Item({
												key: "{RegionesEnsJsonModel>Codigo}",
												text: "{RegionesEnsJsonModel>Descripcion}"
											})
										},
										layoutData: new sap.m.FlexItemData({
											growFactor: 6
										}),
										width: "100%"
									})
								]
							}),
							new sap.m.HBox({
								items: [
									new sap.m.HBox({
										alignItems: "Center",
										items: [
											new sap.m.Label({
												text: "Desde",
												width: "100px"
											}).addStyleClass("CustomLabel"),
											new sap.m.DatePicker({
												dateValue: "{InformeFiltersJsonModel>/desde}",
												displayFormat: "dd/MM/yy HH:mm"
											})
										]
									}),
									new sap.m.HBox({
										items: [
											new sap.m.Label({
												text: "Hasta",
												width: "100px"
											}).addStyleClass("CustomLabel"),
											new sap.m.DatePicker({
												dateValue: "{InformeFiltersJsonModel>/hasta}",
												displayFormat: "dd/MM/yy HH:mm"
											})
										]
									})
								]
							})
						]
					})
				],
				buttons: [
					new sap.m.Button({
						//icon: "sap-icon://save",
						type: sap.m.ButtonType.Emphasized,
						text: "Exportar",
						press: [this.exportEns, this]
					}),
					new sap.m.Button({
						//icon: "sap-icon://save",
						type: sap.m.ButtonType.Emphasized,
						text: "Cancelar",
						press: [function () {
							this.dialogReporteEns.close();
						}, this]
					})
				]
			});
			//var oModel = new sap.ui.model.json.JSONModel();
			this.getView().addDependent(this.dialogReporteEns);
			//this.dialogReporteEns.setModel(oModel, "novs");
			this.dialogReporteEns.open();
		},
		exportEns: function () {
			//ReportesService.getEns(filters).then(function (res) {

			var filtersData = ModelHelper.getModel("InformeFiltersJsonModel").getData();
			var filters = [];
			filters.push(new sap.ui.model.Filter({
				path: "Empresa",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.society
			}));
			if (filtersData.desde && filtersData.hasta) {
				filters.push(new sap.ui.model.Filter({
					path: "Fecha",
					operator: sap.ui.model.FilterOperator.BT,
					value1: filtersData.desde,
					value2: filtersData.hasta
				}));
			} else {
				sap.m.MessageBox.alert("Debe seleccionar fecha desde y fecha hasta", {
					title: "Filtros reporte ENS"
				});
				return;
			}
			if (filtersData.region) {
				filters.push(new sap.ui.model.Filter({
					path: "Region",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: filtersData.region
				}));
			}
			ReportesService.getEns(filters).then(function (res) {
				var csv = [];
				var header = ["Fecha", "Tipo de Equipo", "Equipo en Falla", "Región", "Agente con Cortes", "Potencia Cortadas",
					"ENS", "Observaciones"

				];
				csv.push(header.join(";"));

				var rows = res.results;
				rows.forEach(function (el) {
					var row = [];
					row.push(FormatHelper.formatDate(el.Fecha));
					row.push(el.CodTipo);
					row.push(el.Eqfalla);
					row.push(el.Region);
					row.push(el.Agente);
					row.push('"=""' + parseFloat(el.Potenciacortada).toFixed(2) + '"""');
					row.push('"=""' + parseFloat(el.Ens).toFixed(2) + '"""');
					//row.push(el.Tiponovedad);
					row.push("\"" + el.Comentario + "\"");
					csv.push(row.join(";"));
				});

				// var ezeem = csv.join("\n");
				var string = csv.join("\n");

				var blob = new Blob(['\ufeff' + string], {
					type: 'text/csv;charset=utf-8;'
				});
				if (navigator.msSaveBlob) { // IE 10+
					navigator.msSaveBlob(blob, "Reporte ENS.xls");
				} else {
					var link = document.createElement("a");
					var url = URL.createObjectURL(blob);
					var isSafari = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1;
					if (isSafari) //if Safari open in new window to save file with random filename.
						link.setAttribute("target", "_blank");
					link.setAttribute("href", url);
					link.setAttribute("download", "ENS.xls");
					link.style = "visibility:hidden";
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
				}
			})

			// console.log(ezeem);

			//})
		},
		dialogENREExcel: function () {
			var that = this;
			var model = ModelHelper.getModel("InformeFiltersJsonModel");
			model.setData({});

			/*if (this.society == 300) {
				var fromDate = new Date();
				fromDate.setDate(fromDate.getDate() - 1)
				model.setProperty("/desde", fromDate);
				model.setProperty("/hasta", new Date());
			}*/

			this.dialogENREExcel = new sap.m.Dialog({
				type: sap.m.DialogType.Message,
				title: "ENRE 390",
				escapeHandler: function (oPromise) {
					oPromise.reject();
				},
				content: [
					new sap.m.VBox({
						items: [
							new sap.m.HBox({
								items: [
									new sap.m.HBox({
										items: [
											new sap.m.Label({
												text: "Desde",
												width: "100px"
											}).addStyleClass("CustomLabel"),
											new sap.m.DatePicker({
												dateValue: "{InformeFiltersJsonModel>/desde}",
											})
										]
									}),
									new sap.m.HBox({
										items: [
											new sap.m.Label({
												text: "Hasta",
												width: "100px"
											}).addStyleClass("CustomLabel"),
											new sap.m.DatePicker({
												dateValue: "{InformeFiltersJsonModel>/hasta}",
											})
										]
									})
								]
							})
						]
					})
				],
				buttons: [
					new sap.m.Button({
						//icon: "sap-icon://save",
						type: sap.m.ButtonType.Emphasized,
						text: "Exportar",
						press: [function () {
							//var filters = [];
							var filtersData = ModelHelper.getModel("InformeFiltersJsonModel").getData();
							if (!filtersData.desde || !filtersData.hasta) {
								return;
							}

							/*function addDay(fecha) {
								var dat = new Date(fecha)
								dat.setDate(dat.getDate() + 1);
								return dat;
							}
							var dateArray = [];*/
							/*var currentDate = new Date(new Date(filtersData.desde).setHours(0, 0, 0, 0));
							while (currentDate <= new Date(new Date(filtersData.hasta).setHours(0, 0, 0, 0))) {
								dateArray.push(currentDate);
								currentDate = addDay(currentDate);
							}*/
							/*if (this.society == 300) {
								filtersData.desde.setHours(6, 0, 0, 0); //6 am
								filtersData.hasta.setHours(6, 0, 0, 0); //6 am
							} else {*/
							filtersData.hasta.setHours(23, 59, 59, 999);
							//}
							//filtersData.hasta.setHours(23, 59, 59, 999);
							//filters.push(new sap.ui.model.Filter("InicioNove", sap.ui.model.FilterOperator.BT, filtersData.desde, filtersData.hasta));
							//this.reporteEnre390Filters = filters;
							//this.reportesDBFFechas = dateArray;
							this.reporteENREExcel(filtersData.desde, filtersData.hasta);
							this.dialogENREExcel.close();
						}, this]
					}),
					new sap.m.Button({
						//icon: "sap-icon://save",
						type: sap.m.ButtonType.Emphasized,
						text: "Cancelar",
						press: [function () {
							this.dialogENREExcel.close();
						}, this]
					})
				]
			});

			this.dialogENREExcel.addStyleClass("customDialog");

			this.getView().addDependent(this.dialogENREExcel);

			this.dialogENREExcel.open();
		},

		reporteENREExcel: function (desde, hasta) {
			//pasado al top
			/*jQuery.sap.registerModulePath("excel", "//unpkg.com/xlsx/dist/");*/

			/* STYLES FOR XLXS */

			//borrado, mantener aca por si se desea tratar de hacer lo de los estilos
			/*jQuery.sap.registerModulePath("styles_xlxs", "//cdnjs.cloudflare.com/ajax/libs/xlsx/0.14.1/");
			jQuery.sap.require({
				modName: "styles_xlxs.xlsx",
				type: "core.min"
			});*/
			var date1 = new Date();
			var date2 = new Date();

			date1.setFullYear(2018);

			ReportesService.getEnre390(desde, hasta).then(function (res) {
				make_xlsx_lib(XLSX);

				var headers = [{
					"ID": "IdNovedad",
					"NOMBRE": "LineaDesc",
					"LONG (li)( Km )": "Longitud",
					"FSAL": "Fsal",
					"HSAL": "Hsal",
					"MSAL": "Msal",
					"FENT": "Fent",
					"HENT": "Hent",
					"MENT": "Ment",
					"TIEMPO (ti)(HS)": "Tiempo",
					"(li x ti)": "Lixti",
					"ENS": "Ens",
					"OBSERVACION": "Observacion"
				}, {
					"ID": "IdNovedad",
					"NOMBRE": "LineaDesc",
					"POTENCIA (Si) ( MVA )": "Potencia",
					"FSAL": "Fsal",
					"HSAL": "Hsal",
					"MSAL": "Msal",
					"FENT": "Fent",
					"HENT": "Hent",
					"MENT": "Ment",
					"TIEMPO (ti)(HS)": "Tiempo",
					"(si x ti)": "Lixti",
					"ENS": "Ens",
					"OBSERVACION": "Observacion"
				}];
				res = res.map(function (res) {
					return res.results;
				})

				function filterForzadaAut(el) {
					return el.ForzadaAut == "A";
				};

				function filterForzada(el) {
					return el.ForzadaAut == "F";
				}

				function mapKeysH0(el) {
					var nuevo = {};
					for (var key in headers[0]) {
						nuevo[key] = el[headers[0][key]];
					}
					return nuevo;
				}

				function mapKeysH1(el) {
					var nuevo = {};
					for (var key in headers[1]) {
						nuevo[key] = el[headers[1][key]];
					}
					return nuevo;
				}

				var tabla1 = res[0].filter(filterForzadaAut).map(mapKeysH0);

				var tabla2 = res[0].filter(filterForzada).map(mapKeysH0);

				var tabla3 = res[1].filter(filterForzadaAut).map(mapKeysH0);

				var tabla4 = res[1].filter(filterForzada).map(mapKeysH0);

				var tabla5 = res[4].filter(filterForzadaAut).map(mapKeysH0);

				var tabla6 = res[4].filter(filterForzada).map(mapKeysH0);

				var tabla7 = res[2].filter(filterForzadaAut).map(mapKeysH1);

				var tabla8 = res[2].filter(filterForzada).map(mapKeysH1);

				var tabla9 = res[3].filter(filterForzadaAut).map(mapKeysH1);

				var tabla10 = res[3].filter(filterForzada).map(mapKeysH1);

				//(Si x ti)

				var dataBook1 = [{
					"NOMBRE": "Gabriel",
					"LONG (li)( Km )": "Contreras",
					"FSAL": "95232423",
					"HSAL": "113243343",
					"MSAL": "acl.gabriel@gmail.com",
					"FENT": "aguero 1229",
					"HENT": "Inclusion Services",
					"MENT": "Vault",
					"TIEMPO (ti)(HS)": "1,77",
					"(li x ti)": "74,2",
					"NS": "NO",
					"OBSERVACION": "Animales, plantaciones, condiciones meteorológicas, nidos de aves y otros objetos que afecten la aislación"
				}, {
					"NOMBRE": "Delvis",
					"LONG (li)( Km )": "Cedeño",
					"FSAL": "953323234",
					"HSAL": "113232243",
					"MSAL": "dcedeno@gmail.com",
					"FENT": "aguero 1229",
					"HENT": "Vault",
					"MENT": "Vault",
					"TIEMPO (ti)(HS)": "1,77",
					"(li x ti)": "74,2",
					"NS": "NO",
					"OBSERVACION": "Otras (desprendimiento hilo de guardia, caída de estructuras por accidente, terceros, pérdida de vínculo de transmisión, corte de conductor o morseto, desprendimiento de puentes, error de conexionado, aisladores, revisión de equipamiento, vandalismo, aislador bushing, enlaces de comunicaciones, extensión horario de trabajo)"
				}, {
					"NOMBRE": "Joel",
					"LONG (li)( Km )": "Crespo",
					"FSAL": "932423434",
					"HSAL": "1129692929",
					"MSAL": "casthielle@gmail.com",
					"FENT": "Segurola 3500",
					"HENT": "Inclusion Services",
					"MENT": "Vault",
					"TIEMPO (ti)(HS)": "1,77",
					"(li x ti)": "74,2",
					"NS": "NO",
					"OBSERVACION": "Falla interna en el equipo de potencia (incluyendo interruptor, seccionador, descargador, trafos de medición, reactores de línea o de tercearios, acoplamiento de O.P., nivel de aceite de cuba y RBC, tableros de control, etc.)"
				}, {
					"NOMBRE": "Carlos",
					"LONG (li)( Km )": "Cohano",
					"FSAL": "932423434",
					"HSAL": "1129692929",
					"MSAL": "casthielle@gmail.com",
					"FENT": "Segurola 3500",
					"HENT": "Inclusion Services",
					"MENT": "Vault",
					"TIEMPO (ti)(HS)": "1,77",
					"(li x ti)": "74,2",
					"NS": "NO",
					"OBSERVACION": "Falla interna en el equipo de potencia (incluyendo interruptor, seccionador, descargador, trafos de medición, reactores de línea o de tercearios, acoplamiento de O.P., nivel de aceite de cuba y RBC, tableros de control, etc.)"
				}];
				var ntL1 = "A" + (4 + tabla1.length + 5);
				var ntLt1 = "A" + (4 + tabla1.length + 3);
				var otherDataBook1 = [{
					"NOMBRE": "Lucas",
					"LONG (li)( Km )": "Andujar",
					"FSAL": "95232423",
					"HSAL": "113243343",
					"MSAL": "acl.gabriel@gmail.com",
					"FENT": "aguero 1229",
					"HENT": "Inclusion Services",
					"MENT": "Vault",
					"TIEMPO (ti)(HS)": "1,77",
					"(li x ti)": "74,2",
					"NS": "NO",
					"OBSERVACION": "Animales, plantaciones, condiciones meteorológicas, nidos de aves y otros objetos que afecten la aislación"
				}, {
					"NOMBRE": "Margarita",
					"LONG (li)( Km )": "Machado",
					"FSAL": "953323234",
					"HSAL": "113232243",
					"MSAL": "dcedeno@gmail.com",
					"FENT": "aguero 1229",
					"HENT": "Vault",
					"MENT": "Vault",
					"TIEMPO (ti)(HS)": "1,77",
					"(li x ti)": "74,2",
					"NS": "NO",
					"OBSERVACION": "Otras (desprendimiento hilo de guardia, caída de estructuras por accidente, terceros, pérdida de vínculo de transmisión, corte de conductor o morseto, desprendimiento de puentes, error de conexionado, aisladores, revisión de equipamiento, vandalismo, aislador bushing, enlaces de comunicaciones, extensión horario de trabajo)"
				}, {
					"NOMBRE": "Pedro",
					"LONG (li)( Km )": "Ramirez",
					"FSAL": "932423434",
					"HSAL": "1129692929",
					"MSAL": "casthielle@gmail.com",
					"FENT": "Segurola 3500",
					"HENT": "Inclusion Services",
					"MENT": "Vault",
					"TIEMPO (ti)(HS)": "1,77",
					"(li x ti)": "74,2",
					"NS": "NO",
					"OBSERVACION": "Falla interna en el equipo de potencia (incluyendo interruptor, seccionador, descargador, trafos de medición, reactores de línea o de tercearios, acoplamiento de O.P., nivel de aceite de cuba y RBC, tableros de control, etc.)"
				}];
				/* Initial row at A2 */
				var ws = XLSX.utils.aoa_to_sheet([
					["FORZADAS AUTORIZADAS -  LINEAS TRANSENER 500 kV"]
				], {
					origin: "A2:E2"
				});
				XLSX.utils.sheet_add_aoa(ws, [
					["FORZADAS - LINEAS TRANSENER 500 kV"]
				], {
					origin: ntLt1
				});
				XLSX.utils.sheet_add_json(ws, tabla2, {
					origin: ntL1
				});

				var posRefCell = "A" + (4 + tabla1.length + tabla2.length + 8);
				var posRefCellContent = "A" + (4 + tabla1.length + tabla2.length + 10);
				var posRefCellContentDEsc = "B" + (4 + tabla1.length + tabla2.length + 10);
				XLSX.utils.sheet_add_aoa(ws, [
					["REFERENCIAS"]
				], {
					origin: posRefCell
				});
				var refBook1 = [
					["ID"],
					["NOMBRE"],
					["LONG (li)(Km)"],
					["FSAL"],
					["HSAL"],
					["MSAL"],
					["FENT"],
					["HENT"],
					["MENT"],
					["TIEMPO (ti)"],
					["(li x ti)"],
					["ENS"],
					["OBSERVACION"]
				];
				var refBook1_2 = [
					["ID de la novedad"],
					["Descripción del Equipo según CAMMESA"],
					["Longitud de la Línea"],
					["Fecha Salida de Servicio"],
					["Hora Salida de Servicio"],
					["Minuto Salida de Servicio"],
					["Fecha Entrada de Servicio"],
					["Hora Entrada de Servicio"],
					["Minuto Entrada de Servicio"],
					["Tiempo (en Horas) de Indisponibilidad"],
					["Longitud de la Línea por Tiempo (en Horas) de Indisponibilidad"],
					["Energía No Suministrada (S: si - N: no)"],
					["Clasificación según PT12 (Procedimiento Técnico de CAMMESA)"]
				];
				XLSX.utils.sheet_add_aoa(ws, refBook1, {
					origin: posRefCellContent
				});
				XLSX.utils.sheet_add_aoa(ws, refBook1_2, {
					origin: posRefCellContentDEsc
				});

				var sheet = XLSX.utils.sheet_add_json(ws, tabla1, {
					sheet: "Test Excel Book 1",
					origin: "A4",
					fill: {
						patternType: "none",
						fgColor: {
							rgb: "FF000000"
						},
						bgColor: {
							rgb: "00000000"
						}
					}
				});

				/* BOOK 2 CONTENT */
				var libro2_datos = [{
					"NOMBRE": "Andres",
					"LONG (li)( Km )": "Andorra",
					"FSAL": "95232423",
					"HSAL": "113243343",
					"MSAL": "acl.gabriel@gmail.com",
					"FENT": "aguero 1229",
					"HENT": "Inclusion Services",
					"MENT": "Vault",
					"TIEMPO (ti)(HS)": "1,77",
					"(li x ti)": "74,2",
					"ENS": "NO",
					"OBSERVACION": "Animales, plantaciones, condiciones meteorológicas, nidos de aves y otros objetos que afecten la aislación"
				}, {
					"NOMBRE": "E.T.RAMALLO SAN NICOLAS 132.0 LI",
					"LONG (li)( Km )": "6",
					"FSAL": "21/12/2016",
					"HSAL": "10",
					"MSAL": "39",
					"FENT": "21/12/2016",
					"HENT": "13",
					"MENT": "07",
					"TIEMPO (ti)(HS)": "1,77",
					"(li x ti)": "74,2",
					"ENS": "NO",
					"OBSERVACION": "Otras (desprendimiento hilo de guardia, caída de estructuras por accidente, terceros, pérdida de vínculo de transmisión, corte de conductor o morseto, desprendimiento de puentes, error de conexionado, aisladores, revisión de equipamiento, vandalismo, aislador bushing, enlaces de comunicaciones, extensión horario de trabajo)"
				}];
				var next_table = "A" + (4 + tabla3.length + 5);
				var next_table_title = "A" + (4 + tabla3.length + 3);
				var libro2_datos_otro = [{
					"NOMBRE": "OTROP",
					"LONG (li)( Km )": "MAN",
					"FSAL": "95232423",
					"HSAL": "113243343",
					"MSAL": "acl.gabriel@gmail.com",
					"FENT": "aguero 1229",
					"HENT": "Inclusion Services",
					"MENT": "Vault",
					"TIEMPO (ti)(HS)": "1,77",
					"(li x ti)": "74,2",
					"ENS": "NO",
					"OBSERVACION": "Animales, plantaciones, condiciones meteorológicas, nidos de aves y otros objetos que afecten la aislación"
				}, {
					"NOMBRE": "E.T.RAMALLO SAN NICOLAS 132.0 LI",
					"LONG (li)( Km )": "6",
					"FSAL": "21/12/2016",
					"HSAL": "10",
					"MSAL": "39",
					"FENT": "21/12/2016",
					"HENT": "13",
					"MENT": "07",
					"TIEMPO (ti)(HS)": "1,77",
					"(li x ti)": "74,2",
					"ENS": "NO",
					"OBSERVACION": "Otras (desprendimiento hilo de guardia, caída de estructuras por accidente, terceros, pérdida de vínculo de transmisión, corte de conductor o morseto, desprendimiento de puentes, error de conexionado, aisladores, revisión de equipamiento, vandalismo, aislador bushing, enlaces de comunicaciones, extensión horario de trabajo)"
				}, {
					"NOMBRE": "VILLA LIA RAMALLO 220.0 1 LI",
					"LONG (li)( Km )": "6",
					"FSAL": "21/12/2016",
					"HSAL": "10",
					"MSAL": "39",
					"FENT": "21/12/2016",
					"HENT": "13",
					"MENT": "07",
					"TIEMPO (ti)(HS)": "1,77",
					"(li x ti)": "74,2",
					"ENS": "NO",
					"OBSERVACION": "Otras (desprendimiento hilo de guardia, caída de estructuras por accidente, terceros, pérdida de vínculo de transmisión, corte de conductor o morseto, desprendimiento de puentes, error de conexionado, aisladores, revisión de equipamiento, vandalismo, aislador bushing, enlaces de comunicaciones, extensión horario de trabajo)"
				}];
				/* Initial row at A2 */
				var ws2 = XLSX.utils.aoa_to_sheet([
					["FORZADAS AUTORIZADAS - LINEAS TRANSENER 220 - 132 kV"]
				], {
					origin: "A2:E2"
				});
				XLSX.utils.sheet_add_aoa(ws2, [
					["FORZADAS - LINEAS TRANSENER 220 - 132 kV"]
				], {
					origin: next_table_title
				});
				XLSX.utils.sheet_add_json(ws2, tabla4, {
					origin: next_table
				});
				var sheet2 = XLSX.utils.sheet_add_json(ws2, tabla3, {
					sheet: "Test Excel Book 2",
					origin: "A4"
				});

				/* BOOK 3 CONTENT */
				var dataBook3 = [{
					"nombre": "Eusebio",
					"apellido": "Labriola",
					"documento": "14895655",
					"telefono": "1166666666",
					"email": "eulab@xx.lc",
					"direccion": "Carabobo 3214",
					"empresa": "AAA"
				}, {
					"nombre": "Juana",
					"apellido": "Giralt",
					"documento": "18999999",
					"telefono": "1122222222",
					"email": "jaltgi@cc.cc",
					"direccion": "Nuñez	196",
					"empresa": "BBB"
				}, {
					"nombre": "Martin",
					"apellido": "Palermo",
					"documento": "12345678",
					"telefono": "1111111111",
					"email": "palermo.martin@tt.yy",
					"direccion": "Carlos Calvo 1250",
					"empresa": "CCC"
				}

				];
				var otherDataBook3 = [{
					"NOMBRE": "OTROP",
					"LONG (li)( Km )": "MAN",
					"FSAL": "95232423",
					"HSAL": "113243343",
					"MSAL": "acl.gabriel@gmail.com",
					"FENT": "aguero 1229",
					"HENT": "Inclusion Services",
					"MENT": "Vault",
					"TIEMPO (ti)(HS)": "1,77",
					"(li x ti)": "74,2",
					"ENS": "NO",
					"OBSERVACION": "Animales, plantaciones, condiciones meteorológicas, nidos de aves y otros objetos que afecten la aislación"
				}, {
					"NOMBRE": "E.T.RAMALLO SAN NICOLAS 132.0 LI",
					"LONG (li)( Km )": "6",
					"FSAL": "21/12/2016",
					"HSAL": "10",
					"MSAL": "39",
					"FENT": "21/12/2016",
					"HENT": "13",
					"MENT": "07",
					"TIEMPO (ti)(HS)": "1,77",
					"(li x ti)": "74,2",
					"ENS": "NO",
					"OBSERVACION": "Otras (desprendimiento hilo de guardia, caída de estructuras por accidente, terceros, pérdida de vínculo de transmisión, corte de conductor o morseto, desprendimiento de puentes, error de conexionado, aisladores, revisión de equipamiento, vandalismo, aislador bushing, enlaces de comunicaciones, extensión horario de trabajo)"
				}, {
					"NOMBRE": "VILLA LIA RAMALLO 220.0 1 LI",
					"LONG (li)( Km )": "6",
					"FSAL": "21/12/2016",
					"HSAL": "10",
					"MSAL": "39",
					"FENT": "21/12/2016",
					"HENT": "13",
					"MENT": "07",
					"TIEMPO (ti)(HS)": "1,77",
					"(li x ti)": "74,2",
					"ENS": "NO",
					"OBSERVACION": "Otras (desprendimiento hilo de guardia, caída de estructuras por accidente, terceros, pérdida de vínculo de transmisión, corte de conductor o morseto, desprendimiento de puentes, error de conexionado, aisladores, revisión de equipamiento, vandalismo, aislador bushing, enlaces de comunicaciones, extensión horario de trabajo)"
				}];
				var ntB3 = "A" + (4 + tabla5.length + 5);
				var ntB3T = "A" + (4 + tabla5.length + 3);
				// Initial row at A2
				var ws3 = XLSX.utils.aoa_to_sheet([
					["FORZADAS AUTORIZADAS - LINEAS TRANSENER 500 kV + TI"]
				], {
					origin: "A2:E2"
				});
				XLSX.utils.sheet_add_aoa(ws3, [
					["FORZADA - LINEAS TRANSENER 500 kV + TI"]
				], {
					origin: ntB3T
				});
				XLSX.utils.sheet_add_json(ws3, tabla6, {
					origin: ntB3
				});
				var sheet3 = XLSX.utils.sheet_add_json(ws3, tabla5, {
					sheet: "Test Excel Book 3",
					origin: "A4"
				});

				/* BOOK 4 CONTENT */
				var dataBook4 = [{
					"nombre": "Irving",
					"apellido": "Saenz",
					"documento": "7894562",
					"telefono": "1133333333",
					"email": "masaenz@rr.tt",
					"direccion": "San Martin 3214",
					"empresa": "DDD"
				}, {
					"nombre": "Ana",
					"apellido": "Barilari",
					"documento": "12456789",
					"telefono": "1198765432",
					"email": "barilari.ana@cc.xs",
					"direccion": "Alberti 1236",
					"empresa": "EEE"
				}, {
					"nombre": "Carolina",
					"apellido": "Rosso",
					"documento": "15896654",
					"telefono": "1133333333",
					"email": "roscaro@lk.oi",
					"direccion": "Echeverria 1235",
					"empresa": "GGG"
				}

				];
				var otherDataBook4 = [{
					"NOMBRE": "OTROP",
					"LONG (li)( Km )": "MAN",
					"FSAL": "95232423",
					"HSAL": "113243343",
					"MSAL": "acl.gabriel@gmail.com",
					"FENT": "aguero 1229",
					"HENT": "Inclusion Services",
					"MENT": "Vault",
					"TIEMPO (ti)(HS)": "1,77",
					"(li x ti)": "74,2",
					"ENS": "NO",
					"OBSERVACION": "Animales, plantaciones, condiciones meteorológicas, nidos de aves y otros objetos que afecten la aislación"
				}, {
					"NOMBRE": "E.T.RAMALLO SAN NICOLAS 132.0 LI",
					"LONG (li)( Km )": "6",
					"FSAL": "21/12/2016",
					"HSAL": "10",
					"MSAL": "39",
					"FENT": "21/12/2016",
					"HENT": "13",
					"MENT": "07",
					"TIEMPO (ti)(HS)": "1,77",
					"(li x ti)": "74,2",
					"ENS": "NO",
					"OBSERVACION": "Otras (desprendimiento hilo de guardia, caída de estructuras por accidente, terceros, pérdida de vínculo de transmisión, corte de conductor o morseto, desprendimiento de puentes, error de conexionado, aisladores, revisión de equipamiento, vandalismo, aislador bushing, enlaces de comunicaciones, extensión horario de trabajo)"
				}, {
					"NOMBRE": "VILLA LIA RAMALLO 220.0 1 LI",
					"LONG (li)( Km )": "6",
					"FSAL": "21/12/2016",
					"HSAL": "10",
					"MSAL": "39",
					"FENT": "21/12/2016",
					"HENT": "13",
					"MENT": "07",
					"TIEMPO (ti)(HS)": "1,77",
					"(li x ti)": "74,2",
					"ENS": "NO",
					"OBSERVACION": "Otras (desprendimiento hilo de guardia, caída de estructuras por accidente, terceros, pérdida de vínculo de transmisión, corte de conductor o morseto, desprendimiento de puentes, error de conexionado, aisladores, revisión de equipamiento, vandalismo, aislador bushing, enlaces de comunicaciones, extensión horario de trabajo)"
				}];
				var ntB4 = "A" + (4 + tabla7.length + 5);
				var ntB4T = "A" + (4 + tabla7.length + 3);
				// Initial row at A2
				var ws4 = XLSX.utils.aoa_to_sheet([
					["FORZADAS AUTORIZADAS - TRANSFORMADORES TRANSENER"]
				], {
					origin: "A2:E2"
				});
				XLSX.utils.sheet_add_aoa(ws4, [
					["FORZADAS - TRANSFORMADORES TRANSENER"]
				], {
					origin: ntB4T
				});
				XLSX.utils.sheet_add_json(ws4, tabla8, {
					origin: ntB4
				});
				var sheet4 = XLSX.utils.sheet_add_json(ws4, tabla7, {
					sheet: "Test Excel Book 4",
					origin: "A4"
				});

				/* BOOK 5 CONTENT */
				var dataBook5 = [{
					"nombre": "Andres",
					"apellido": "Rodriguez",
					"documento": "94223456",
					"telefono": "1144444444",
					"email": "arodri@hg.jh",
					"direccion": "Estados Unidos 3214",
					"empresa": "HHH"
				}, {
					"nombre": "Jose",
					"apellido": "Suarez",
					"documento": "95988789",
					"telefono": "1177777777",
					"email": "jsuarez@sd.cc",
					"direccion": "Rivadavia 1236",
					"empresa": "III"
				}, {
					"nombre": "Maria Angelica",
					"apellido": "Ambrosio",
					"documento": "95666222",
					"telefono": "1155588899",
					"email": "mangbrosio@gf.hg",
					"direccion": "Peru 356",
					"empresa": "JJJ"
				}

				];
				var otherDataBook5 = [{
					"NOMBRE": "OTROP",
					"LONG (li)( Km )": "MAN",
					"FSAL": "95232423",
					"HSAL": "113243343",
					"MSAL": "acl.gabriel@gmail.com",
					"FENT": "aguero 1229",
					"HENT": "Inclusion Services",
					"MENT": "Vault",
					"TIEMPO (ti)(HS)": "1,77",
					"(li x ti)": "74,2",
					"ENS": "NO",
					"OBSERVACION": "Animales, plantaciones, condiciones meteorológicas, nidos de aves y otros objetos que afecten la aislación"
				}, {
					"NOMBRE": "E.T.RAMALLO SAN NICOLAS 132.0 LI",
					"LONG (li)( Km )": "6",
					"FSAL": "21/12/2016",
					"HSAL": "10",
					"MSAL": "39",
					"FENT": "21/12/2016",
					"HENT": "13",
					"MENT": "07",
					"TIEMPO (ti)(HS)": "1,77",
					"(li x ti)": "74,2",
					"ENS": "NO",
					"OBSERVACION": "Otras (desprendimiento hilo de guardia, caída de estructuras por accidente, terceros, pérdida de vínculo de transmisión, corte de conductor o morseto, desprendimiento de puentes, error de conexionado, aisladores, revisión de equipamiento, vandalismo, aislador bushing, enlaces de comunicaciones, extensión horario de trabajo)"
				}, {
					"NOMBRE": "VILLA LIA RAMALLO 220.0 1 LI",
					"LONG (li)( Km )": "6",
					"FSAL": "21/12/2016",
					"HSAL": "10",
					"MSAL": "39",
					"FENT": "21/12/2016",
					"HENT": "13",
					"MENT": "07",
					"TIEMPO (ti)(HS)": "1,77",
					"(li x ti)": "74,2",
					"ENS": "NO",
					"OBSERVACION": "Otras (desprendimiento hilo de guardia, caída de estructuras por accidente, terceros, pérdida de vínculo de transmisión, corte de conductor o morseto, desprendimiento de puentes, error de conexionado, aisladores, revisión de equipamiento, vandalismo, aislador bushing, enlaces de comunicaciones, extensión horario de trabajo)"
				}];
				var ntB5 = "A" + (4 + tabla9.length + 5);
				var ntB5T = "A" + (4 + tabla9.length + 3);
				// Initial row at A2
				var ws5 = XLSX.utils.aoa_to_sheet([
					["FORZADAS AUTORIZADAS- TRANSFORMADORES TRANSENER + TI"]
				], {
					origin: "A2:E2"
				});
				XLSX.utils.sheet_add_aoa(ws5, [
					["FORZADAS - TRANSFORMADORES TRANSENER + TI"]
				], {
					origin: ntB5T
				});
				XLSX.utils.sheet_add_json(ws5, tabla10, {
					origin: ntB5
				});
				var sheet5 = XLSX.utils.sheet_add_json(ws5, tabla9, {
					sheet: "Test Excel Book 5",
					origin: "A4"
				});

				/* BOOK 6 CONTENT */
				var datos_nros = [
					["1"],
					["2"],
					["3"],
					["4"],
					["5"],
					["6"],
					["7"],
					["8"],
					["9"],
					["10"],
					["11"],
					["12"],
					["13"],
					["14"],
					["15"],
					["16"],
					["17"],
					["18"],
					["19"]
				];
				var datos_desc = [
					["Actuación correcta de automatismos del SADI"],
					["Actuación incorrecta de automatismos del SADI"],
					["Actuación incorrecta de los sistemas de protecciones y comunicaciones"],
					["Afectación de estructuras"],
					["Animales, plantaciones, condiciones meteorológicas, nidos de aves y otros objetos que afecten la aislación"],
					["Error humano/maniobra"],
					["Falla en barras"],
					[
						"Falla interna en el equipo de potencia (incluyendo interruptor, seccionador, descargador, trafos de medición, reactores de línea o de tercearios, acoplamiento de O.P., nivel de aceite de cuba y RBC, tableros de control, etc.)"
					],
					[
						"Otras (desprendimiento hilo de guardia, caída de estructuras por accidente, terceros, pérdida de vínculo de transmisión, corte de conductor o morseto, desprendimiento de puentes, error de conexionado, aisladores, revisión de equipamiento, vandalismo, aislador bushing, enlaces de comunicaciones, extensión horario de trabajo)"
					],
					["Tormenta eléctrica (descargas atmosféricas, viento intenso, etc.)"],
					["Atentado"],
					["Incendio de campos"],
					["Actuación de protecciones en zona de respaldo remoto"],
					["Desconocidas"],
					["Oscilaciones de Potencia"],
					["Sobrecarga"],
					["Protección de sobretensión, subfrecuencia, sobrefrecuencia, sobreflujo"],
					["Meteoro (Tormado, Inundación, Terremoto)"],
					["Vinculada y sin Tensión por la pérdida de vínculos"]
				];
				var ws6 = XLSX.utils.sheet_add_aoa(ws6, datos_nros, {
					origin: "A1"
				});
				var sheet6 = XLSX.utils.sheet_add_aoa(ws6, datos_desc, {
					sheet: "Test Excel Book 6",
					origin: "B1"
				});

				var Workbook = XLSX.utils.book_new();

				XLSX.utils.book_append_sheet(Workbook, sheet, "LINEAS TRANSENER 500 kV")
				XLSX.utils.book_append_sheet(Workbook, sheet2, "LINEAS TRANSENER 220 132kV")
				XLSX.utils.book_append_sheet(Workbook, sheet3, "LINEAS TRANSENER + TI")
				XLSX.utils.book_append_sheet(Workbook, sheet4, "TRAFOS TRANSENER")
				XLSX.utils.book_append_sheet(Workbook, sheet5, "TRAFOS TRANSENER + TI")
				XLSX.utils.book_append_sheet(Workbook, sheet6, "HOJA 1")

				//console.log(Workbook.Sheets);
				//Workbook.Sheets.sheet.A1.s = { fill: {patternType: "none",fgColor: {rgb: "FF000000"},bgColor: {rgb: "00000000"}} }

				XLSX.writeFile(Workbook, 'ENRE 390.xlsx', {
					cellStyles: true
				});
			});
		},
		reportesPDF: function () {
			var that = this;

			// this.dialogReportes = new sap.m.Dialog({
			// 	type: sap.m.DialogType.Message,
			// 	title: "Seleccione el reporte que desee descargar",
			// 	escapeHandler: function (oPromise) {
			// 		oPromise.reject();
			// 	},
			// 	content: [
			// 		new sap.m.VBox({
			// 			items: [
			// 				new sap.m.Button({
			// 					text: "Reporte ENRE Salidas",
			// 					press: [that.reportePDFENRESalidas, that]
			// 				}),
			// 				new sap.m.Button({
			// 					text: "Reporte ENRE Capacidad Transporte",
			// 					press: [that.reportePDFENRECapacidadTransporte, that]
			// 				}),
			// 				new sap.m.Button({
			// 					text: "Reporte ENRE Potencia Reactiva",
			// 					press: [that.reportePDFENREPotenciaReactiva, that]
			// 				}),
			// 				new sap.m.Button({
			// 					text: "Reporte ENRE Transformacion",
			// 					press: [that.reportePDFENRETransformacion, that]
			// 				}),
			// 			]
			// 		})
			// 	],
			// 	buttons: [
			// 		new sap.m.Button({
			// 			//icon: "sap-icon://save",
			// 			type: sap.m.ButtonType.Emphasized,
			// 			text: "Cerrar",
			// 			press: [function () {
			// 				this.dialogReportes.close()
			// 			}, this]
			// 		})
			// 	]
			// });

			this.getView().addDependent(this.dialogReportes);

			var model = ModelHelper.getModel("InformeFiltersJsonModel");
			model.setData({});
			this.dialogReportesPDF = new sap.m.Dialog({
				type: sap.m.DialogType.Message,
				title: "Reportes ENRE",
				escapeHandler: function (oPromise) {
					oPromise.reject();
				},
				content: [
					new sap.m.VBox({
						items: [
							new sap.m.HBox({
								items: [
									new sap.m.Label({
										text: "Reporte",
										width: "100px"
									}).addStyleClass("CustomLabel"),
									new sap.m.ComboBox({
										selectionChange: [this.onSelectReporte, this],
										selectedKey: "{InformeFiltersJsonModel>/Reporte}",
										items: [
											new sap.ui.core.Item({
												key: "R01",
												text: "ENRE Salidas"
											}),
											new sap.ui.core.Item({
												key: "R02",
												text: "ENRE Capacidad de Transporte"
											}),
											new sap.ui.core.Item({
												key: "R03",
												text: "ENRE Potencia Reactiva"
											}),
											new sap.ui.core.Item({
												key: "R04",
												text: "ENRE Transformación"
											})
										],
										layoutData: new sap.m.FlexItemData({
											growFactor: 1
										}),
										width: "100%"
									})
								]
							}),
							new sap.m.HBox({
								items: [
									new sap.m.Label({
										text: "Empresa",
										width: "100px"
									}).addStyleClass("CustomLabel"),
									new sap.m.ComboBox({
										selectedKey: "{InformeFiltersJsonModel>/Empresa}",
										items: {
											path: "NSEmpresasSet>/Empresas",
											template: new sap.ui.core.Item({
												key: "{NSEmpresasSet>CodEmpresa}",
												text: "{NSEmpresasSet>CodEmpresa}"
											})
										},
										layoutData: new sap.m.FlexItemData({
											growFactor: 1
										}),
										width: "120px"
									}),
									new sap.m.ComboBox({
										selectedKey: "{InformeFiltersJsonModel>/Empresa}",
										items: {
											path: "NSEmpresasSet>/Empresas",
											template: new sap.ui.core.Item({
												key: "{NSEmpresasSet>CodEmpresa}",
												text: "{NSEmpresasSet>Descripcion}"
											})
										},
										layoutData: new sap.m.FlexItemData({
											growFactor: 6
										}),
										width: "100%"
									})
								]
							}),
							new sap.m.HBox({
								items: [
									new sap.m.HBox({
										alignItems: "Center",
										items: [
											new sap.m.Label({
												text: "Desde",
												width: "100px"
											}).addStyleClass("CustomLabel"),
											new sap.m.DatePicker({
												dateValue: "{InformeFiltersJsonModel>/desde}",
											})
										]
									}),
									new sap.m.HBox({
										items: [
											new sap.m.Label({
												text: "Hasta",
												width: "100px"
											}).addStyleClass("CustomLabel"),
											new sap.m.DatePicker({
												dateValue: "{InformeFiltersJsonModel>/hasta}",
											})
										]
									})
								]
							})
						]
					})
				],
				buttons: [
					new sap.m.Button({
						//icon: "sap-icon://save",
						type: sap.m.ButtonType.Emphasized,
						text: "Exportar",
						press: [function () {
							var filters = [];
							var filtersData = ModelHelper.getModel("InformeFiltersJsonModel").getData();

							/* (filtersData.Empresa == "" || typeof (filtersData.Empresa) == "undefined") {
								sap.m.MessageBox.alert("Debe seleccionar la Empresa", {
									title: "Filtros reporte"
								});
								return false;
							}*/
							if (filtersData.Empresa) {
								filters.push(new sap.ui.model.Filter({
									path: "Empresa",
									operator: sap.ui.model.FilterOperator.EQ,
									value1: filtersData.Empresa
								}));
							}

							filters.push(new sap.ui.model.Filter({
								path: "Sociedad",
								operator: sap.ui.model.FilterOperator.EQ,
								value1: this.society
							}));
							if (!(filtersData.desde && filtersData.hasta)) {
								sap.m.MessageBox.alert("Debe seleccionar fecha desde y fecha hasta", {
									title: "Filtros reporte"
								});
								return;
							}
							filtersData.hasta.setHours(23, 59, 59, 999);

							filters.push(new sap.ui.model.Filter("Fecsalida", sap.ui.model.FilterOperator.BT, filtersData.desde, filtersData.hasta));

							that.reportesPDFFilters = filters;
							var filtersData = ModelHelper.getModel("InformeFiltersJsonModel").getData();

							switch (filtersData.Reporte) {
								case "R01":
									that.reportePDFENRESalidas(that);
									break;
								case "R02":
									that.reportePDFENRECapacidadTransporte(that);
									break;
								case "R03":
									that.reportePDFENREPotenciaReactiva(that);
									break;
								case "R04":
									that.reportePDFENRETransformacion(that);
									break;
							}
							//this.dialogReportesPDF.close();
							//this.dialogReportes.open();
						}, this]
					}),
					new sap.m.Button({
						//icon: "sap-icon://save",
						type: sap.m.ButtonType.Emphasized,
						text: "Cancelar",
						press: [function () {
							this.dialogReportesPDF.close();
						}, this]
					})
				]
			});

			this.getView().addDependent(this.dialogReportesPDF);

			this.dialogReportesPDF.open();
		},
		onSelectReporte: function (evt) {
			var Reporte = evt.getSource().getSelectedKey()
			this.loadNSEmpresas(this.society, Reporte);
		},
		loadNSEmpresas: function (empresa, reporte) {
			var that = this;
			const oView = that.getView()
			var filters = [new sap.ui.model.Filter({
				path: "Empresa",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: empresa
			})];
			if (reporte) {
				filters.push(new sap.ui.model.Filter("Reporte", sap.ui.model.FilterOperator.EQ, reporte));
			}
			var oModeld = oDataService.getModel("");
			oModeld.read("/NSEmpresasSet", {
				/*urlParameters: {
					$expand: "TurnoUsuarioSet"
				},*/
				filters: filters,
				success: function (data) {
					var empresas = data.results;
					ModelHelper.getModel("NSEmpresasSet", oView).setData({
						Empresas: empresas
					});
				},
				error: function (err) {
					//do something;
				}
			});
		},
		reportePDFENRESalidas: function () {
			jQuery.sap.registerModulePath("index", "https://unpkg.com/jspdf@1.4.1/dist/");
			jQuery.sap.require({
				modName: "index.jspdf",
				type: "min"
			});
			jQuery.sap.registerModulePath("index", "https://unpkg.com/jspdf-autotable@3.0.4/dist/");
			jQuery.sap.require({
				modName: "index.jspdf",
				type: "plugin.autotable"
			});
			//comentar al terminar los tests
			/*jQuery.sap.registerModulePath("index", "https://unpkg.com/jszip@3.1.5/dist/");
			jQuery.sap.require({
				modName: "index.jszip"
			});
			jQuery.sap.require("transener/registrocronologicoeventos/libs/FileSaver");*/

			var that = this;
			var aFilters = this.reportesPDFFilters;
			var filtersData = ModelHelper.getModel("InformeFiltersJsonModel").getData();
			if (!filtersData.Empresa) {
				jQuery.sap.registerModulePath("index", "https://unpkg.com/jszip@3.1.5/dist/");
				jQuery.sap.require({
					modName: "index.jszip"
				});

				jQuery.sap.require("transener/registrocronologicoeventos/libs/FileSaver");

				var empresas = ModelHelper.getModel("NSEmpresasSet").getData().Empresas;

				function reflect(promise) {
					return promise.then(function (res) {
						return {
							res: res,
							status: "resolved"
						}
					},
						function (err) {
							return {
								err: err,
								status: "rejected"
							}
						});
				}

				var promises = [];
				this.globalBusyDialog.open();
				for (var i = 0; i < empresas.length; i++) {
					var currFilters = aFilters.slice();
					currFilters.push(new sap.ui.model.Filter({
						path: "Empresa",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: empresas[i].CodEmpresa
					}));
					promises.push(getReporteDoc(currFilters, empresas[i].Descripcion));
				}

				Promise.all(promises.map(reflect)).then(function (results) {
					var zip = new JSZip();
					for (var i = 0; i < results.length; i++) {
						var doc = results[i].res;
						var pdfData = doc.output("blob");
						zip.file(`ENRE-Salidas-${empresas[i].CodEmpresa}.pdf`, pdfData, {
							base64: true
						});
					}
					zip.generateAsync({
						type: "blob"
					})
						.then(function (content) {
							// see FileSaver.js

							that.globalBusyDialog.close();
							saveAs(content, "ENRE-Salidas.zip");
						});
				});

				return;
			}
			this.globalBusyDialog.open();
			getReporteDoc(aFilters, that.getFilterEmpresa()).then(function (doc) {
				that.globalBusyDialog.close();
				doc.save("ENRE-Salidas.pdf");
			});

			function getReporteDoc(filters, empresa) {
				return new Promise(function (resolve, reject) {
					ReportesService.getEnreSalidas(filters).then(function (data) {
						var estaciones = ModelHelper.getModel("EstacionesJsonModel").getProperty("/Estaciones");

						function searchEstacion(code) {
							for (var i = 0; i < estaciones.length; i++) {
								if (code === estaciones[i].Codigo) {
									return estaciones[i].Descripcion;
								}
							}
							return code; //esto no deberia volver 
						}

						var datePattern = sap.ui.core.format.DateFormat.getDateTimeInstance({
							pattern: "dd/MM/yyyy HH:mm"
						});

						function formatDate(date) {
							if (!date || date.length) return date;
							return datePattern.format(date);
						}

						var timePattern = sap.ui.core.format.DateFormat.getDateTimeInstance({
							pattern: "HH:mm"
						});

						function formatTime(date) {
							if (!date || date.length) return date;
							return timePattern.format(date);
						}

						var doc = new jsPDF({
							format: "a3",
							orientation: 'l',
							unit: "mm"
						});

						var imageUrl = that.imageUrl;
						if (that.imageUrl) {
							if (that.society == 100) {
								doc.addImage(imageUrl, 'PNG', 10, 10, 40, 15);
							} else {
								doc.addImage(imageUrl, 'PNG', 10, 10, 50, 13);
							}
						}
						doc.setFontSize(14);
						doc.setFontType("bold");
						doc.text(70, 10, "SISTEMA DE TRANSPORTE DE ENERGIA EN ALTA TENSION");
						doc.setFontSize(22);
						doc.text(70, 18, "CARGOS POR CONEXION - SALIDAS ( " + empresa + " )");
						doc.setFontType("normal");
						doc.setFontSize(8);
						var filtersData = ModelHelper.getModel("InformeFiltersJsonModel").getData();
						console.log(filtersData)
						var desde = formatDate(filtersData.desde);
						var hasta = formatDate(filtersData.hasta);
						doc.text(70, 24, "Del " + desde + " al " + hasta + "");

						var newData = data.results.map(function (el) {
							el.EstacionDesc = searchEstacion(el.Estacion);
							el.Horaentrada = that.formatTimeRPDF(el.Fecentrasa);
							el.Fecentrasa = that.formatDate(el.Fecentrasa);
							el.Horasalida = that.formatTimeRPDF(el.Fecsalida);
							el.Fecsalida = that.formatDate(el.Fecsalida);
							el.Horainfcammesa = that.formatTimeRPDF(el.Horainfcammesa);

							for (var x in el) {
								if (el[x] === null || el[x] === undefined) {
									el[x] = "";
								}
							}
							//el.EntIndisFormat = formatDate(el.EntIndis);
							//el.EntDispoFormat = formatDate(el.EntDispo);

							//el.Autcammesa = el.Autcammesa ? "S" : "N";
							el.text = el.Motivo;
							return el;
						});

						var headers = [{
							Orden: "(1)",
							EstacionDesc: "(2)",
							Equipo: "(3)",
							Kv: "(4)",
							Fecsalida: "(5)",
							Horasalida: "(6)",
							Fecentrasa: "(7)",
							Horaentrada: "(8)",
							Tipoind: "(9)",
							Autorizacammesa: "(10)",
							Horainfcammesa: "(11)",
							text: "(12)",
						}, {
							Orden: "N°\nOrden",
							EstacionDesc: "\nEstacion\nTransformadora",
							Equipo: "Equipo",
							Kv: "K.V.",
							Fecsalida: "Salida Fecha",
							Horasalida: "Salida Hora",
							Fecentrasa: "Entrada Fecha",
							Horaentrada: "Entrada Hora",
							Tipoind: "Tipo\nIndisp.",
							Autorizacammesa: "Autoriz.\nCAMMESA",
							Horainfcammesa: "Hora Inf.\nCAMMESA",
							text: "Motivo de la Insdisponibilidad"
						}];

						var colLongs = [{
							"dataKey": "Orden"
						}, {
							"dataKey": "EstacionDesc"
						}, {
							"dataKey": "Equipo"
						}, {
							"dataKey": "Kv"
						}, {
							"dataKey": "Fecsalida"
						}, {
							"dataKey": "Horasalida"
						}, {
							"dataKey": "Fecentrasa"
						}, {
							"dataKey": "Horaentrada"
						}, {
							"dataKey": "Tipoind"
						}, {
							"dataKey": "Autorizacammesa"
						}, {
							"dataKey": "Horainfcammesa"
						}, {
							"dataKey": "text"
						}];
						doc.autoTable({
							head: headers,
							columns: colLongs,
							body: newData,
							startY: 25,
							margin: {
								horizontal: 7,
								top: 30,
								bottom: 55
							},
							bodyStyles: {
								valign: 'top'
							},
							styles: {
								overflow: 'linebreak',
								cellWidth: 'wrap',
								tableWidth: 300
							},
							columnStyles: {
								text: {
									cellWidth: 'auto'
								}
							},
							didDrawPage: function (data) {
								// Footer
								doc.setFontSize(10);

								// jsPDF 1.4+ uses getWidth, <1.4 uses .width
								var pageSize = doc.internal.pageSize;
								var pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();

								var text =
									`(1) Número de Orden
(2) Indica Nombre de la ET
(3)Equipamiento Afectado
(4) Tensión de Salida
(5) Día en que la Línea salió de Servicio
(6) Hora en que la Línea salió de Servicio
(7) Día en que la línea entró en Disponibilidad
(7) Hora en que la línea entró en Disponibilidad
(9) Tipo de Indisponibilidad: Forzada(F), Programada(P) o Restringida(R)
(10) Autorizó CAMMESA (Si/No)
(11) Hora en que se informó a CAMMESA.
(12) Motivo de la Indisponibilidad`;
								doc.text(text, data.settings.margin.left, pageHeight - 50);
							},
						});

						resolve(doc);

						//doc.save("ENRE-Salidas.pdf");

					});
				});
			}

		},

		reportePDFENRECapacidadTransporte: function () {

			jQuery.sap.registerModulePath("index", "https://unpkg.com/jspdf@1.4.1/dist/");
			jQuery.sap.require({
				modName: "index.jspdf",
				type: "min"
			});
			jQuery.sap.registerModulePath("index", "https://unpkg.com/jspdf-autotable@3.0.4/dist/");
			jQuery.sap.require({
				modName: "index.jspdf",
				type: "plugin.autotable"
			});

			var that = this;
			var aFilters = this.reportesPDFFilters;
			var filtersData = ModelHelper.getModel("InformeFiltersJsonModel").getData();
			if (!filtersData.Empresa) {
				jQuery.sap.registerModulePath("index", "https://unpkg.com/jszip@3.1.5/dist/");
				jQuery.sap.require({
					modName: "index.jszip"
				});

				jQuery.sap.require("transener/registrocronologicoeventos/libs/FileSaver");

				var empresas = ModelHelper.getModel("NSEmpresasSet").getData().Empresas;

				function reflect(promise) {
					return promise.then(function (res) {
						return {
							res: res,
							status: "resolved"
						}
					},
						function (err) {
							return {
								err: err,
								status: "rejected"
							}
						});
				}

				var promises = [];
				this.globalBusyDialog.open();
				for (var i = 0; i < empresas.length; i++) {
					var currFilters = aFilters.slice();
					currFilters.push(new sap.ui.model.Filter({
						path: "Empresa",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: empresas[i].CodEmpresa
					}));
					promises.push(getReporteDoc(currFilters, empresas[i].Descripcion));
				}

				Promise.all(promises.map(reflect)).then(function (results) {
					var zip = new JSZip();
					for (var i = 0; i < results.length; i++) {
						var doc = results[i].res;
						var pdfData = doc.output("blob");
						zip.file(`ENRE-Capacidad-de-transporte-${empresas[i].CodEmpresa}.pdf`, pdfData, {
							base64: true
						});
					}
					zip.generateAsync({
						type: "blob"
					})
						.then(function (content) {
							// see FileSaver.js
							that.globalBusyDialog.close();
							saveAs(content, "ENRE-Capacidad-de-transporte.zip");
						});
				});

				return;
			}
			this.globalBusyDialog.open();
			getReporteDoc(aFilters, that.getFilterEmpresa()).then(function (doc) {
				that.globalBusyDialog.close();
				doc.save("ENRE-Capacidad-de-transporte.pdf");
			});

			function getReporteDoc(filters, empresa) {
				return new Promise(function (resolve, reject) {
					ReportesService.getEnreCapacidadTransp(filters).then(function (data) {

						var estaciones = ModelHelper.getModel("EstacionesJsonModel").getProperty("/Estaciones");

						function searchEstacion(code) {
							for (var i = 0; i < estaciones.length; i++) {
								if (code === estaciones[i].Codigo) {
									return estaciones[i].Descripcion;
								}
							}
							return code; //esto no deberia volver 
						}

						var datePattern = sap.ui.core.format.DateFormat.getDateTimeInstance({
							pattern: "dd/MM/yyyy HH:mm"
						});

						function formatDate(date) {
							if (!date || date.length) return date;
							return datePattern.format(date);
						}

						var timePattern = sap.ui.core.format.DateFormat.getDateTimeInstance({
							pattern: "HH:mm"
						});

						function formatTime(date) {
							if (!date || date.length) return date;
							return timePattern.format(date);
						}

						var doc = new jsPDF({
							format: "a3",
							orientation: 'l',
							unit: "mm"
						});

						var imageUrl = that.imageUrl;
						if (that.imageUrl) {
							if (that.society == 100) {
								doc.addImage(imageUrl, 'PNG', 10, 10, 40, 15);
							} else {
								doc.addImage(imageUrl, 'PNG', 10, 10, 50, 13);
							}
						}
						doc.setFontSize(14);
						doc.setFontType("bold");
						doc.text(70, 10, "SISTEMA DE TRANSPORTE DE ENERGIA EN ALTA TENSION");
						doc.setFontSize(22);
						doc.text(70, 18, "CARGOS POR CAPACIDAD DE TRANSPORTE ( " + empresa + " )");
						doc.setFontType("normal");
						doc.setFontSize(8);
						var filtersData = ModelHelper.getModel("InformeFiltersJsonModel").getData();
						var desde = formatDate(filtersData.desde);
						var hasta = formatDate(filtersData.hasta);
						doc.text(70, 24, "Del " + desde + " al " + hasta + "");

						var newData = data.results.map(function (el) {
							el.EstacionDesc = searchEstacion(el.Estacion);
							el.Horaentrada = that.formatTimeRPDF(el.Fecentrasa);
							el.Fecentrasa = that.formatDate(el.Fecentrasa);
							el.Horasalida = that.formatTimeRPDF(el.Fecsalida);
							el.Fecsalida = that.formatDate(el.Fecsalida);
							el.Horainfcammesa = that.formatTimeRPDF(el.Horainfcammesa);

							for (var x in el) {
								if (!(el[x] !== null && [x] != undefined)) {
									el[x] = "";
								}
							}
							//el.EntIndisFormat = formatDate(el.EntIndis);
							//el.EntDispoFormat = formatDate(el.EntDispo);

							//var informeCammesa = el.InformeCammesaSet[0];
							//el.Autcammesa = el.Autcammesa ? "S" : "N";
							el.text = el.Motivo;
							return el;
						});

						var headers = [{
							Orden: "(1)",
							Linea: "(2)",
							Kv: "(3)",
							Km: "(4)",
							Fecsalida: "(5)",
							Horasalida: "(6)",
							Fecentrasa: "(7)",
							Horaentrada: "(8)",
							Tipoind: "(9)",
							Resporcentage: "(10)",
							Rd: "(11)",
							Autcammesa: "(12)",
							Horainfcammesa: "(13)",
							text: "(14)"
						}, {
							Orden: "N°\nOrden",
							Linea: "Linea",
							Kv: "K.V.",
							Km: "KM",
							Fecsalida: "Salida Fecha",
							Horasalida: "Salida Hora",
							Fecentrasa: "Entrada Fecha",
							Horaentrada: "Entrada Hora",
							Tipoind: "Tipo\nIndisp.",
							Resporcentage: "Res%",
							Rd: "RD",
							Autcammesa: "Autoriz.\nCAMMESA",
							Horainfcammesa: "Hora Inf.\nCAMMESA",
							text: "Motivo de la Insdisponibilidad"
						}];

						var colLongs = [{
							"title": "N°\nOrden",
							"dataKey": "Orden"
						}, {
							"title": "Linea",
							"dataKey": "Linea"
						}, {
							"title": "K.V.",
							"dataKey": "Kv"
						}, {
							"title": "KM",
							"dataKey": "Km"
						}, {
							"title": "Salida Fecha",
							"dataKey": "Fecsalida"
						}, {
							"title": "Salida Hora",
							"dataKey": "Horasalida"
						}, {
							"title": "Entrada Fecha",
							"dataKey": "Fecentrasa"
						}, {
							"title": "Entrada Hora",
							"dataKey": "Horaentrada"
						}, {
							"title": "Tipo\nIndisp.",
							"dataKey": "Tipoind"
						}, {
							"title": "Rest%",
							"dataKey": "Resporcentage"
						}, {
							"title": "RD",
							"dataKey": "Rd"
						}, {
							"title": "Autoriz.\nCAMMESA",
							"dataKey": "Autcammesa"
						}, {
							"title": "Hora Inf.\nCAMMESA",
							"dataKey": "Horainfcammesa"
						}, {
							"title": "Motivo de la Insdisponibilidad",
							"dataKey": "text"
						}];
						doc.autoTable({
							head: headers,
							columns: colLongs,
							body: newData,
							startY: 25,
							margin: {
								horizontal: 7,
								top: 30,
								bottom: 60
							},
							bodyStyles: {
								valign: 'top'
							},
							styles: {
								overflow: 'linebreak',
								cellWidth: 'wrap',
								tableWidth: 300
							},
							columnStyles: {
								text: {
									cellWidth: 'auto'
								}
							},
							didDrawPage: function (data) {
								// Footer
								doc.setFontSize(10);

								// jsPDF 1.4+ uses getWidth, <1.4 uses .width
								var pageSize = doc.internal.pageSize;
								var pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();

								var text =
									`(1) Número de Orden
									(2) Indica Nombre de la Línea de ET a ET
(3)Tensión de Servicio de la Línea
(4) Longitud de la Línea
(5) Día en que la Línea salió de Servicio
(6) Hora en que la Línea salió de Servicio
(7) Día en que la línea entró en Disponibilidad
(8) Hora en que la línea entró en Disponibilidad
(9) Tipo de Indisponibilidad: Forzada(F), Programada(P) o Restringida(R)
(10) Factor de Reducción, si lo hubo, en por ciento (FR)
(11) Se activaron D.A.G. y/o desconexión de cargas (RD=Si/No)
(12) Autorizó CAMMESA (Si/No)
(13) Hora en que se informó a CAMMESA.
(14) Motivo de la Indisponibilidad`
								doc.text(text, data.settings.margin.left, pageHeight - 55);
							},
						});
						resolve(doc);
						//doc.save("ENRE-Capacidad-de-transporte.pdf");
					})
				})
			}

		},

		reportePDFENREPotenciaReactiva: function () {
			var that = this;
			jQuery.sap.registerModulePath("index", "https://unpkg.com/jspdf@1.4.1/dist/");
			jQuery.sap.require({
				modName: "index.jspdf",
				type: "min"
			});
			jQuery.sap.registerModulePath("index", "https://unpkg.com/jspdf-autotable@3.0.4/dist/");
			jQuery.sap.require({
				modName: "index.jspdf",
				type: "plugin.autotable"
			});

			var that = this;
			var aFilters = this.reportesPDFFilters;
			var filtersData = ModelHelper.getModel("InformeFiltersJsonModel").getData();
			if (!filtersData.Empresa) {
				jQuery.sap.registerModulePath("index", "https://unpkg.com/jszip@3.1.5/dist/");
				jQuery.sap.require({
					modName: "index.jszip"
				});

				jQuery.sap.require("transener/registrocronologicoeventos/libs/FileSaver");

				var empresas = ModelHelper.getModel("NSEmpresasSet").getData().Empresas;

				function reflect(promise) {
					return promise.then(function (res) {
						return {
							res: res,
							status: "resolved"
						}
					},
						function (err) {
							return {
								err: err,
								status: "rejected"
							}
						});
				}

				var promises = [];
				this.globalBusyDialog.open();
				for (var i = 0; i < empresas.length; i++) {
					var currFilters = aFilters.slice();
					currFilters.push(new sap.ui.model.Filter({
						path: "Empresa",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: empresas[i].CodEmpresa
					}));
					promises.push(getReporteDoc(currFilters, empresas[i].Descripcion));
				}

				Promise.all(promises.map(reflect)).then(function (results) {
					var zip = new JSZip();
					for (var i = 0; i < results.length; i++) {
						var doc = results[i].res;
						var pdfData = doc.output("blob");
						zip.file(`ENRE-Potencia-Reactiva-${empresas[i].CodEmpresa}.pdf`, pdfData, {
							base64: true
						});
					}
					zip.generateAsync({
						type: "blob"
					})
						.then(function (content) {
							// see FileSaver.js
							that.globalBusyDialog.close();
							saveAs(content, "ENRE-Potencia-Reactiva.zip");
						});
				});

				return;
			}
			this.globalBusyDialog.open();
			getReporteDoc(aFilters, that.getFilterEmpresa()).then(function (doc) {
				that.globalBusyDialog.close();
				doc.save("ENRE-Potencia-Reactiva.pdf");
			});

			function getReporteDoc(filters, empresa) {
				return new Promise(function (resolve, reject) {
					ReportesService.getEnrePotReactiva(filters).then(function (data) {

						var estaciones = ModelHelper.getModel("EstacionesJsonModel").getProperty("/Estaciones");

						function searchEstacion(code) {
							for (var i = 0; i < estaciones.length; i++) {
								if (code === estaciones[i].Codigo) {
									return estaciones[i].Descripcion;
								}
							}
							return code; //esto no deberia volver 
						}

						var datePattern = sap.ui.core.format.DateFormat.getDateTimeInstance({
							pattern: "dd/MM/yyyy"
						});

						function formatDate(date) {
							if (!date || date.length) return date;
							return datePattern.format(date);
						}

						var timePattern = sap.ui.core.format.DateFormat.getDateTimeInstance({
							pattern: "HH:mm"
						});

						function formatTime(date) {
							if (!date || date.length) return date;
							if (date.ms) {
								return timePattern.format(new Date(date.ms));
							}
							return timePattern.format(date);
						}

						var doc = new jsPDF({
							format: "a3",
							orientation: 'l',
							unit: "mm"
						});

						var imageUrl = that.imageUrl;
						if (that.imageUrl) {
							if (that.society == 100) {
								doc.addImage(imageUrl, 'PNG', 10, 10, 40, 15);
							} else {
								doc.addImage(imageUrl, 'PNG', 10, 10, 50, 13);
							}
						}
						doc.setFontSize(14);
						doc.setFontType("bold");
						doc.text(70, 10, "SISTEMA DE TRANSPORTE DE ENERGIA EN ALTA TENSION");
						doc.setFontSize(22);
						doc.text(70, 18, "EQUIPAMIENTO DE POTENCIA REACTIVA ( " + empresa + " )");
						doc.setFontType("normal");
						doc.setFontSize(8);
						var filtersData = ModelHelper.getModel("InformeFiltersJsonModel").getData();
						var desde = formatDate(filtersData.desde);
						var hasta = formatDate(filtersData.hasta);
						doc.text(70, 24, "Del " + desde + " al " + hasta + "");

						var newData = data.results.map(function (el) {
							el.EstacionDesc = searchEstacion(el.Estacion);
							el.Horaentrada = that.formatTimeRPDF(el.Fecentrasa);
							el.Fecentrasa = that.formatDate(el.Fecentrasa);
							el.Horasalida = that.formatTimeRPDF(el.Fecsalida);
							el.Fecsalida = that.formatDate(el.Fecsalida);
							el.Horainfcammesa = that.formatTimeRPDF(el.Horainfcammesa);

							for (var x in el) {
								if (el[x] === null || el[x] === undefined) {
									el[x] = "";
								}
							}
							//el.EntIndisFormat = formatDate(el.EntIndis);
							//el.EntDispoFormat = formatDate(el.EntDispo);

							el.text = el.Motivo;
							return el;
						});

						var headers = [{
							Orden: "(1)",
							EstacionDesc: "(2)",
							Equipo: "(3)",
							Mvar: "(4)",
							Fecsalida: "(5)",
							Horasalida: "(6)",
							Fecentrasa: "(7)",
							Horaentrada: "(8)",
							Tipoind: "(9)",
							Autorizacammesa: "(10)",
							Horainfcammesa: "(11)",
							text: "(12)",
						}, {
							Orden: "N°\nOrden",
							EstacionDesc: "\nEstacion\nTransformadora",
							Equipo: "Equipo",
							Mvar: "MV Ar.",
							Fecsalida: "Salida Fecha",
							Horasalida: "Salida Hora",
							Fecentrasa: "Entrada Fecha",
							Horaentrada: "Entrada Hora",
							Tipoind: "Tipo\nIndisp.",
							Autorizacammesa: "Autoriz.\nCAMMESA",
							Horainfcammesa: "Hora Inf.\nCAMMESA",
							text: "Motivo de la Insdisponibilidad"
						}];

						var colLongs = [{
							"title": "N°\nOrden",
							"dataKey": "Orden"
						}, {
							"title": "Estacion\nTransformadora",
							"dataKey": "EstacionDesc"
						}, {
							"title": "Equipo",
							"dataKey": "Equipo"
						}, {
							"title": "MV Ar.",
							"dataKey": "Mvar"
						}, {
							"title": "Salida Fecha",
							"dataKey": "Fecsalida"
						}, {
							"title": "Salida Hora",
							"dataKey": "Horasalida"
						}, {
							"title": "Entrada Fecha",
							"dataKey": "Fecentrasa"
						}, {
							"title": "Entrada Hora",
							"dataKey": "Horaentrada"
						}, {
							"title": "Tipo\nIndisp.",
							"dataKey": "Tipoind"
						}, {
							"title": "Autoriz.\nCAMMESA",
							"dataKey": "Autorizacammesa"
						}, {
							"title": "Hora Inf.\nCAMMESA",
							"dataKey": "Horainfcammesa"
						}, {
							"title": "Motivo de la Insdisponibilidad",
							"dataKey": "text"
						}];
						doc.autoTable({
							head: headers,
							columns: colLongs,
							body: newData,
							startY: 25,
							margin: {
								horizontal: 7,
								top: 30,
								bottom: 55
							},
							bodyStyles: {
								valign: 'top'
							},
							styles: {
								overflow: 'linebreak',
								cellWidth: 'wrap',
								tableWidth: 300
							},
							columnStyles: {
								text: {
									cellWidth: 'auto'
								}
							},
							didDrawPage: function (data) {
								// Footer
								doc.setFontSize(10);

								// jsPDF 1.4+ uses getWidth, <1.4 uses .width
								var pageSize = doc.internal.pageSize;
								var pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();

								var text =
									`(1) Número de Orden
(2) Indica Nombre de la ET
(3)Equipamiento Afectado
(4) Tensión de Salida
(5) Día en que la Línea salió de Servicio
(6) Hora en que la Línea salió de Servicio
(7) Día en que la línea entró en Disponibilidad
(7) Hora en que la línea entró en Disponibilidad
(9) Tipo de Indisponibilidad: Forzada(F), Programada(P) o Restringida(R)
(10) Autorizó CAMMESA (Si/No)
(11) Hora en que se informó a CAMMESA.
(12) Motivo de la Indisponibilidad`
								doc.text(text, data.settings.margin.left, pageHeight - 50);
							},
						});
						resolve(doc);
						//doc.save("ENRE-Potencia-Reactiva.pdf");
					});
				});
			}

		},
		reportePDFENRETransformacion: function () {
			var that = this;
			jQuery.sap.registerModulePath("index", "https://unpkg.com/jspdf@1.4.1/dist/");
			jQuery.sap.require({
				modName: "index.jspdf",
				type: "min"
			});
			jQuery.sap.registerModulePath("index", "https://unpkg.com/jspdf-autotable@3.0.4/dist/");
			jQuery.sap.require({
				modName: "index.jspdf",
				type: "plugin.autotable"
			});

			var that = this;
			var aFilters = this.reportesPDFFilters;
			var filtersData = ModelHelper.getModel("InformeFiltersJsonModel").getData();
			if (!filtersData.Empresa) {
				jQuery.sap.registerModulePath("index", "https://unpkg.com/jszip@3.1.5/dist/");
				jQuery.sap.require({
					modName: "index.jszip"
				});

				jQuery.sap.require("transener/registrocronologicoeventos/libs/FileSaver");

				var empresas = ModelHelper.getModel("NSEmpresasSet").getData().Empresas;

				function reflect(promise) {
					return promise.then(function (res) {
						return {
							res: res,
							status: "resolved"
						}
					},
						function (err) {
							return {
								err: err,
								status: "rejected"
							}
						});
				}

				var promises = [];
				this.globalBusyDialog.open();
				for (var i = 0; i < empresas.length; i++) {
					var currFilters = aFilters.slice();
					currFilters.push(new sap.ui.model.Filter({
						path: "Empresa",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: empresas[i].CodEmpresa
					}));
					promises.push(getReporteDoc(currFilters, empresas[i].Descripcion));
				}

				Promise.all(promises.map(reflect)).then(function (results) {
					var zip = new JSZip();
					for (var i = 0; i < results.length; i++) {
						var doc = results[i].res;
						var pdfData = doc.output("blob");
						zip.file(`ENRE-Transformacion-${empresas[i].CodEmpresa}.pdf`, pdfData, {
							base64: true
						});
					}
					zip.generateAsync({
						type: "blob"
					})
						.then(function (content) {
							// see FileSaver.js
							that.globalBusyDialog.close();
							saveAs(content, "ENRE-Transformacion.zip");
						});
				});

				return;
			}
			this.globalBusyDialog.open();
			getReporteDoc(aFilters, that.getFilterEmpresa()).then(function (doc) {
				that.globalBusyDialog.close();
				doc.save("ENRE-Transformacion.pdf");
			});

			function getReporteDoc(filters, empresa) {
				return new Promise(function (resolve, reject) {
					ReportesService.getEnreTransformaciones(filters).then(function (data) {

						var estaciones = ModelHelper.getModel("EstacionesJsonModel").getProperty("/Estaciones");

						function searchEstacion(code) {
							for (var i = 0; i < estaciones.length; i++) {
								if (code === estaciones[i].Codigo) {
									return estaciones[i].Descripcion;
								}
							}
							return code; //esto no deberia volver 
						}

						var datePattern = sap.ui.core.format.DateFormat.getDateTimeInstance({
							pattern: "dd/MM/yyyy HH:mm"
						});

						function formatDate(date) {
							if (!date || date.length) return date;
							return datePattern.format(date);
						}

						var timePattern = sap.ui.core.format.DateFormat.getDateTimeInstance({
							pattern: "HH:mm"
						});

						function formatTime(date) {
							if (!date || date.length) return date;
							return timePattern.format(date);
						}

						var doc = new jsPDF({
							format: "a3",
							orientation: 'l',
							unit: "mm"
						});

						var imageUrl = that.imageUrl;
						if (that.imageUrl) {
							if (that.society == 100) {
								doc.addImage(imageUrl, 'PNG', 10, 10, 40, 15);
							} else {
								doc.addImage(imageUrl, 'PNG', 10, 10, 50, 13);
							}
						}
						doc.setFontSize(14);
						doc.setFontType("bold");
						doc.text(70, 10, "SISTEMA DE TRANSPORTE DE ENERGIA EN ALTA TENSION");
						doc.setFontSize(22);
						doc.text(70, 18, "CARGOS POR CONEXION - TRANSFORMACION ( " + empresa + " )");
						doc.setFontType("normal");
						doc.setFontSize(8);
						var filtersData = ModelHelper.getModel("InformeFiltersJsonModel").getData();
						var desde = formatDate(filtersData.desde);
						var hasta = formatDate(filtersData.hasta);
						doc.text(70, 24, "Del " + desde + " al " + hasta + "");

						var newData = data.results.map(function (el) {
							el.EstacionDesc = searchEstacion(el.Estacion);
							el.Horaentrada = that.formatTimeRPDF(el.Fecentrasa);
							el.Fecentrasa = that.formatDate(el.Fecentrasa);
							el.Horasalida = that.formatTimeRPDF(el.Fecsalida);
							el.Fecsalida = that.formatDate(el.Fecsalida);
							el.Horainfcammesa = that.formatTimeRPDF(el.Horainfcammesa);

							for (var x in el) {
								if (el[x] === null || el[x] === undefined) {
									el[x] = "";
								}
							}
							//el.EntIndisFormat = formatDate(el.EntIndis);
							//el.EntDispoFormat = formatDate(el.EntDispo);

							//var informeCammesa = el.InformeCammesaSet[0];
							//el.Autcammesa = el.Autcammesa ? "S" : "N";
							el.text = el.Motivo;
							return el;
						});

						var headers = [{
							Orden: "(1)",
							EstacionDesc: "(2)",
							Equipo: "(3)",
							Potmva: "(4)",
							Kv: "(5)",
							Fecsalida: "(6)",
							Horasalida: "(7)",
							Fecentrasa: "(8)",
							Horaentrada: "(9)",
							Tipoind: "(10)",
							Autoriza: "(11)",
							Res: "(12)",
							Ens: "(13)",
							Horainfcammesa: "(14)",
							text: "(15)"
						}, {
							Orden: "N°\nOrden",
							EstacionDesc: "\nEstacion\nTransformadora",
							Equipo: "Equipo",
							Potmva: "POT\nMVA",
							Kv: "KV",
							Fecsalida: "Salida Fecha",
							Horasalida: "Salida Hora",
							Fecentrasa: "Entrada Fecha",
							Horaentrada: "Entrada Hora",
							Tipoind: "Tipo\nIndisp.",
							Autoriza: "Autoriz.\nCAMMESA",
							Res: "Rest%",
							Ens: "ENS",
							Horainfcammesa: "Hora Inf.\nCAMMESA",
							text: "Motivo de la Insdisponibilidad"
						}];

						var colLongs = [{
							"title": "N°\nOrden",
							"dataKey": "Orden"
						}, {
							"title": "Estacion\nTransformadora",
							"dataKey": "EstacionDesc"
						}, {
							"title": "Equipo",
							"dataKey": "Equipo"
						}, {
							"title": "POT\nMVA",
							"dataKey": "Potmva"
						}, {
							"title": "KV",
							"dataKey": "Kv"
						}, {
							"title": "Salida\nFecha",
							"dataKey": "Fecsalida"
						}, {
							"title": "Salida\nHora",
							"dataKey": "Horasalida"
						}, {
							"title": "Entrada\nFecha",
							"dataKey": "Fecentrasa"
						}, {
							"title": "Entrada\nHora",
							"dataKey": "Horaentrada"
						}, {
							"title": "Tipo\nIndisp.",
							"dataKey": "Tipoind"
						}, {
							"title": "Autoriz.\nCAMMESA",
							"dataKey": "Autoriza"
						}, {
							"title": "rest%",
							"dataKey": "Res"
						}, {
							"title": "ENS",
							"dataKey": "Ens"
						}, {
							"title": "Hora Inf.\nCAMMESA",
							"dataKey": "Horainfcammesa"
						}, {
							"title": "Motivo de la Insdisponibilidad",
							"dataKey": "text"
						}];
						doc.autoTable({
							head: headers,
							columns: colLongs,
							body: newData,
							startY: 25,
							margin: {
								horizontal: 7,
								top: 30,
								bottom: 55
							},
							bodyStyles: {
								valign: 'top'
							},
							styles: {
								overflow: 'linebreak',
								cellWidth: 'wrap',
								tableWidth: 300
							},
							columnStyles: {
								text: {
									cellWidth: 'auto'
								}
							},
							didDrawPage: function (data) {
								// Footer
								doc.setFontSize(10);

								// jsPDF 1.4+ uses getWidth, <1.4 uses .width
								var pageSize = doc.internal.pageSize;
								var pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();

								var text =
									`(1) Número de Orden
(2) Indica Nombre de la ET
(3) Equipamiento Afectado.
(4) Potencia del Transformador.
(5) Tensión de Servicio (Prim.-Secund.-Terc.)
(6) Día en que la Línea salió de Servicio
(7) Hora en que la Línea salió de Servicio
(8) Día en que la línea entró en Disponibilidad
(9) Hora en que la línea entró en Disponibilidad
(10) Tipo de Indisponibilidad: Forzada(F), Programada(P) o Restringida(R)
(11) Autorizó CAMMESA (Si/No)
(12) Factor de Reducción, si lo hubo, en por ciento (FR)
(13) Se produjo Energía no Suministrada(Si/No)
(14) Hora en que se informó a CAMMESA.
(15) Motivo de la Indisponibilidad`;
								doc.text(text, data.settings.margin.left, pageHeight - 50);
							},
						});
						resolve(doc);
						//doc.save("ENRE-Transformacion.pdf");
					});
				})
			}

		},
		reporteDBF: function () {
			var Reporte = "";
			this.loadNSEmpresas(this.society, Reporte);
			var that = this;
			var model = ModelHelper.getModel("InformeFiltersJsonModel");
			model.setData({});

			function exportData(isExcel) {
				//jQuery.sap.registerModulePath("index", "https://unpkg.com/dbf@latest/");
				//jQuery.sap.require("index.dbf");
				jQuery.sap.require("transener/registrocronologicoeventos/libs/dbf");
				var filters = [];
				var filtersData = ModelHelper.getModel("InformeFiltersJsonModel").getData();

				//TODO remove
				//filtersData.Empresa = "1";

				/*	if (filtersData.Empresa) {
						filters.push(new sap.ui.model.Filter({
							path: "Empresa",
							operator: sap.ui.model.FilterOperator.EQ,
							value1: filtersData.Empresa || ""
						}));
					}*/
				filters.push(new sap.ui.model.Filter({
					path: "Empresa",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: filtersData.Empresa || ""
				}));

				filters.push(new sap.ui.model.Filter({
					path: "Sociedad",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: that.society
				}));

				if (!(filtersData.desde && filtersData.hasta)) {
					sap.m.MessageBox.alert("Debe seleccionar fecha desde y fecha hasta", {
						title: "Filtros reporte"
					});
					return;
				}
				filtersData.hasta.setHours(23, 59, 59, 999);

				filters.push(new sap.ui.model.Filter("InicioNove", sap.ui.model.FilterOperator.BT, filtersData.desde, filtersData.hasta));

				function saveByteArray(reportName, byte) {
					var blob = new Blob([byte], {
						type: "application/pdf"
					});
					var link = document.createElement('a');
					link.href = window.URL.createObjectURL(blob);
					var fileName = reportName;
					link.download = fileName;
					link.click();
				}

				function insert(str, index, value) {
					return str.substr(0, index) + value + str.substr(index);
				}
				that.globalBusyDialog.open();
				ReportesService.getInformeCammesa(filters).then(
					function (data) {
						data = data.map(function (el) {
							delete el.__metadata;
							delete el.Empresa;
							delete el.InicioNove;
							delete el.Sociedad;
							if (el.Fsal === "00000000") {
								el.Fsal = "";
								el.Hsal = "";
								el.Msal = "";
							} else {
								el.Fsal = insert(el.Fsal, 6, "/");
								el.Fsal = insert(el.Fsal, 4, "/");
								el.Fsal = el.Fsal.split("/").reverse().join("/");
							}

							if (el.Fent === "00000000") {
								el.Fent = "";
								el.Hent = "";
								el.Ment = "";
							} else {
								el.Fent = insert(el.Fent, 6, "/");
								el.Fent = insert(el.Fent, 4, "/");
								el.Fent = el.Fent.split("/").reverse().join("/");
							}

							if (el.Finf === "00000000") {
								el.Finf = "";
								el.Hinf = "";
								el.Minf = "";
							} else {
								el.Finf = insert(el.Finf, 6, "/");
								el.Finf = insert(el.Finf, 4, "/");
								el.Finf = el.Finf.split("/").reverse().join("/");
							}

							return el;
						});
						var buf = dbf.structure(data);
						var empresaCode = that.society == 100 ? "TR" : "TB";
						if (isExcel) {

							make_xlsx_lib(XLSX);

							var Sheet = XLSX.utils.json_to_sheet(data);
							var Workbook = XLSX.utils.book_new();
							XLSX.utils.book_append_sheet(Workbook, Sheet, "SheetJS");
							that.globalBusyDialog.close();
							return XLSX.writeFile(Workbook, "Informe a Cammesa XLS_" + empresaCode + ".xlsx", {
								cellStyles: true
							});

						} else {
							saveByteArray("Informe a Cammesa DBF_" + empresaCode + ".dbf", buf.buffer);
							that.globalBusyDialog.close();
						}
					}
				);
			}
			this.dialogReporteDBF = new sap.m.Dialog({
				type: sap.m.DialogType.Message,
				title: "Informe a CAMMESA",
				escapeHandler: function (oPromise) {
					oPromise.reject();
				},
				content: [
					new sap.m.VBox({
						items: [
							new sap.m.HBox({
								alignItems: "Center",
								items: [
									new sap.m.Label({
										text: "Empresa",
										width: "100px"
									}).addStyleClass("CustomLabel"),
									new sap.m.ComboBox({
										selectedKey: "{InformeFiltersJsonModel>/Empresa}",
										items: {
											path: "NSEmpresasSet>/Empresas",
											template: new sap.ui.core.Item({
												key: "{NSEmpresasSet>CodEmpresa}",
												text: "{NSEmpresasSet>CodEmpresa}"
											})
										},
										layoutData: new sap.m.FlexItemData({
											growFactor: 1
										}),
										width: "120px"
									}),
									new sap.m.ComboBox({
										selectedKey: "{InformeFiltersJsonModel>/Empresa}",
										items: {
											path: "NSEmpresasSet>/Empresas",
											template: new sap.ui.core.Item({
												key: "{NSEmpresasSet>CodEmpresa}",
												text: "{NSEmpresasSet>Descripcion}"
											})
										},
										layoutData: new sap.m.FlexItemData({
											growFactor: 6
										}),
										width: "100%"
									})
								]
							}),
							new sap.m.HBox({
								alignItems: "Center",
								items: [
									new sap.m.HBox({

										items: [
											new sap.m.Label({
												text: "Desde",
												width: "100px"
											}).addStyleClass("CustomLabel"),
											new sap.m.DatePicker({
												dateValue: "{InformeFiltersJsonModel>/desde}",
											})
										]
									}),
									new sap.m.HBox({
										items: [
											new sap.m.Label({
												text: "Hasta",
												width: "100px"
											}).addStyleClass("CustomLabel"),
											new sap.m.DatePicker({
												dateValue: "{InformeFiltersJsonModel>/hasta}",
											})
										]
									})
								]
							})
						]
					})
				],
				buttons: [
					new sap.m.Button({
						//icon: "sap-icon://save",
						type: sap.m.ButtonType.Emphasized,
						text: "Exportar Excel",
						press: [function () {
							exportData(true);
							//this.dialogReporteDBF.close();
						}, this]
					}),
					new sap.m.Button({
						//icon: "sap-icon://save",
						type: sap.m.ButtonType.Emphasized,
						text: "Exportar",
						press: [function () {
							exportData();
							//this.dialogReporteDBF.close();
						}, this]
					}),
					new sap.m.Button({
						//icon: "sap-icon://save",
						type: sap.m.ButtonType.Emphasized,
						text: "Cerrar",
						press: [function () {
							this.dialogReporteDBF.close();
						}, this]
					})
				]
			}),

				this.getView().addDependent(this.dialogReporteDBF);

			this.dialogReporteDBF.open();
		},
		dialogPenalidadesFilter: function () {
			var that = this;
			var model = ModelHelper.getModel("InformeFiltersJsonModel");
			model.setData({});
			this.dialogReportePenalidades = new sap.m.Dialog({
				type: sap.m.DialogType.Message,
				title: "Reporte de Penalizaciones",
				escapeHandler: function (oPromise) {
					oPromise.reject();
				},
				content: [
					new sap.m.VBox({
						items: [
							new sap.m.HBox({
								items: [
									new sap.m.HBox({
										items: [
											new sap.m.Label({
												text: "Desde",
												width: "100px"
											}).addStyleClass("CustomLabel"),
											new sap.m.DatePicker({
												dateValue: "{InformeFiltersJsonModel>/desde}",
											})
										]
									}),
									new sap.m.HBox({
										items: [
											new sap.m.Label({
												text: "Hasta",
												width: "100px"
											}).addStyleClass("CustomLabel"),
											new sap.m.DatePicker({
												dateValue: "{InformeFiltersJsonModel>/hasta}",
											})
										]
									})
								]
							})
						]
					})
				],
				buttons: [
					new sap.m.Button({
						//icon: "sap-icon://save",
						type: sap.m.ButtonType.Emphasized,
						text: "Exportar",
						press: [function () {
							//jQuery.sap.registerModulePath("index", "https://unpkg.com/dbf@latest/");
							//jQuery.sap.require("index.dbf");
							jQuery.sap.require("transener/registrocronologicoeventos/libs/dbf");
							var filters = [];
							var filtersData = ModelHelper.getModel("InformeFiltersJsonModel").getData();

							filters.push(new sap.ui.model.Filter({
								path: "Empresa",
								operator: sap.ui.model.FilterOperator.EQ,
								value1: this.society
							}));

							if (!(filtersData.desde && filtersData.hasta)) {
								sap.m.MessageBox.alert("Debe seleccionar fecha desde y fecha hasta", {
									title: "Filtros reporte"
								});
								return;
							}
							filtersData.hasta.setHours(23, 59, 59, 999);

							filters.push(new sap.ui.model.Filter("Fs", sap.ui.model.FilterOperator.BT, filtersData.desde, filtersData.hasta));
							this.reportePenalidades(filters);
							this.dialogReportePenalidades.close();
						}, this]
					}),
					new sap.m.Button({
						//icon: "sap-icon://save",
						type: sap.m.ButtonType.Emphasized,
						text: "Cancelar",
						press: [function () {
							this.dialogReportePenalidades.close();
						}, this]
					})
				]
			});

			this.getView().addDependent(this.dialogReportePenalidades);

			this.dialogReportePenalidades.open();
		},
		reportePenalidades: function (filters) {
			var that = this;
			var titles = ["Lineas", "Transformadores", "Equipos Reactivos", "Conexiones"];

			var headers = [];
			//lineas

			headers.push(["N° Novedad", "Nombre", "Tension", "KM", "Cat", "FS", "ES", "TipoSal", "Rest", "RD", "Autorizada", "Observaciones",
				"Terceros", "NEMO", "Region"
			]);
			//transformadores
			headers.push(["N° Novedad", "Estacion", "Equipo", "Mva", "Tension", "Fs", "Es", "Tiposal", "Rest", "Ens", "Autorizada",
				"Observaciones",
				"Terceros", "NEMO", "Region"
			]);
			//equiposReactivos
			headers.push(["N° Novedad", "Estacion", "Equipo", "Mvar", "--", "Fs", "Es", "Tiposal", "Rest", "--", "Autorizada",
				"Observaciones",
				"Terceros", "NEMO", "Region"
			]);
			//conexiones
			headers.push(["N° Novedad", "Estacion", "Equipo", "Tension", "--", "Fs", "Es", "Tiposal", "--", "--", "Autorizada",
				"Observaciones",
				"Terceros", "NEMO", "Region", "Descripcion"
			]);

			var allProperties = [];
			//lineas
			allProperties.push(["Idnovedad", "Nombre", "Tension", "Km", "Cat", {
				path: "Fs",
				formatter: this.formatDateTime
			}, {
					path: "Es",
					formatter: this.formatDateTime
				},
				"TipoSalida", "Rest", "RD", "Autorizada", "Observaciones", "Terceros", "Nemo", "Region"
			]);
			//transformadores
			allProperties.push(["Idnovedad", "Estacion", "Equipo", "Mva", "Tension", {
				path: "Fs",
				formatter: this.formatDateTime
			}, {
					path: "Es",
					formatter: this.formatDateTime
				},
				"Tiposal", "Rest", "Ens", "Autorizada", "Observaciones", "Terceros", "Nemo", "Region"
			]);

			//equiposReactivos
			allProperties.push(["Idnovedad", "Estacion", "Equipo", "Mvar", "vacio", {
				path: "Fs",
				formatter: this.formatDateTime
			}, {
					path: "Es",
					formatter: this.formatDateTime
				},
				"Tiposal", "Rest", "vacio", "Autorizada", "Observaciones", "Terceros", "Nemo", "Region"
			]);
			//conexiones
			allProperties.push(["Idnovedad", "Estacion", "Equipo", "Tension", "vacio", {
				path: "Fs",
				formatter: this.formatDateTime
			}, {
					path: "Es",
					formatter: this.formatDateTime
				},
				"Tiposal", "vacio", "vacio", "Autorizada", "Observaciones", "Terceros", "Nemo", "Region", "Descripcion"
			]);
			/*oModeld.read("/EmpresaUsuarioSet";*/
			var service = oDataService.getModel("");
			this.globalBusyDialog.open();
			var lineaPromise = new Promise(function (resolve, reject) {
				service.read("/InfPnlzLineasSet", {
					filters: filters,
					success: resolve,
					error: reject
				});
			});

			var transformadoresPromise = new Promise(function (resolve, reject) {
				service.read("/InfPnlzTransformadoresSet", {
					filters: filters,
					success: resolve,
					error: reject
				});
			});

			var equiposReactivosPromise = new Promise(function (resolve, reject) {
				service.read("/InfPnlzEqReactivosSet", {
					filters: filters,
					success: resolve,
					error: reject
				});
			});

			var conexionesPromise = new Promise(function (resolve, reject) {
				service.read("/InfPnlzConexionesSet", {
					filters: filters,
					success: resolve,
					error: reject
				});
			});

			var premises = [lineaPromise, transformadoresPromise, equiposReactivosPromise, conexionesPromise];

			Promise.all(premises).then(function (responses) {
				responses = responses.map(function (el) {
					return el.results;
				});
				var csv = [];
				for (var i = 0; i < responses.length; i++) {
					csv.push(titles[i]);
					var response = responses[i];
					var header = headers[i];
					var properties = allProperties[i];
					var headerRow = [];
					for (var j = 0; j < header.length; j++) {
						headerRow.push(header[j]);
					}
					csv.push(headerRow.join(";"));

					for (j = 0; j < response.length; j++) {
						var dataRow = response[j];
						var row = [];
						for (var k = 0; k < properties.length; k++) {
							var property = properties[k];
							if (typeof property === 'object') {
								var value = dataRow[property.path];
								//this only accepts values, except the property name
								//the property name is the first value sent to the formatter
								if (property.formatter) {
									if (property.extraParams) {
										var args = [value].concat(property.extraParams);
										value = property.formatter.apply(this, args);
									} else {
										value = property.formatter(value);
									}
								}
								if (value === null || value === undefined) {
									value = "";
								}
								row.push("\"" + value + "\"");
							} else {
								var value = dataRow[property];
								if (value === null || value === undefined) {
									value = "";
								}
								row.push("\"" + value + "\"");
							}
						}
						csv.push(row.join(";"));
					}
					csv.push("");
				}
				var string = csv.join("\n");

				var blob = new Blob(['\ufeff' + string], {
					type: 'text/csv;charset=utf-8;'
				});
				if (navigator.msSaveBlob) { // IE 10+
					navigator.msSaveBlob(blob, "Reporte Penalidades.xls");
					that.globalBusyDialog.close();
				} else {
					var link = document.createElement("a");
					var url = URL.createObjectURL(blob);
					var isSafari = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1;
					if (isSafari) //if Safari open in new window to save file with random filename.
						link.setAttribute("target", "_blank");
					link.setAttribute("href", url);
					link.setAttribute("download", "Penalizaciones.xls");
					link.style = "visibility:hidden";
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					that.globalBusyDialog.close();
				}
			});

		},
		getFilterEmpresa: function () {
			var empresas = ModelHelper.getModel("NSEmpresasSet").getData().Empresas;
			var CodEmpresa = ModelHelper.getModel("InformeFiltersJsonModel").getData().Empresa;
			if (!CodEmpresa) return "";
			var found = empresas.find(function (el) {
				return el.CodEmpresa == CodEmpresa;
			});
			if (!found) {
				return "";
			}
			return found.Descripcion;
		},
		onExport: function () {
			make_xlsx_lib(XLSX);
			var oTable1 = this.byId("generalTable"); // ID de la primera tabla
			var oTable2 = this.byId("tableNovedades"); // ID de la segunda tabla
			var oTable3 = this.byId("tablePerturbaciones"); // ID de la tercera tabla
			var oTable4 = this.byId("tableProgramadas"); // ID de la cuarta tabla

			var aData1 = oTable1.getBinding("rows").getContexts().map(function (oContext) {
				return oContext.getObject();
			});

			var aData2 = oTable2.getBinding("rows").getContexts().map(function (oContext) {
				return oContext.getObject();
			});

			var aData3 = oTable3.getBinding("rows").getContexts().map(function (oContext) {
				return oContext.getObject();
			});

			var aData4 = oTable4.getBinding("rows").getContexts().map(function (oContext) {
				return oContext.getObject();
			});

			var wb = XLSX.utils.book_new();

			var ws1 = XLSX.utils.json_to_sheet(aData1);
			var ws2 = XLSX.utils.json_to_sheet(aData2);
			var ws3 = XLSX.utils.json_to_sheet(aData3);
			var ws4 = XLSX.utils.json_to_sheet(aData4);

			XLSX.utils.book_append_sheet(wb, ws1, "General");
			XLSX.utils.book_append_sheet(wb, ws2, "Novedades");
			XLSX.utils.book_append_sheet(wb, ws3, "Perturbaciones");
			XLSX.utils.book_append_sheet(wb, ws4, "Programadas");

			XLSX.writeFile(wb, "ReporteGeneral.xlsx");

		},
		formatTipoEquipo: function (tipoEq) {
			if (!tipoEq) return "";
			var allTypes = ModelHelper.getModel("TipoEquipoJsonModel").getData().TipoEquipo;
			var ret = allTypes.find(function (el) {
				return el.Tipo == tipoEq;
			});
			return ret ? ret.Descripcion : "";
		},

		formatDispAct: function (dispAct) {
			if (!dispAct) return "";
			var allDisps = ModelHelper.getModel("DispActuantesJsonModel").getData();
			var ret = allDisps.find(function (el) {
				return el.Valkey == dispAct;
			});
			return ret ? ret.Valtext : "";
		},

		formatEstadoTiempo: function (estadoTiempo) {
			if (!estadoTiempo) return "";
			var allEstados = ModelHelper.getModel("EstadoTiempoJsonModel").getData();
			var ret = allEstados.find(function (el) {
				return el.Valkey == estadoTiempo;
			});
			return ret ? ret.Valtext : "";
		},

		formatCausa: function (causa) {
			if (!causa) return "";
			var allCausas = ModelHelper.getModel("AllCausasJsonModel").getData().Causas;
			var ret = allCausas.find(function (el) {
				return el.CodigoCausa == causa;
			});
			return ret ? ret.DescCausa : "";
		},
		formatTimeRPDF: function (date) {
			var timePattern = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "HH:mm"
			});

			if (!date || date.length) return date;
			if (date.ms || date.ms === 0) {
				return timePattern.format(new Date(date.ms + new Date().getTimezoneOffset() * 60 * 1000));
			}
			return timePattern.format(date);
		},

		formatDateTime: function (date) {
			var pattern = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "dd/MM/yyyy HH:mm"
			});

			if (!date || date.length) return date;
			if (date.ms || date.ms === 0) {
				return pattern.format(new Date(date.ms));
			}
			return pattern.format(date);
		},
		handleTableChanges: function (oEvent) {
			const oSrc = oEvent.getSource();

			// 1) Buscar la tabla
			let oTable = oSrc;
			while (oTable && oTable.getMetadata().getName() !== "sap.ui.table.Table") {
				oTable = oTable.getParent();
			}
			if (!oTable) return;

			// 2) Tomar el nombre del modelo desde el binding de rows
			const oInfo = oTable.getBindingInfo("rows");
			const sModelName = oInfo && oInfo.model; // "oTProgramadasModel" o "oPerturbacionesModel"
			if (!sModelName) return;

			// 3) Obtener el contexto usando el modelo correcto
			const oCtx = oSrc.getBindingContext(sModelName);
			if (!oCtx) return;

			// 4) Índice absoluto desde el path: "/data/12" -> 12
			const sPath = oCtx.getPath();
			const iAbsIndex = parseInt(sPath.split("/").pop(), 10);
			if (isNaN(iAbsIndex)) return;

			// 5) Convertir a índice visible (tabla virtualizada)
			const iVisibleIndex = iAbsIndex - oTable.getFirstVisibleRow();
			const oRow = oTable.getRows()[iVisibleIndex];
			if (!oRow) return;

			// 6) Habilitar botón Save (2do botón del HBox de la última columna)
			const aCells = oRow.getCells();
			const oLastCell = aCells[aCells.length - 1];
			const aItems = oLastCell?.getItems?.() || [];
			aItems[1]?.setEnabled(true);

			this.byId("saveTableChanges")?.setVisible(true);
		},

		onSaveTableChange: function () {
			// Capturar el IconTabBar activo
			var oIconTabBar = this.byId("idIconTabBarNoIcons"); // Reemplazar con el id de tu IconTabBar
			var sSelectedKey = oIconTabBar.getSelectedKey(); // El key de la pestaña activa

			// Asignar el id de la tabla dependiendo de la pestaña activa
			var sTableId;
			var sModel;
			switch (sSelectedKey) {
				case "General":
					sTableId = "generalTable";
					sModel = "filtered"
					break;
				case "Novedades":
					sTableId = "tableNovedades";
					sModel = "oNovedadesModel"
					break;
				case "Perturbaciones":
					sTableId = "tablePerturbaciones";
					sModel = "oPerturbacionesModel"
					break;
				case "TrabajosProgramados":
					sTableId = "tableProgramadas";
					sModel = "oTProgramadasModel"
					break;
				default:
					sap.m.MessageToast.show("No se ha seleccionado una pestaña válida");
					return;
			}

			// Obtener la tabla
			var oTable = this.byId(sTableId);
			if (!oTable) {
				sap.m.MessageToast.show("Tabla no encontrada");
				return;
			}

			// Obtener el modelo y los datos
			var oModel = oTable.getModel(sModel);
			var sPath = oTable.getBinding("rows").getPath(); // Obtener el camino de los datos

			var oRow = oTable.getRows()

			oRow.forEach(function (row, index) {
				if (sTableId === "generalTable") {
					row.getCells()[6].getItems()[1].setEnabled(false)
				} else {
					row.getCells()[7].getItems()[1].setEnabled(false)
				}
			});
			// Actualizar el modelo con los cambios

			// Mostrar un mensaje de éxito
			sap.m.MessageToast.show("Todas las filas se han actualizado correctamente");

		},

		onNovedadSelected: function (oEvent) {
			var empresa = "100";

			var oMappingTRA = {
				PantallaGeneral: ["AUTR", "NAUT", "ADAP", "NADA", "DFOR", "FORZ", "DISP", "INDI", "ENER", "ESPO", "FINA", "INIC", "HABI", "INHI", "INFO", "REAN", "RMON", "RTRI", "SUSP", "CREC", "SREC", "AUTO", "MANU", "R495", "R500", "R5005", "SOLI", "SULI"],
				Alarma: ["ALAR", "RTNA"],
				CargaDeEquipos: ["VANO", "INTF", "CNOM", "NRLI", "SULI", "CMAX", "SNOR"],
				VinculadoSinTension: ["otro1", "otro2"],
				EnBandaFueraDeBanda: ["EBAN", "FBAN"],
				IndisponibilidadesSubindice: ["otro1", "otro2"],
				ManiobrasOperativas1: ["DESC", "DENE", "ESER", "FSER", "FSPO", "ABTR", "CBAR", "AACO", "ESSP", "AINT", "CNOR", "AACO"],
				ManiobrasOperativas2: ["otro1", "otro2"],
				ManiobrasOperativas3: ["otro1", "otro2"]
			};

			var oMappingTBA = {
				PantallaGeneral: ["DI", "IN", "HABI", "INHI", "COM", "RH", "RA", "APADECSUB", "ACT SUB V", "GUI", "MIN FREC", "NGUI", "NFORM", "PT", "RESTR", "RSSP"],
				Alarma: ["ALARMA", "FT", "FTP", "IFUIM", "NT", "RTNA"],
				CargaDeEquipos: ["INTF", "CNOM", "NRESTR"],
				VinculadoSinTension: ["otro1", "otro2"],
				EnBandaFueraDeBanda: ["EB", "FB"],
				IndisponibilidadesSubindice: ["otro1", "otro2"],
				ManiobrasOperativas1: ["CR", "DF", "DG", "EP", "FP", "PFIH", "PFII", "SOLGEN", "SPG", "SSG", "TORET", "TORS", "TORT", "U10%", "U5%", "UNORM"],
				ManiobrasOperativas2: ["otro1", "otro2"],
				ManiobrasOperativas3: ["otro1", "otro2"]
			};

			// Determinar qué mapeo usar
			var oMapping = empresa === "100" ? oMappingTRA : oMappingTBA;

			var sSelectedKey = oEvent.getSource().getSelectedKey();
			var sFragmentName = null;

			// Buscar la categoría correspondiente en el mapeo seleccionado
			Object.keys(oMapping).forEach(function (sCategory) {
				if (oMapping[sCategory].includes(sSelectedKey)) {
					sFragmentName = sCategory;
				}
			});

			if (!sFragmentName) {
				MessageToast.show("No existe un fragmento para la opción seleccionada.");
				return;
			}

			var sFragmentPath = "transener.registrocronologicoeventos.fragments.novedades." + sFragmentName;



			// Cargar el fragmento dinámicamente
			this.openDialog(sFragmentPath)
		},

		onOpenDialogNovedades: function () {
			// Crear el diálogo si no existe
			if (!this._oDialog) {
				// Crear VBox para los fragments
				this._oVBoxFormNovedades = new VBox("formNovedadesContainer");
				this._oVBoxNewFragment = new VBox("newFragmentContainer");

				// Crear el Dialog
				this._oDialog = new Dialog({
					title: "Novedades",
					content: [this._oVBoxFormNovedades, this._oVBoxNewFragment],

					beginButton: new sap.m.Button({
						text: "Guardar",
						press: function () {
							this.onSaveNovedad();
						}.bind(this),
					}),
					endButton: new sap.m.Button({
						text: "Cerrar",
						press: function () {
							this._oDialog.close();
						}.bind(this),
					}),

					afterClose: function () {
						this._oDialog.destroy();
						this._oDialog = null;
					}.bind(this),
				});

				// Cargar el fragmento formNovedades y añadirlo al VBox
				Fragment.load({
					id: this.getView().getId() + "-formNovedades",
					name: "transener.registrocronologicoeventos.fragments.forms.formNovedades",
					controller: this,
				})
					.then(function (oFragment) {
						// Añadir fragmento a la VBox
						this._oVBoxFormNovedades.addItem(oFragment);

						// Abrir el dialog solo cuando el fragmento haya sido cargado
						this._oDialog.open();
					}.bind(this))
					.catch(function (oError) {
						MessageToast.show("Failed to load formNovedades fragment: " + oError);
					});
			} else {
				// Si el diálogo ya fue creado, simplemente ábrelo
				this._oDialog.open();
			}
		},
		// ======================================
		// Helper: aplica lógica específica de Perturbaciones
		// ======================================
		_applyPerturbacionesFlags: function (oSelectedData) {
			const oFormModel = ModelHelper.getModel("formPerturbacionesModel");
			const formPerturbaciones = oFormModel.getData() || {};

			// (opcional) limpiar flags antes de setear para evitar "arrastres"
			formPerturbaciones.chkRecDeseng = false;
			formPerturbaciones.chkRecierre = false;
			formPerturbaciones.chkDeseng = false;
			formPerturbaciones.chkEmergencia = false;

			if (oSelectedData.CodNovedad === "P" && oSelectedData.Recierre && oSelectedData.GenIndisponibilidad) {
				formPerturbaciones.chkRecDeseng = true;
			} else if (oSelectedData.CodNovedad === "P" && oSelectedData.Recierre) {
				formPerturbaciones.chkRecierre = true;
			} else if (oSelectedData.CodNovedad === "P" && oSelectedData.GenIndisponibilidad) {
				formPerturbaciones.chkDeseng = true;
			} else if (oSelectedData.CodNovedad === "D" && oSelectedData.GenIndisponibilidad && oSelectedData.Forzada) {
				formPerturbaciones.chkEmergencia = true;
			}

			// importante: volver a setear o refresh si tu binding no se entera
			oFormModel.setData(formPerturbaciones);
		},
		onSearchNovedad: function (oEvent) {
			const oSrc = oEvent.getSource();

			// si viene desde un botón dentro de la fila
			const oCtx =
				oSrc.getBindingContext("oPerturbacionesModel") ||
				oSrc.getBindingContext("oTProgramadasModel");

			if (!oCtx) {
				MessageBox.alert( "No se encontró la fila (bindingContext).");
				return;
			}

			const oRow = oCtx.getObject() || {};
			const sIdNovedad = oRow.IdNovedad; // <- el que querés

			if (!sIdNovedad) {
				MessageBox.alert( "La fila no tiene IdNovedad.");
				return;
			}

			// si querés seguir con tu lógica de padding
			let strId = String(sIdNovedad);
			while (strId.length < 10) strId = "0" + strId;

			NovedadesService.blockNovedad(strId).then((res) => {
				if (res.Usuario) {
					MessageBox.alert( "La novedad se encuentra bloqueada por: " + res.Usuario);
					return;
				}
				this.onSearchNovedadUnblocked(strId);
			}).catch(() => {
				MessageBox.alert( "Ha fallado la búsqueda de la novedad: " + strId);
			});
		},


		onSearchNovedadUnblocked: function (strId) {
			var Empresa = ModelHelper.getModel("Empresa", this.getView()).getProperty("/selectedSociety");

			var data = {
				NroNovedad: strId,
				Empresa: Empresa
			}
			if (!data.NroNovedad) {
				MessageBox.alert("Novedad de Servicio", "Debe indicar un número de novedad.")
				return;
			}
			NovedadesService.SearchNovedad(data,
				jQuery.proxy(this.onSuccessLoadCallback, this),
				jQuery.proxy(this.onErrorLoadCallback, this)
			)
		},
		onSuccessLoadCallback: function (oSelectedNovedad) {
			if (!oSelectedNovedad.IdNovedad) {
				MessageBox.alert("Novedad de Servicio", "Esta novedad no existe.");
				return;
			}

			if (oSelectedNovedad.Consecuente !== "") {
				MessageBox.alert("Novedad de Servicio", "Esta novedad de servicio es consecuente de la Novedad Nro.: " +
					oSelectedNovedad.Consecuente);
			} else {
				// var oUtilsJsonModel = this.getView().getModel("UtilsJsonModel");
				// var codNovedad = oSelectedNovedad.CodNovedad;

				// oUtilsJsonModel.setProperty("/CammesaTab", codNovedad !== "C" && codNovedad !== "I");
				// oUtilsJsonModel.setProperty("/IdNovedad", oSelectedNovedad.IdNovedad);
				// var codigo = this.getView().byId("IUbic")?.getSelectedItem()?.getBindingContext("EstacionesJsonModel")?.getObject()?.Estacion
				// Llamadas asincrónicas
				Promise.all([
					MotivosService.loadModel(oSelectedNovedad.CodNovedad, oSelectedNovedad.Empresa),
					CausasService.loadModel(oSelectedNovedad.CodNovedad, oSelectedNovedad.CodMotivo, oSelectedNovedad.Empresa),
					//EquiposService.loadEquipos(oSelectedNovedad.CodTipo, oSelectedNovedad.Tplnr, codigo, oSelectedNovedad.Empresa),
					LicenciaService.loadList(oSelectedNovedad.Empresa, oSelectedNovedad.IdNovedad)
				]).then(() => {
					this.setNavigationPropertiesData(oSelectedNovedad);
					// (opcional) si querés flags de perturbaciones como cuando editás
					const sFrag = this._getFragmentByNovedad(oSelectedNovedad);
					if (sFrag.includes("formPerturbaciones")) {
						this._applyPerturbacionesFlags(oSelectedNovedad);
					}

					// (opcional) editableMode si corresponde
					ModelHelper.getModel("editModel").setProperty("/editableMode", true);

					// Navegar a vista (solo si es Perturbaciones)
					if (sFrag.includes("formPerturbaciones")) {
						this.getOwnerComponent().getRouter().navTo(
							"Perturbaciones",
							{ mode: "edit" },
							{ query: { id: oSelectedNovedad.IdNovedad } } // opcional, por si querés mostrarlo o recargar
						);
						return;
					}

					if (sFrag.includes("formProgramadas")) {
						this.getOwnerComponent().getRouter().navTo("Programadas", { mode: "edit" }, { query: { id: oSelectedNovedad.IdNovedad } });

						return;
					}


				}).catch((oError) => {
					console.error("Error cargando datos de novedad:", oError);
					MessageBox.alert("Error", "Ocurrió un error al cargar la información relacionada a la novedad.");
				});
			}
		},

		onErrorLoadCallback: function () {

		},
		setNavigationPropertiesData: function (oSelectedNovedad) {
			if (oSelectedNovedad.InformeCammesaSet.results.length > 0) {
				oSelectedNovedad.InformeCammesaSet.results[0].Autoriza = oSelectedNovedad.InformeCammesaSet.results[0].Autoriza === "S";
				oSelectedNovedad.InformeCammesaSet.results[0].InformaCammesa = oSelectedNovedad.InformeCammesaSet.results[0].InformaCammesa ===
					"S";
				ModelHelper.getModel("CammesaFormJsonModel", this.getView()).setData(oSelectedNovedad.InformeCammesaSet.results[0]);
			}

			if (oSelectedNovedad.ComentariosSet.results.length > 0) {
				ModelHelper.getModel("CommentsFormJsonModel", this.getView()).setData(oSelectedNovedad.ComentariosSet.results[0]);
			}

			if (oSelectedNovedad.ConsecuentesSet.results.length > 0) {
				ModelHelper.getModel("ConsecuentesFormJsonModel", this.getView()).setProperty("/", oSelectedNovedad.ConsecuentesSet.results[0]);
			}
			if (oSelectedNovedad.ENSRegXNS_NAV.results.length > 0) {
				oSelectedNovedad.ENSRegXNS_NAV.results.map(function (element) {
					element.ENSRow = (element.Corte / 60) * element.Potencia;
				});
			}
			ModelHelper.getModel("NovedadesFormJsonModel", this.getView()).setData(oSelectedNovedad);

			ModelHelper.getModel("ConsequentListJsonModel", this.getView()).setData({
				Consequents: oSelectedNovedad.ConsecuentesSet.results
			});
			ModelHelper.getModel("PruebasListJsonModel", this.getView()).setData({
				Pruebas: oSelectedNovedad.PruebasXNS_nav.results
			});
			ModelHelper.getModel("SignalsListJsonModel", this.getView()).setData({
				Signals: oSelectedNovedad.SenialXNS_nav.results
			});
			ModelHelper.getModel("ENSListJsonModel", this.getView()).setData({
				ENSRegisters: oSelectedNovedad.ENSRegXNS_NAV.results
			});
			var consecuenteModel = ModelHelper.getModel("ConsecuentesFormJsonModel", this.getView());
			var novedadesModel = ModelHelper.getModel("NovedadesFormJsonModel", this.getView());
			consecuenteModel.setProperty("/Tplnr", novedadesModel.getProperty("/Tplnr"));
			consecuenteModel.setProperty("/InicioNove", novedadesModel.getProperty("/InicioNove"));
			consecuenteModel.setProperty("/EntIndis", novedadesModel.getProperty("/EntIndis"));
			var cammesaModel = ModelHelper.getModel("CammesaFormJsonModel", this.getView());
			consecuenteModel.setProperty("/InformaCammesa", cammesaModel.getProperty("/InformaCammesa"));
			consecuenteModel.setProperty("/FechaHora", cammesaModel.getProperty("/FechaHora"));
			this.addConsecuente = true;


		},

		_getFragmentByNovedad: function (oNovedad) {
			// Ajustá esta condición a tu negocio real:
			// Ejemplo: si CodNovedad === "P" o "D" => Perturbaciones, sino => Programadas
			const sCod = oNovedad?.CodNovedad;

			const bPerturbacion = (sCod === "P"); // <-- ajustá si hace falta

			return bPerturbacion
				? "transener.registrocronologicoeventos.fragments.forms.formPerturbaciones"
				: "transener.registrocronologicoeventos.fragments.forms.formProgramadas";
		}

	});
});