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
	"transener/registrocronologicoeventos/services/LibroGuardiaService",
	"transener/registrocronologicoeventos/utils/MessageBoxHelper",
	"transener/registrocronologicoeventos/utils/ValidateHelper",
	"transener/registrocronologicoeventos/utils/formatter",
	"sap/ui/core/UIComponent",
	"transener/registrocronologicoeventos/services/UserService",
	"transener/registrocronologicoeventos/services/TurnsService"
], function (Controller, MessageBox, Fragment, ModelHelper, Logger, ErrorHandler, Constants, EquiposService, NovedadesService, SubindiceService, MotivosService, LibroGuardiaService, MessageBoxHelper, ValidateHelper, formatter, UIComponent, UserService, TurnsService) {
	"use strict";
	return Controller.extend("transener.registrocronologicoeventos.controller.BaseController", {
		/**
		 * Formatter para usar en todas las vistas que extienden BaseController
		 */
		formatter: formatter,
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
			var oUtilsModel = ModelHelper.getModel("utilsModel", oView);
			if (oUtilsModel) {
				oUtilsModel.setProperty("/readOnlyMode", false);
			}
			this.resetNovedadesModel().then(() => {
				this.getOwnerComponent().getRouter().navTo("Perturbaciones", {
					mode: Constants.EDIT_MODES.CREATE,
					idNovedad: "new",
					empresa: ModelHelper.getModel("Empresa", this.getView()).getProperty("/selectedSociety") || "100"
				});
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
			var oUtilsModel = ModelHelper.getModel("utilsModel", oView);
			if (oUtilsModel) {
				oUtilsModel.setProperty("/readOnlyMode", false);
			}
			this.resetNovedadesModel().then(() => {
				this.getOwnerComponent().getRouter().navTo("Programadas", { mode: Constants.EDIT_MODES.CREATE, idNovedad: "new", empresa: ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety") || "" });
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
		 * Limpia todos los modelos de formulario antes de cargar datos nuevos
		 * Se ejecuta antes de cargar datos en modo create, edit o view
		 * @param {sap.ui.core.mvc.View} oView - Vista actual
		 * @private
		 */
		_clearAllFormModels: function (oView) {
			try {
				// Limpiar modelo principal de novedades
				const oNovedadesModel = ModelHelper.getModel("NovedadesFormJsonModel", oView);
				if (oNovedadesModel) {
					oNovedadesModel.setData({});
				}

				// Limpiar modelo de perturbaciones (checkboxes)
				const oFormPerturbacionesModel = ModelHelper.getModel("formPerturbacionesModel", oView);
				if (oFormPerturbacionesModel) {
					oFormPerturbacionesModel.setData({
						chkRecierre: false,
						chkRecDeseng: false,
						chkDeseng: false,
						chkEmergencia: false
					});
				}

				// Limpiar modelo de programadas si existe
				const oFormProgramadasModel = ModelHelper.getModel("formProgramadasModel", oView);
				if (oFormProgramadasModel) {
					oFormProgramadasModel.setData({});
				}

				// Limpiar modelos relacionados
				const oCammesaModel = ModelHelper.getModel("CammesaFormJsonModel", oView);
				if (oCammesaModel) {
					oCammesaModel.setData({});
				}

				const oCommentsModel = ModelHelper.getModel("CommentsFormJsonModel", oView);
				if (oCommentsModel) {
					oCommentsModel.setData({});
				}

				const oConsecuentesModel = ModelHelper.getModel("ConsecuentesFormJsonModel", oView);
				if (oConsecuentesModel) {
					oConsecuentesModel.setData({});
				}

				const oConsequentListModel = ModelHelper.getModel("ConsequentListJsonModel", oView);
				if (oConsequentListModel) {
					oConsequentListModel.setData({ Consequents: [] });
				}

				Logger.debug("Todos los modelos de formulario han sido limpiados");
			} catch (e) {
				Logger.error("Error al limpiar modelos de formulario", e);
			}
		},

		/**
		 * Resetea el modelo de novedades cargando el JSON inicial
		 * @returns {Promise} Promise que se resuelve cuando el modelo se carga
		 */
		resetNovedadesModel: function () {
			const oView = this.getView();

			// Limpiar todos los modelos primero
			this._clearAllFormModels(oView);

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
		/**
		 * Maneja el cambio en EntDispo y actualiza EntServicio con el mismo valor
		 * También crea un registro en el Libro de Guardia si hay fecha
		 * @param {sap.ui.base.Event} oEvent - Evento del cambio
		 */
		onEntDispoChange: function (oEvent) {
			const oView = this.getView();
			const oDateTimePicker = oEvent.getSource();
			const oDateValue = oDateTimePicker.getDateValue();

			if (oDateValue) {
				// Actualizar EntServicio con el mismo valor que EntDispo
				const oNovedadesModel = ModelHelper.getModel("NovedadesFormJsonModel", oView);
				if (oNovedadesModel) {
					oNovedadesModel.setProperty("/EntServicio", oDateValue);
					Logger.debug("EntServicio actualizado automáticamente con EntDispo", { EntDispo: oDateValue, EntServicio: oDateValue });
				}
			}
		},

		/**
		 * Crea un registro en el Libro de Guardia
		 * @param {sap.ui.core.mvc.View} oView - Vista actual
		 * @param {Date} [oFechaHora] - Fecha y hora (opcional, si no se proporciona usa InicioNove)
		 * @param {string} [sIdNovedadFromResult] - IdNovedad del resultado del POST (opcional)
		 * @private
		 */
		_createGuardiaRecord: function (oView, oFechaHora, sIdNovedadFromResult) {
			try {
				const oNovedadesModel = ModelHelper.getModel("NovedadesFormJsonModel", oView);
				if (!oNovedadesModel) {
					Logger.warn("_createGuardiaRecord: No se encontró NovedadesFormJsonModel");
					return;
				}

				const data = oNovedadesModel.getData();
				const sEquipo = data.Equnr || "";
				const sLugar = data.Tplnr || "";

				// Usar IdNovedad del resultado si se proporciona, sino del modelo
				const sNovedad = sIdNovedadFromResult || data.IdNovedad || data.Id || "";

				// Si no se proporciona fecha, usar InicioNove
				if (!oFechaHora) {
					oFechaHora = data.InicioNove || null;
				}

				// Validar que tengamos los datos mínimos
				if (!sEquipo || !sLugar || !oFechaHora) {
					Logger.debug("_createGuardiaRecord: Faltan datos requeridos (Equipo, Lugar o Fecha)");
					return;
				}

				// Determinar el TipoNovedad basado en los checkboxes
				var svedad = "";
				var oFormPerturbacionesModel = ModelHelper.getModel("formPerturbacionesModel", oView);

				if (oFormPerturbacionesModel) {
					var oFormData = oFormPerturbacionesModel.getData() || {};
					if (oFormData.chkRecDeseng) {
						sTipoNovedad = "RECD"; // Recierre y Desenganche
					} else if (oFormData.chkRecierre) {
						sTipoNovedad = "AREC"; // Recierre
					} else if (oFormData.chkDeseng) {
						sTipoNovedad = "DESE"; // Desenganche
					} else if (oFormData.chkEmergencia) {
						sTipoNovedad = "FSPE"; // F/S Emergencia
					}
				}

				// Si no se encontró en formPerturbacionesModel, usar los valores de NovedadesFormJsonModel
				if (!sTipoNovedad) {
					// Caso especial: Si tiene solo Recierre pero sin EntIndis, es AREC
					if (data.Recierre && !data.EntIndis) {
						sTipoNovedad = "AREC";
					} else if (data.Recierre && data.GenIndisponibilidad) {
						sTipoNovedad = "RECD";
					} else if (data.Recierre) {
						sTipoNovedad = "AREC";
					} else if (data.GenIndisponibilidad && data.CodNovedad === Constants.NOVEDAD_TYPES.PERTURBACION) {
						sTipoNovedad = "DESE";
					} else if (data.GenIndisponibilidad && data.CodNovedad === Constants.NOVEDAD_TYPES.DESCONEXION) {
						sTipoNovedad = "FSPE";
					} else {
						sTipoNovedad = "N/A";
					}
				}

				// Preparar datos para el servicio
				var oGuardiaData = {
					Fechahora: oFechaHora,
					Equipo: sEquipo,
					Lugar: sLugar,
					Novedad: sNovedad,
					Tiponovedad: sTipoNovedad
				};

				// Crear registro en Libro de Guardia y retornar la Promise
				return LibroGuardiaService.createGuardia(oGuardiaData, oView)
					.then(function (oResponse) {
						Logger.info("_createGuardiaRecord: Registro creado exitosamente en Libro de Guardia");
						// El mensaje ya se muestra en el servicio (MessageToast)
						return oResponse;
					})
					.catch(function (oError) {
						Logger.error("_createGuardiaRecord: Error al crear registro en Libro de Guardia", oError);
						// El error ya se maneja en el servicio
						throw oError;
					});
			} catch (e) {
				Logger.error("_createGuardiaRecord: Excepción al crear registro", e);
				ErrorHandler.handleError(e, "crear registro en Libro de Guardia", false);
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

			var Empresa = ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety");
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
			MotivosService.loadModel(oData.CodNovedad, Empresa);
			Logger.debug("Datos del modelo de novedades actualizados", oData);
		}
		,
		/**
		 * Guarda un registro en Libro de Guardia desde la vista de Novedades
		 * Si es modo EDIT hace PUT, si es CREATE hace POST
		 * Solo guarda en GuardiasListSet usando los campos de la vista de Novedades
		 */
		onSaveGuardia: function () {
			const oView = this.getView();
			const oNovedadesModel = ModelHelper.getModel("NovedadLGFormJsonModel", oView);
			const oEditModel = ModelHelper.getModel("editModel", oView);

			if (!oNovedadesModel) {
				MessageBox.alert("No se encontró el modelo de novedades.");
				return;
			}

			const data = oNovedadesModel.getData();
			const sMode = oEditModel ? (oEditModel.getProperty("/mode") || "").toLowerCase() : Constants.EDIT_MODES.CREATE;
			const bIsEditMode = sMode === Constants.EDIT_MODES.EDIT;

			// Validar campos requeridos
			if (!data.CodNovedad) {
				MessageBox.alert("Debe seleccionar un Tipo de Novedad.");
				return;
			}

			if (!data.Tplnr) {
				MessageBox.alert("Debe seleccionar una Ubicación.");
				return;
			}

			if (!data.Equnr) {
				MessageBox.alert("Debe seleccionar un Equipo.");
				return;
			}

			if (!data.InicioNove) {
				MessageBox.alert("Debe ingresar una Fecha/Hora.");
				return;
			}

			// Para modo EDIT, validar que tenga Id del registro de GuardiasListSet
			if (bIsEditMode && !data.Id) {
				MessageBox.alert("No se encontró el Id del registro a actualizar.");
				return;
			}

			// Armar el payload con los campos de la vista de Novedades
			var oGuardiaData = {
				Fechahora: data.InicioNove,
				Equipo: data.Equnr,
				Lugar: data.Tplnr,
				Novedad: data.Novedad,
				Tiponovedad: data.CodNovedad || ""
			};

			// Si es modo EDIT, agregar el Id para el PUT
			if (bIsEditMode) {
				oGuardiaData.Id = data.Id;
			}

			var that = this;
			var sEmpresa = "";
			try {
				var oEmpresaModel = ModelHelper.getModel("Empresa", oView);
				sEmpresa = oEmpresaModel ? oEmpresaModel.getProperty("/selectedSociety") : "";
				if (!sEmpresa) {
					var oUtilsModel = ModelHelper.getModel("utilsModel", oView);
					sEmpresa = oUtilsModel ? oUtilsModel.getProperty("/Empresa") : "";
				}
			} catch (e) {
				Logger.debug("onSaveGuardia: No se pudo obtener empresa", e);
			}

			// Validar turno antes de guardar
			TurnsService.validateCreatePermission(data.InicioNove, sEmpresa, oView)
				.then(function (oResult) {
					if (!oResult.allowed) {
						MessageBox.error(oResult.message);
						return;
					}

					// Guardar en Libro de Guardia (CREATE o UPDATE según el modo)
					var oPromise = bIsEditMode
						? LibroGuardiaService.updateGuardia(oGuardiaData, oView)
						: LibroGuardiaService.createGuardia(oGuardiaData, oView);

					oPromise
						.then(function (oResponse) {
							Logger.info("onSaveGuardia: Registro " + (bIsEditMode ? "actualizado" : "creado") + " exitosamente en Libro de Guardia");

							var oBus = sap.ui.getCore().getEventBus();
							if (oBus) {
								oBus.publish("Main", "onInit");
								Logger.debug("onSaveGuardia: Evento publicado para refrescar datos en Main");
							}

							that.onNavBack();
						})
						.catch(function (oError) {
							Logger.error("onSaveGuardia: Error al " + (bIsEditMode ? "actualizar" : "crear") + " registro en Libro de Guardia", oError);
						});
				})
				.catch(function (oError) {
					Logger.error("onSaveGuardia: Error al validar turno", oError);
					MessageBox.error("Error al validar el turno. Intente nuevamente.");
				});
		},

		/**
		 * Guarda una novedad (crea o actualiza según el modo)
		 */
		onSaveNovedad: function () {
			if (!UserService.isEditor()) {
				MessageBox.error("No tiene permisos para crear o editar novedades.");
				return;
			}
			const oValidationResult = this.novedadesFormValid();
			if (!oValidationResult.valid) {
				// Marcar campos con error en rojo (ya lo hace ValidateHelper a través de propertyState)
				// Mostrar mensaje con campos faltantes
				var sMessage = "Por favor complete los siguientes campos requeridos:\n\n";
				if (oValidationResult.missingFields && oValidationResult.missingFields.length > 0) {
					sMessage += "• " + oValidationResult.missingFields.join("\n• ");
				} else {
					sMessage += "Hay campos con errores de validación";
				}

				MessageBox.error(sMessage, {
					title: "Campos Faltantes",
					actions: [MessageBox.Action.OK]
				});
				return;
			}

			const oView = this.getView();
			// Flag para controlar si hay un MessageBox abierto (con EntDispo)
			var bMessageBoxOpen = false;
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

			// // Si hay fecha de EntDispo, mostrar mensaje informativo sobre creación de novedad en LG
			// if (data.EntDispo) {
			// 	var sUbicacion = data.Tplnr || "N/A";
			// 	var sEquipo = data.Equnr || "N/A";
			// 	var sReferencia = data.IdNovedad || "Nueva";

			// 	// Intentar obtener la descripción de la ubicación
			// 	var sUbicacionDesc = sUbicacion;
			// 	try {
			// 		var oEstacionesModel = ModelHelper.getModel("Estaciones", oView) || ModelHelper.getModel("EstacionesJsonModel", oView);
			// 		if (oEstacionesModel) {
			// 			var aEstaciones = oEstacionesModel.getData();
			// 			if (aEstaciones && aEstaciones.Estaciones) {
			// 				var oEstacion = aEstaciones.Estaciones.find(function(est) {
			// 					return est.Codigo === sUbicacion;
			// 				});
			// 				if (oEstacion && oEstacion.Descripcion) {
			// 					sUbicacionDesc = sUbicacion + " - " + oEstacion.Descripcion;
			// 				}
			// 			}
			// 		}
			// 	} catch (e) {
			// 		Logger.debug("No se pudo obtener descripción de ubicación", e);
			// 	}

			// 	// Formatear la fecha de EntDispo para mostrar
			// 	var sFechaDispo = "";
			// 	if (data.EntDispo instanceof Date) {
			// 		var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
			// 			pattern: "dd/MM/yyyy HH:mm"
			// 		});
			// 		sFechaDispo = oDateFormat.format(data.EntDispo);
			// 	} else if (data.EntDispo) {
			// 		sFechaDispo = data.EntDispo;
			// 	}

			// 	// Determinar el TipoNovedad basado en los checkboxes
			// 	var sTipoNovedad = "";
			// 	var oFormPerturbacionesModel = ModelHelper.getModel("formPerturbacionesModel", oView);

			// 	// Intentar obtener desde formPerturbacionesModel primero
			// 	if (oFormPerturbacionesModel) {
			// 		var oFormData = oFormPerturbacionesModel.getData() || {};
			// 		if (oFormData.chkRecDeseng) {
			// 			sTipoNovedad = "RECD"; // Recierre y Desenganche
			// 		} else if (oFormData.chkRecierre) {
			// 			sTipoNovedad = "AREC"; // Recierre
			// 		} else if (oFormData.chkDeseng) {
			// 			sTipoNovedad = "DESE"; // Desenganche
			// 		} else if (oFormData.chkEmergencia) {
			// 			sTipoNovedad = "FSPE"; // F/S Emergencia
			// 		}
			// 	}

			// 	// Si no se encontró en formPerturbacionesModel, usar los valores de NovedadesFormJsonModel
			// 	if (!sTipoNovedad) {
			// 		if (data.Recierre && data.GenIndisponibilidad) {
			// 			sTipoNovedad = "RECD"; // Recierre y Desenganche
			// 		} else if (data.Recierre) {
			// 			sTipoNovedad = "AREC"; // Recierre
			// 		} else if (data.GenIndisponibilidad && data.CodNovedad === Constants.NOVEDAD_TYPES.PERTURBACION) {
			// 			sTipoNovedad = "DESE"; // Desenganche
			// 		} else if (data.GenIndisponibilidad && data.CodNovedad === Constants.NOVEDAD_TYPES.DESCONEXION) {
			// 			sTipoNovedad = "FSPE"; // F/S Emergencia
			// 		} else {
			// 			sTipoNovedad = "N/A"; // Por defecto si no se puede determinar
			// 		}
			// 	}

			// 	var sMensaje = "Se creará una novedad en LG a futuro con los siguientes datos:\n\n" +
			// 		"Fecha/Hora: " + sFechaDispo + "\n" +
			// 		"Lugar (Estación): " + sUbicacionDesc + "\n" +
			// 		"Equipo: " + sEquipo + "\n" +
			// 		"TipoNovedad: " + sTipoNovedad + "\n" +
			// 		"Referencia: " + sReferencia;

			// 	var that = this;
			// 	bMessageBoxOpen = true;

			// 	MessageBox.information(sMensaje, {
			// 		title: "Novedad en LG",
			// 		actions: [MessageBox.Action.OK],
			// 		onClose: function (sAction) {
			// 			bMessageBoxOpen = false;
			// 			// Crear registro en Libro de Guardia después de mostrar el mensaje
			// 			var oGuardiaPromise = that._createGuardiaRecord(oView, data.EntDispo);
			// 			// Navegar después de crear el registro (o inmediatamente si no hay Promise)
			// 			if (oGuardiaPromise && typeof oGuardiaPromise.then === "function") {
			// 				oGuardiaPromise
			// 					.then(function() {
			// 						// Publicar evento para refrescar datos en Main
			// 						var oBus = sap.ui.getCore().getEventBus();
			// 						if (oBus) {
			// 							oBus.publish("Main", "onInit");
			// 							Logger.debug("onSaveNovedad: Evento publicado para refrescar datos en Main");
			// 						}
			// 						// Navegar de vuelta a la vista principal
			// 						that.onNavBack();
			// 					})
			// 					.catch(function(oError) {
			// 						// Aún así navegar aunque haya error
			// 						var oBus = sap.ui.getCore().getEventBus();
			// 						if (oBus) {
			// 							oBus.publish("Main", "onInit");
			// 						}
			// 						that.onNavBack();
			// 					});
			// 			} else {
			// 				// Si no hay Promise, navegar inmediatamente
			// 				var oBus = sap.ui.getCore().getEventBus();
			// 				if (oBus) {
			// 					oBus.publish("Main", "onInit");
			// 				}
			// 				that.onNavBack();
			// 			}
			// 		}
			// 	});
			// }

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

						// Si hay un MessageBox abierto (con EntDispo), la navegación se hará en el onClose del MessageBox
						// Si no hay MessageBox, navegar ahora
						if (!bMessageBoxOpen) {
							// Función para navegar y refrescar
							var that = this;
							var fnNavigateAndRefresh = function () {
								// Publicar evento para refrescar datos en Main
								var oBus = sap.ui.getCore().getEventBus();
								if (oBus) {
									oBus.publish("Main", "onInit");
									Logger.debug("onSaveNovedad: Evento publicado para refrescar datos en Main");
								}
								// Navegar de vuelta a la vista principal
								that.onNavBack();
							};

							// Hook para guardar datos adicionales (ENS, etc.) antes de navegar
							var oAfterSave = this._onAfterSaveSuccess ? this._onAfterSaveSuccess(data) : Promise.resolve();
							oAfterSave.then(function () {
								fnNavigateAndRefresh();
							}).catch(function () {
								fnNavigateAndRefresh();
							});
						}
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
		/**
		 * Mapeo de campos del modelo a etiquetas legibles para el usuario
		 * @private
		 */
		_fieldLabels: {
			CodNovedad: "Tipo de Novedad",
			CodTipo: "Tipo",
			InicioNove: "Fecha/Hora Inicio",
			EntIndis: "Ent. Indisponibilidad",
			CodWeather: "Clima",
			CodDispAct: "Disp. Actuantes",
			CodAreaResp: "Área Responsable",
			CodCausa: "Causa",
			Equnr: "Equipo",
			CodMotivo: "Motivo",
			GenIndisponibilidad: "Gen. Indisponibilidad",
			Tplnr: "Ubicación"
		},

		/**
		 * Valida el formulario de novedades y retorna los campos faltantes
		 * @returns {Object} {valid: boolean, missingFields: Array<string>}
		 */
		novedadesFormValid: function () {
			const oNovedadesModel = ModelHelper.getModel("NovedadesFormJsonModel", this.getView());
			const oRules = {
				CodNovedad: ["required"],
				//CodTipo: ["required"],
				InicioNove: ["required", "date"],
				EntIndis: ["required", "date"],
				CodWeather: ["required"],
				//CodDispAct: ["required"],
				//CodAreaResp: ["required"],
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

			// Obtener los campos faltantes
			const aMissingFields = [];
			if (bHasErrors && ValidateHelper.errors && ValidateHelper.errors.length > 0) {
				const that = this;
				ValidateHelper.errors.forEach(function (oError) {
					for (var sField in oError) {
						if (oError.hasOwnProperty(sField) && oError[sField] === "required") {
							var sLabel = that._fieldLabels[sField] || sField;
							// Evitar duplicados
							if (aMissingFields.indexOf(sLabel) === -1) {
								aMissingFields.push(sLabel);
							}
						}
					}
				});
			}

			oNovedadesModel.refresh(true);

			return {
				valid: !bHasErrors,
				missingFields: aMissingFields
			};
		},
		navToConsecuentes: function () {
			try {
				var oNovedad = ModelHelper.getModel("NovedadesFormJsonModel").getData();
				var sEmpresa = ModelHelper.getModel("Empresa", this.getView()).getProperty("/selectedSociety");
				this.getRouter().navTo(
					"Consecuentes",
					{
						mode: Constants.EDIT_MODES.EDIT,
						idNovedad: oNovedad.IdNovedad || "new",
						empresa: sEmpresa
					}
				);
				Logger.debug("Navegando a Consecuentes", { idNovedad: oNovedad.IdNovedad, empresa: sEmpresa });
			} catch (oError) {
				Logger.error("Error al navegar a Consecuentes", oError);
				ErrorHandler.handleError(oError, "navegar a Consecuentes", true);
			}
		},

	});
});