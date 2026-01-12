sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"transener/registrocronologicoeventos/utils/ModelHelper",
	"transener/registrocronologicoeventos/utils/Logger",
	"transener/registrocronologicoeventos/utils/ErrorHandler",
	"transener/registrocronologicoeventos/utils/Constants",
	"transener/registrocronologicoeventos/services/EquiposService",
	"transener/registrocronologicoeventos/services/NovedadesService",
	"transener/registrocronologicoeventos/services/SubindiceService",
	"transener/registrocronologicoeventos/services/MotivosService",
	"transener/registrocronologicoeventos/utils/MessageBoxHelper",
	"transener/registrocronologicoeventos/utils/ValidateHelper",
	"sap/ui/core/UIComponent"
], function (Controller, MessageBox, Fragment, ModelHelper, Logger, ErrorHandler, Constants, EquiposService, NovedadesService, SubindiceService, MotivosService, MessageBoxHelper, ValidateHelper, UIComponent) {
	"use strict";
		return Controller.extend("transener.registrocronologicoeventos.controller.BaseController", {
			/**
			 * Referencia al diálogo abierto (evita múltiples instancias)
			 * @private
			 */
			_oDialog: null,

			/**
			 * Obtiene el router de la aplicación
			 * @returns {sap.ui.core.routing.Router} Router de la aplicación
			 */
			getRouter: function () {
				return UIComponent.getRouterFor(this);
			},

			/**
			 * Abre un diálogo desde un fragment
			 * @param {string} fragment - Ruta del fragment a cargar
			 * @returns {Promise} Promise que se resuelve cuando el diálogo se abre
			 */
			openDialog: function (fragment) {
				if (this._oDialog) {
					this._oDialog.destroy();
					this._oDialog = null;
				}

				var oView = this.getView();
				if (!oView) {
					Logger.error("No se puede abrir el diálogo: la vista no está disponible");
					return Promise.reject("Vista no disponible");
				}

				return Fragment.load({
					name: fragment,
					controller: this,
					type: "XML"
				}).then((oFragment) => {
					if (!oFragment) {
						Logger.error("El fragmento cargado es inválido: " + fragment);
						throw new Error("Fragmento inválido");
					}

					// Verificar que el fragment sea un Dialog o tenga método open
					if (typeof oFragment.open !== "function") {
						Logger.warn("El fragmento no es un Dialog, intentando usar como control");
					}

					this._oDialog = oFragment;
					
					// Solo agregar como dependent si es un ManagedObject válido
					if (oFragment && oFragment.isA && oFragment.isA("sap.ui.core.Control")) {
						oView.addDependent(this._oDialog);
					}
					
					// Intentar abrir si tiene método open
					if (typeof this._oDialog.open === "function") {
						this._oDialog.open();
						Logger.debug("Diálogo abierto: " + fragment);
					} else {
						Logger.warn("El fragmento no tiene método open: " + fragment);
					}
				}).catch((oError) => {
					ErrorHandler.handleError(oError, "Abrir diálogo", true);
				});
			},
			/**
			 * Obtiene la URL base de la aplicación
			 * @returns {string} URL base de la aplicación
			 */
			getBaseURL: function () {
				var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
				var appPath = appId.replaceAll(".", "/");
				var appModulePath = jQuery.sap.getModulePath(appPath);

				var jsonModel = sap.ui.getCore().getModel("appCurrentInfo");
				// Verifica si el modelo existe
				if (!jsonModel) {
					jsonModel = new sap.ui.model.json.JSONModel();
					jsonModel.setSizeLimit(Constants.LIMITS.MODEL_SIZE);
					jsonModel.appUrl = appModulePath;
					sap.ui.getCore().setModel(jsonModel, "appCurrentInfo");
					jsonModel.setData({});
				}
				return appModulePath;
			},

			/**
			 * Obtiene y establece la versión de la aplicación en el modelo
			 */
			getVersion: function () {
				const oComponent = this.getOwnerComponent();
				const oView = this.getView();

				const sVersion = oComponent.getManifestEntry("/sap.app/applicationVersion/version");

				let oModel = sap.ui.getCore().getModel("appCurrentInfo");

				if (!oModel) {
					oModel = new sap.ui.model.json.JSONModel();
					oModel.setSizeLimit(Constants.LIMITS.MODEL_SIZE);
					sap.ui.getCore().setModel(oModel, "appCurrentInfo");
					oView.setModel(oModel, "appCurrentInfo");
				}

				oModel.setData({
					version: sVersion
				});
				oView.setModel(oModel, "appCurrentInfo");
				Logger.debug("Versión de aplicación establecida: " + sVersion);
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
			/**
			 * Navega a la vista de Perturbaciones en modo creación
			 */
			onPerturbacionesPress: function () {
				const oView = this.getView();
				ModelHelper.getModel("editModel", oView).setProperty("/editableMode", true);
				this.resetNovedadesModel().then(() => {
					this.getOwnerComponent().getRouter().navTo("Perturbaciones", { mode: Constants.EDIT_MODES.CREATE });
				}).catch((oError) => {
					ErrorHandler.handleError(oError, "Cargar modelo de novedades", true);
				});
			},

			/**
			 * Navega a la vista de Programadas en modo creación
			 */
			onProgramadasPress: function () {
				const oView = this.getView();
				ModelHelper.getModel("editModel", oView).setProperty("/editableMode", true);
				this.resetNovedadesModel().then(() => {
					this.getOwnerComponent().getRouter().navTo("Programadas", { mode: Constants.EDIT_MODES.CREATE });
				}).catch((oError) => {
					ErrorHandler.handleError(oError, "Cargar modelo de novedades", true);
				});
			},

			/**
			 * Navega a la vista de Novedades en modo creación
			 */
			onNovedadesPress: function () {
				const oView = this.getView();
				ModelHelper.getModel("editModel", oView).setProperty("/editableMode", true);
				this.resetNovedadesModel().then(() => {
					this.getOwnerComponent().getRouter().navTo("Novedades", { mode: Constants.EDIT_MODES.CREATE });
				}).catch((oError) => {
					ErrorHandler.handleError(oError, "Cargar modelo de novedades", true);
				});
			},
			/**
			 * Resetea el modelo de novedades cargando el JSON inicial
			 * @returns {Promise} Promise que se resuelve cuando el modelo se carga
			 */
			resetNovedadesModel: function () {
				const oView = this.getView();
				const oModel = ModelHelper.getModel("NovedadesFormJsonModel", oView);

				// Evita cache (útil en FLP / cambios frecuentes)
				const sUrl = sap.ui.require.toUrl("transener/registrocronologicoeventos/model/NovedadesFormJsonModel.json")
					+ "?_ts=" + Date.now();

				return new Promise((resolve, reject) => {
					const onDone = () => {
						oModel.detachRequestCompleted(onDone);
						Logger.debug("Modelo de novedades reseteado correctamente");
						resolve(oModel.getData());
					};

					const onFail = (oEvent) => {
						oModel.detachRequestFailed(onFail);
						const sError = oEvent.getParameter("message") || "No se pudo cargar el JSON de Novedades";
						Logger.error("Error al resetear modelo de novedades", sError);
						reject(sError);
					};

					oModel.attachRequestCompleted(onDone);
					oModel.attachRequestFailed(onFail);
					oModel.loadData(sUrl, null, true);
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
					// EquiposService.LoadEquipos(sKey, Empresa);
					EquiposService.LoadLTEquipos(sKey, Empresa);
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
			/**
			 * Obtiene el subíndice basado en los datos de la novedad
			 */
			getSubindice: function () {
				const oView = this.getView();
				const oModel = ModelHelper.getModel("NovedadesFormJsonModel", oView);
				const CodNovedad = oModel.getProperty("/CodNovedad");
				const Tplnr = oModel.getProperty("/Tplnr");
				const Equnr = oModel.getProperty("/Equnr");
				const InicioNove = oModel.getProperty("/InicioNove");
				const CodTipo = oModel.getProperty("/CodTipo");

				if (CodNovedad && Equnr && (Tplnr || Constants.LINEAS.includes(CodTipo)) && InicioNove) {
					SubindiceService.getSubindice(CodNovedad, Tplnr, Equnr, InicioNove);
					Logger.debug("Obteniendo subíndice", { CodNovedad, Tplnr, Equnr, InicioNove });
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
			var oView = this.getView();
			if (!oView) {
				Logger.error("onCheckBoxSelect: vista no disponible");
				return;
			}

			var oSelectedCheckBox = oEvent.getSource();
			var bSelected = oEvent.getParameter("selected");
			var utilsModel = ModelHelper.getModel("utilsModel", oView) || oView.getModel("utilsModel");
			
			if (!utilsModel) {
				Logger.error("onCheckBoxSelect: utilsModel no encontrado");
				return;
			}

			var empresa = utilsModel.getProperty("/CodEmpresa");
			var oModel = ModelHelper.getModel("NovedadesFormJsonModel", oView);
			
			if (!oModel) {
				Logger.error("onCheckBoxSelect: NovedadesFormJsonModel no encontrado");
				return;
			}

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

			// Obtener referencia a EntDispInput si existe (puede no estar en todas las vistas)
			var oEntDisp = oView ? oView.byId("EntDispInput") : null;

			switch (sCheckedId) {
				case "chkRecierre":
					oData.CodNovedad = Constants.NOVEDAD_TYPES.PERTURBACION;
					oData.Recierre = true;
					if (oEntDisp) {
						oEntDisp.setEnabled(false);
					}
					break;

				case "chkDeseng":
					oData.CodNovedad = Constants.NOVEDAD_TYPES.PERTURBACION;
					oData.GenIndisponibilidad = true;
					break;

				case "chkRecDeseng":
					oData.CodNovedad = Constants.NOVEDAD_TYPES.PERTURBACION;
					oData.Recierre = true;
					oData.GenIndisponibilidad = true;
					break;

				case "chkEmergencia":
					oData.CodNovedad = Constants.NOVEDAD_TYPES.DESCONEXION;
					oData.GenIndisponibilidad = true;
					break;
			}
				this.recierreChanged();
				oModel.setData(oData);
				MotivosService.loadModel(oData.CodNovedad, empresa);
				Logger.debug("Datos del modelo de novedades actualizados", oData);
			}
			,
			/**
			 * Guarda una novedad (crea o actualiza según el modo)
			 */
			onSaveNovedad: function () {
				if (!this.novedadesFormValid()) {
					ErrorHandler.handleValidationError(Constants.ERROR_MESSAGES.VALIDATION_ERROR, "Novedades");
					return;
				}


				
				const oView = this.getView();
				const promises = [];
				const data = ModelHelper.getModel("NovedadesFormJsonModel", oView).getData();
				const oEditModel = ModelHelper.getModel("editModel", oView);
				const sMode = (oEditModel.getProperty("/mode") || "").toLowerCase();
				const bUiEditable = !!oEditModel.getProperty("/editableMode");

				Logger.debug("Guardando novedad", { mode: sMode, uiEditable: bUiEditable, novedadId: data.IdNovedad });

				// Validaciones de fechas
				let bValidDates = data.InicioNove <= data.EntIndis;

				if (data.EntDispo && data.EntServicio) {
					if (data.EntIndis > data.EntDispo || data.EntDispo > data.EntServicio) {
						bValidDates = false;
					}
				} else if (data.EntDispo) {
					if (!(data.EntIndis < data.EntDispo)) {
						bValidDates = false;
					}
				} else if (data.EntServicio) {
					MessageBox.alert("Si carga Ent. en servicio, debe cargar Ent. Disponibilidad");
					return;
				}

			if (!bValidDates && (!data.Recierre || data.GenIndisponibilidad)) {
				MessageBox.show(
					" Ent. Indisponibilidad debe ser mayor que Inicio de Novedad\n" +
					" Ent. Disponibilidad debe ser mayor que Ent. Indisponibilidad\n" +
					" Ent. Servicio debe ser mayor que Ent. Disponibilidad\n"
				);
				return;
			}

			// Si hay fecha de EntDispo, mostrar mensaje informativo sobre creación de novedad en LG
			if (data.EntDispo) {
				var sUbicacion = data.Tplnr || "N/A";
				var sReferencia = data.IdNovedad || "Nueva";
				
				// Intentar obtener la descripción de la ubicación
				var sUbicacionDesc = sUbicacion;
				try {
					var oEstacionesModel = ModelHelper.getModel("Estaciones", oView) || ModelHelper.getModel("EstacionesJsonModel", oView);
					if (oEstacionesModel) {
						var aEstaciones = oEstacionesModel.getData();
						if (aEstaciones && aEstaciones.Estaciones) {
							var oEstacion = aEstaciones.Estaciones.find(function(est) {
								return est.Codigo === sUbicacion;
							});
							if (oEstacion && oEstacion.Descripcion) {
								sUbicacionDesc = sUbicacion + " - " + oEstacion.Descripcion;
							}
						}
					}
				} catch (e) {
					Logger.debug("No se pudo obtener descripción de ubicación", e);
				}

				// Formatear la fecha de EntDispo para mostrar
				var sFechaDispo = "";
				if (data.EntDispo instanceof Date) {
					var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
						pattern: "dd/MM/yyyy HH:mm"
					});
					sFechaDispo = oDateFormat.format(data.EntDispo);
				} else if (data.EntDispo) {
					sFechaDispo = data.EntDispo;
				}

				var sMensaje = "Se creará una novedad en LG a futuro con los siguientes datos:\n\n" +
					"Ubicación: " + sUbicacionDesc + "\n" +
					"Referencia: " + sReferencia + "\n" +
					"Fecha de Disponibilidad: " + sFechaDispo;

				MessageBox.information(sMensaje, {
					title: "Novedad en LG",
					actions: [MessageBox.Action.OK]
				});
			}

			// Validar que esté en modo edición si es necesario
			if (sMode === Constants.EDIT_MODES.EDIT && !bUiEditable) {
				MessageBox.alert("Activá 'Editar' antes de guardar.");
				return;
			}

				// Decisión PUT / POST según el modo
				if (sMode === Constants.EDIT_MODES.EDIT) {
					promises.push(NovedadesService.PUTPromise(oView));
				} else {
					promises.push(NovedadesService.POSTNovedad());
				}

				this.updateCounts = promises.length;

				Promise.all(promises.map((promise) => this.reflectProgress(promise)))
					.then((results) => {
						const failedResults = results.filter(r => !r.resolved);
						
						if (failedResults.length > 0) {
							ErrorHandler.handleODataError(
								failedResults[0].err,
								sMode === Constants.EDIT_MODES.EDIT ? "actualizar novedad" : "crear novedad"
							);
						} else {
							// Desbloquear novedad si estaba en modo edición
							if (sMode === Constants.EDIT_MODES.EDIT) {
								NovedadesService.unblockNovedad(data.IdNovedad, oView);
							}
							ErrorHandler.showSuccess(
								sMode === Constants.EDIT_MODES.EDIT 
									? Constants.SUCCESS_MESSAGES.UPDATED 
									: Constants.SUCCESS_MESSAGES.CREATED
							);
						}
					})
					.catch((oError) => {
						ErrorHandler.handleODataError(oError, "guardar novedad");
					});
			},
			/**
			 * Refleja el progreso de una promesa
			 * @param {Promise} promise - Promesa a monitorear
			 * @returns {Promise} Promise con el resultado formateado
			 */
			reflectProgress: function (promise) {
				return promise.then((data) => {
					return {
						resolved: true,
						data: data
					};
				}).catch((err) => {
					return {
						resolved: false,
						err: err
					};
				}).finally(() => {
					// TODO: Implementar actualización de progress bar si es necesario
					const advance = Constants.LIMITS.PROGRESS_BAR_MAX / this.updateCounts;
					Logger.debug("Progreso actualizado", { advance });
				});
			},
			/**
			 * Valida el formulario de novedades
			 * @returns {boolean} true si el formulario es válido, false en caso contrario
			 */
			novedadesFormValid: function () {
				const oNovedadesModel = ModelHelper.getModel("NovedadesFormJsonModel", this.getView());
				const oRules = {
					CodNovedad: ["required"],
					CodTipo: ["required"],
					InicioNove: ["required", "date"],
					EntIndis: ["required", "date"],
					CodWeather: ["required"],
					CodDispAct: ["required"],
					CodAreaResp: ["required"],
					CodCausa: ["required"],
					Equnr: ["required"],
					CodMotivo: ["required"],
					GenIndisponibilidad: ["required"]
				};

				const sNovedad = oNovedadesModel.getProperty("/CodNovedad");
				
				// Ajustar reglas según el tipo de novedad
				if (sNovedad === Constants.NOVEDAD_TYPES.CONEXION) {
					delete oRules.CodDispAct;
					delete oRules.CodAreaResp;
					delete oRules.CodWeather;
					delete oRules.GenIndisponibilidad;
				}
				if (sNovedad === Constants.NOVEDAD_TYPES.INTERRUPCION) {
					delete oRules.CodDispAct;
				}
				if (sNovedad === Constants.NOVEDAD_TYPES.DESCONEXION) {
					delete oRules.CodDispAct;
				}

				const sTipo = oNovedadesModel.getProperty("/CodTipo");
				if (!Constants.LINEAS.includes(sTipo)) {
					oRules.Tplnr = ["required"];
				}

				const bRecierre = oNovedadesModel.getProperty("/Recierre");
				const bGenIndisponibilidad = oNovedadesModel.getProperty("/GenIndisponibilidad");
				if (bRecierre && bGenIndisponibilidad === false) {
					delete oRules.EntIndis;
				}

				const oData = oNovedadesModel.getData();
				const bHasErrors = ValidateHelper.make(oData, oRules);
				oNovedadesModel.refresh(true);
				
				return !bHasErrors;
			}

		});
	});