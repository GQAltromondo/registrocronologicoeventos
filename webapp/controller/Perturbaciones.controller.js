sap.ui.define([
	"transener/registrocronologicoeventos/controller/BaseController",
	"transener/registrocronologicoeventos/utils/formatter",
	"transener/registrocronologicoeventos/utils/ModelHelper",
	"transener/registrocronologicoeventos/utils/Constants",
	"transener/registrocronologicoeventos/services/EquiposService",
	"transener/registrocronologicoeventos/services/CausasService",
	"transener/registrocronologicoeventos/services/ProteccionesService",
	"transener/registrocronologicoeventos/services/NovedadesService",
	"transener/registrocronologicoeventos/services/PruebasService",
	"transener/registrocronologicoeventos/utils/Logger",
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/services/UserService",
	"transener/registrocronologicoeventos/services/NormalizacionService",
	"transener/registrocronologicoeventos/services/CammesaService"
], function (BaseController, formatter, ModelHelper, Constants, EquiposService, CausasService, ProteccionesService, NovedadesService, PruebasService, Logger, oDataServices, UserService, NormalizacionService, CammesaService) {
	"use strict";
	var oDialog = null;

	return BaseController.extend("transener.registrocronologicoeventos.controller.Perturbaciones", {
		formatter: formatter,
		onInit: function () {
			this.getOwnerComponent().getRouter()
				.getRoute("Perturbaciones")
				.attachPatternMatched(this._onRouteMatched, this);

			ModelHelper.getModel("ConsequentListJsonModel", this.getView());

			// Inicializar modelos
			const oView = this.getView();
			ModelHelper.getModel("NormalizacionNS", oView);
			this._initPruebasFormModel(oView);
			const oProteccionesModel = ModelHelper.getModel("NovedadesProtecciones", oView);
			if (!oProteccionesModel.getData() || !oProteccionesModel.getData().Protecciones) {
				oProteccionesModel.setData({
					Protecciones: [],
					Et1: "",
					Et2: "",
					Et1State: "None",
					Et2State: "None",
					// Protecciones actuantes HBox 1
					Diferencial1: false,
					DPO1: false,
					Impedancia1: false,
					MaximaCorriente1: false,
					PFI1: false,
					U1: false,
					MenorU1: false,
					SinSenal1: false,
					OtrasActuaciones1: "",
					// Excitaciones HBox 1
					R1: false,
					S1: false,
					T1: false,
					Tierra1: false,
					SinExcitacion1: false,
					LocFalla1: "",
					Km1: "",
					// Protecciones actuantes HBox 2
					Diferencial2: false,
					DPO2: false,
					Impedancia2: false,
					MaximaCorriente2: false,
					PFI2: false,
					U2: false,
					MenorU2: false,
					SinSenal2: false,
					OtrasActuaciones2: "",
					// Excitaciones HBox 2
					R2: false,
					S2: false,
					T2: false,
					Tierra2: false,
					SinExcitacion2: false,
					LocFalla2: "",
					Km2: "",
					// Campos TBA (empresa 300) - HBox 1
					TBA_Flecha1: false, TBA_T01: false, TBA_T11: false, TBA_LI1: false,
					TBA_DAG1: false, TBA_UMayor1: false, TBA_U1: false,
					TBA_PDPZ1: false, TBA_PZ1: false, TBA_PD1: false, TBA_LI2_1: false,
					TBA_RRPI1: false,
					TBA_PFI1: false, TBA_DISC1: false, TBA_SIN1: false, TBA_BZ1: false,
					TBA_OtrasActuaciones1: "",
					TBA_FN1: false, TBA_FR1: false, TBA_FS1: false, TBA_FT1: false,
					TBA_TX1: false, TBA_RX1: false, TBA_T21: false, TBA_TS21: false, TBA_SINEx1: false,
					// Campos TBA (empresa 300) - HBox 2
					TBA_Flecha2: false, TBA_T02: false, TBA_T12: false, TBA_LI2: false,
					TBA_DAG2: false, TBA_UMayor2: false, TBA_U2: false,
					TBA_PDPZ2: false, TBA_PZ2: false, TBA_PD2: false, TBA_LI2_2: false,
					TBA_RRPI2: false,
					TBA_PFI2: false, TBA_DISC2: false, TBA_SIN2: false, TBA_BZ2: false,
					TBA_OtrasActuaciones2: "",
					TBA_FN2: false, TBA_FR2: false, TBA_FS2: false, TBA_FT2: false,
					TBA_TX2: false, TBA_RX2: false, TBA_T22: false, TBA_TS22: false, TBA_SINEx2: false
				});
			}

			this._iEditingProteccionIndex = -1;
			this._oEditingProteccionSignalData = null;
			this._sEditingProteccionPrefix = null;
			this._sEditingProteccionEtKey = null;
			this._iEditingPruebaIndex = -1;
			this._oEditingPruebaRow = null;
		},
		_onRouteMatched: function (oEvent) {
			var oArgs = oEvent.getParameter("arguments") || {};
			var sMode = (oArgs.mode || "edit").toLowerCase();
			var sIdNovedad = oArgs.idNovedad || "";
			var sEmpresa = oArgs.empresa || "";
			var oView = this.getView();

			// Modo (create/edit/view)
			var oEditModel = sap.ui.getCore().getModel("editModel") || oView.getModel("editModel");
			var oUtilsModel = ModelHelper.getModel("utilsModel", oView);

			if (oEditModel) {
				oEditModel.setProperty("/mode", sMode);
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
				// Si no es editor, forzar modo solo lectura
				if (!UserService.isEditor()) {
					oEditModel.setProperty("/editableMode", false);
					oEditModel.setProperty("/mode", Constants.EDIT_MODES.VIEW);
					if (oUtilsModel) {
						oUtilsModel.setProperty("/readOnlyMode", true);
					}
				}
			}

			this.addSignal = true;

			// Resetear estado de edición in-place
			this._iEditingProteccionIndex = -1;
			this._oEditingProteccionSignalData = null;
			this._sEditingProteccionPrefix = null;
			this._sEditingProteccionEtKey = null;
			this._iEditingPruebaIndex = -1;
			this._oEditingPruebaRow = null;
			this._setProteccionButtonMode("add");
			this._setPruebaButtonMode("add");

			// Resetear modelo de InformaCammesa
			ModelHelper.getModel("CammesaFormJsonModel", oView).setData({
				InformaCammesa: false,
				Texto: "",
				FechaHora: null,
				Autoriza: false
			});

			// Resetear modelo de normalización
			ModelHelper.getModel("NormalizacionNS", oView).setData({
				EnergizoDesde: "",
				EnergizoFecha: null,
				CargoDesde: "",
				CargoFecha: null,
				Comentarios: "",
				InformaEmpresa: "",
				InformaEmpComentarios: ""
			});

			// Guardar referencia de la novedad para saber si esta persistida
			this._sIdNovedad = (sIdNovedad && sIdNovedad !== "new") ? sIdNovedad : "";
			this._sEmpresa = sEmpresa || "";
			this._bNormalizacionExists = false;

			if (this._sIdNovedad && sEmpresa) {
				this._loadNovedadFromRoute(this._sIdNovedad, sEmpresa);
			} else {
				this.getNSInfo();
			}
		},

		/**
		 * Carga la novedad completa desde OData con $expand.
		 * Mapea las navigation properties a los modelos locales.
		 * Patron identico a Consecuentes._loadNovedadFromRoute.
		 */
		_loadNovedadFromRoute: function (sIdNovedad, sEmpresa) {
			var oView = this.getView();
			var that = this;

			var oUtilsModel = ModelHelper.getModel("utilsModel", oView);
			if (oUtilsModel) {
				oUtilsModel.setProperty("/Empresa", sEmpresa);
			}

			sap.ui.core.BusyIndicator.show(0);

			NovedadesService.findNovedad([], sIdNovedad)
				.then(function (oData) {
					sap.ui.core.BusyIndicator.hide();

					if (!oData || !oData.IdNovedad) {
						sap.m.MessageBox.error("No se encontro la novedad " + sIdNovedad);
						return;
					}

					// Mapear campos
					if (!oData.CodNovedad && (oData.Tiponovedad || oData.TipoNovedad)) {
						oData.CodNovedad = oData.Tiponovedad || oData.TipoNovedad;
					}
					if (!oData.Equnr && oData.Equipo) {
						oData.Equnr = oData.Equipo;
					}

					// Novedad padre
					ModelHelper.getModel("NovedadesFormJsonModel", oView).setData(oData);

					// SenialXNS_nav -> Protecciones
					if (oData.SenialXNS_nav && oData.SenialXNS_nav.results) {
						that._mapSignalsToProtecciones(oData.SenialXNS_nav.results);
					} else {
						var oProtModel = ModelHelper.getModel("NovedadesProtecciones", oView);
						if (oProtModel) {
							oProtModel.setProperty("/Protecciones", []);
						}
					}

					// ENS
					if (oData.ENSRegXNS_NAV && oData.ENSRegXNS_NAV.results) {
						oData.ENSRegXNS_NAV.results.forEach(function (element) {
							element.ENSRow = (element.Corte / 60) * element.Potencia;
						});
						ModelHelper.getModel("ENSListJsonModel", oView).setData({
							ENSRegisters: oData.ENSRegXNS_NAV.results
						});
						that.calculateAutomaticENS();
					}

					// Flags de checkboxes (Recierre, Deseng, etc.)
					that._applyPerturbacionesFlags(oData);

					// ConsecuentesSet
					if (oData.ConsecuentesSet && oData.ConsecuentesSet.results) {
						ModelHelper.getModel("ConsequentListJsonModel", oView).setData({
							Consequents: oData.ConsecuentesSet.results
						});
					}

					// PruebasXNS_nav
					if (oData.PruebasXNS_nav && oData.PruebasXNS_nav.results) {
						ModelHelper.getModel("TestProtecciones", oView).setData({
							PruebasProtecciones: oData.PruebasXNS_nav.results
						});
					}

					// Normalizacion_nav
					if (oData.Normalizacion_nav && oData.Normalizacion_nav.IdNovedad) {
						ModelHelper.getModel("NormalizacionNS", oView).setData(oData.Normalizacion_nav);
						that._bNormalizacionExists = true;
					} else {
						that._bNormalizacionExists = false;
					}

					// InformeCammesaSet
					if (oData.InformeCammesaSet && oData.InformeCammesaSet.results && oData.InformeCammesaSet.results.length > 0) {
						var oCammesa = oData.InformeCammesaSet.results[0];
						oCammesa.Autoriza = oCammesa.Autoriza === "S" || oCammesa.Autoriza === "X";
						oCammesa.InformaCammesa = oCammesa.InformaCammesa === "S" || oCammesa.InformaCammesa === "X";
						ModelHelper.getModel("CammesaFormJsonModel", oView).setData(oCammesa);
					}

					// ComentariosSet
					if (oData.ComentariosSet && oData.ComentariosSet.results && oData.ComentariosSet.results.length > 0) {
						ModelHelper.getModel("CommentsFormJsonModel", oView).setData(oData.ComentariosSet.results[0]);
					}

					// Cargar equipos y causas
					that.getNSInfo();
				})
				.catch(function (oError) {
					sap.ui.core.BusyIndicator.hide();
					sap.m.MessageBox.error("Error al cargar la novedad " + sIdNovedad);
					Logger.error("Error en _loadNovedadFromRoute", oError);
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
		},
		
		/**
		 * Maneja el cambio de equipo seleccionado
		 * Obtiene ExtremoA, ExtremoB y ExtremoC del equipo seleccionado
		 * y los asigna a NovedadesProtecciones Et1 y Et2
		 */
		onEquipoChange: function (oEvent) {
			const oView = this.getView();
			const oComboBox = oEvent.getSource();
			const sSelectedKey = oComboBox.getSelectedKey();
			
			if (!sSelectedKey) {
				// Si no hay equipo seleccionado, limpiar los extremos
				const oProteccionesModel = ModelHelper.getModel("NovedadesProtecciones", oView);
				oProteccionesModel.setProperty("/Et1", "");
				oProteccionesModel.setProperty("/Et2", "");
				return;
			}
			
			// Obtener el modelo de equipos
			const oEquiposModel = ModelHelper.getModel("EquiposModel", oView);
			const aEquipos = oEquiposModel.getProperty("/Equipos") || [];
			
			// Buscar el equipo seleccionado
			const oEquipoSeleccionado = aEquipos.find(function(oEquipo) {
				return oEquipo.CodigoEquipo === sSelectedKey;
			});
			
			if (!oEquipoSeleccionado) {
				sap.m.MessageBox.warning("No se encontraron datos del equipo seleccionado");
				return;
			}
			
			// Obtener los extremos del equipo
			const sExtremoA = oEquipoSeleccionado.ExtremoA || "";
			const sExtremoB = oEquipoSeleccionado.ExtremoB || "";
			const sExtremoC = oEquipoSeleccionado.ExtremoC || "";
			
			// Actualizar el modelo de protecciones
			const oProteccionesModel = ModelHelper.getModel("NovedadesProtecciones", oView);
			
			// Asignar ExtremoA a Et1 (siempre, incluso si está vacío)
			oProteccionesModel.setProperty("/Et1", sExtremoA);
			oProteccionesModel.setProperty("/Et1State", "None");
			
			// Asignar ExtremoB a Et2, o ExtremoC si no hay ExtremoB (siempre, incluso si está vacío)
			const sEt2Value = sExtremoB || sExtremoC || "";
			oProteccionesModel.setProperty("/Et2", sEt2Value);
			oProteccionesModel.setProperty("/Et2State", "None");
			
			// Refrescar el modelo para actualizar los bindings en la vista
			oProteccionesModel.refresh(true);
			
			},

		_setProteccionButtonMode: function (sMode) {
			var oBtn = this.byId("btnAddProteccion");
			if (!oBtn) { return; }
			if (sMode === "save") {
				oBtn.setIcon("sap-icon://save");
				oBtn.setTooltip("Guardar proteccion");
			} else {
				oBtn.setIcon("sap-icon://add");
				oBtn.setTooltip("Agregar proteccion");
			}
		},

		_setPruebaButtonMode: function (sMode) {
			var oBtn = this.byId("btnAddPrueba");
			if (!oBtn) { return; }
			if (sMode === "save") {
				oBtn.setIcon("sap-icon://save");
				oBtn.setTooltip("Guardar prueba");
			} else {
				oBtn.setIcon("sap-icon://add");
				oBtn.setTooltip("Agregar prueba");
			}
		},

		onAddProteccion: function () {
			const oView = this.getView();
			const oProteccionesModel = ModelHelper.getModel("NovedadesProtecciones", oView);
			
			// Inicializar el modelo si no existe o no tiene el array Protecciones
			if (!oProteccionesModel.getData() || !oProteccionesModel.getData().Protecciones) {
				oProteccionesModel.setData({
					Protecciones: [],
					Et1: "",
					Et2: "",
					Et1State: "None",
					Et2State: "None",
					// Protecciones actuantes HBox 1
					Diferencial1: false,
					DPO1: false,
					Impedancia1: false,
					MaximaCorriente1: false,
					PFI1: false,
					U1: false,
					MenorU1: false,
					SinSenal1: false,
					OtrasActuaciones1: "",
					// Excitaciones HBox 1
					R1: false,
					S1: false,
					T1: false,
					Tierra1: false,
					SinExcitacion1: false,
					LocFalla1: "",
					// Protecciones actuantes HBox 2
					Diferencial2: false,
					DPO2: false,
					Impedancia2: false,
					MaximaCorriente2: false,
					PFI2: false,
					U2: false,
					MenorU2: false,
					SinSenal2: false,
					OtrasActuaciones2: "",
					// Excitaciones HBox 2
					R2: false,
					S2: false,
					T2: false,
					Tierra2: false,
					SinExcitacion2: false,
					LocFalla2: ""
				});
			}
			
			const aProtecciones = oProteccionesModel.getProperty("/Protecciones") || [];
			
			// Determinar empresa activa
			const sEmpresa = ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety") || "100";
			const bIsTBA = sEmpresa === "300";
			
			// Función helper para recolectar datos según la empresa
			const collectProteccionData = function (sPrefix, sEtKey) {
				var sEt = sEtKey || ("Et" + sPrefix);
				const oData = {
					Et: oProteccionesModel.getProperty("/" + sEt) || "",
					Protecciones: [],
					Excitaciones: [],
					OtrasActuaciones: "",
					LocFalla: "",
					Km: "",
					Empresa: sEmpresa
				};
				
				if (bIsTBA) {
					// Empresa 300 (TBA) - campos con prefijo TBA_
					var aTBAProtFields = [
						{ modelKey: "TBA_Flecha" + sPrefix, text: "|>" },
						{ modelKey: "TBA_T0" + sPrefix, text: "T0" },
						{ modelKey: "TBA_T1" + sPrefix, text: "T1" },
						{ modelKey: "TBA_LI" + sPrefix, text: "LI" },
						{ modelKey: "TBA_DAG" + sPrefix, text: "DAG" },
						{ modelKey: "TBA_UMayor" + sPrefix, text: "U>" },
						{ modelKey: "TBA_U" + sPrefix, text: "U" },
						{ modelKey: "TBA_PDPZ" + sPrefix, text: "PD|PZ" },
						{ modelKey: "TBA_PZ" + sPrefix, text: "PZ" },
						{ modelKey: "TBA_PD" + sPrefix, text: "PD" },
						{ modelKey: "TBA_LI2_" + sPrefix, text: "LI" },
						{ modelKey: "TBA_RRPI" + sPrefix, text: "RRPI" },
						{ modelKey: "TBA_PFI" + sPrefix, text: "PFI" },
						{ modelKey: "TBA_DISC" + sPrefix, text: "DISC" },
						{ modelKey: "TBA_SIN" + sPrefix, text: "SIN" },
						{ modelKey: "TBA_BZ" + sPrefix, text: "BZ" }
					];
					aTBAProtFields.forEach(function(oProt) {
						if (oProteccionesModel.getProperty("/" + oProt.modelKey)) {
							oData.Protecciones.push(oProt.text);
						}
					});
					
					var aTBAExcFields = [
						{ modelKey: "TBA_FN" + sPrefix, text: "FN" },
						{ modelKey: "TBA_FR" + sPrefix, text: "FR" },
						{ modelKey: "TBA_FS" + sPrefix, text: "FS" },
						{ modelKey: "TBA_FT" + sPrefix, text: "FT" },
						{ modelKey: "TBA_TX" + sPrefix, text: "TX" },
						{ modelKey: "TBA_RX" + sPrefix, text: "RX" },
						{ modelKey: "TBA_T2" + sPrefix, text: "T2" },
						{ modelKey: "TBA_TS2" + sPrefix, text: "TS2" },
						{ modelKey: "TBA_SINEx" + sPrefix, text: "SIN" }
					];
					aTBAExcFields.forEach(function(oExc) {
						if (oProteccionesModel.getProperty("/" + oExc.modelKey)) {
							oData.Excitaciones.push(oExc.text);
						}
					});
					
					oData.OtrasActuaciones = oProteccionesModel.getProperty("/TBA_OtrasActuaciones" + sPrefix) || "";
					oData.Km = oProteccionesModel.getProperty("/Km" + sPrefix) || "";
				} else {
					// Empresa 100 (TRA) - campos originales
					var aProtFields = [
						{ modelKey: "Diferencial" + sPrefix, text: "Diferencial" },
						{ modelKey: "DPO" + sPrefix, text: "DPO" },
						{ modelKey: "Impedancia" + sPrefix, text: "Impedancia" },
						{ modelKey: "MaximaCorriente" + sPrefix, text: "Máxima Corriente" },
						{ modelKey: "PFI" + sPrefix, text: "PFI" },
						{ modelKey: "U" + sPrefix, text: "U>" },
						{ modelKey: "MenorU" + sPrefix, text: "<U" },
						{ modelKey: "SinSenal" + sPrefix, text: "Sin señalizacion de protecciones" }
					];
					aProtFields.forEach(function(oProt) {
						if (oProteccionesModel.getProperty("/" + oProt.modelKey)) {
							oData.Protecciones.push(oProt.text);
						}
					});
					
					var aExcFields = [
						{ modelKey: "R" + sPrefix, text: "R" },
						{ modelKey: "S" + sPrefix, text: "S" },
						{ modelKey: "T" + sPrefix, text: "T" },
						{ modelKey: "Tierra" + sPrefix, text: "Tierra" },
						{ modelKey: "SinExcitacion" + sPrefix, text: "Sin Excitación de fase" }
					];
					aExcFields.forEach(function(oExc) {
						if (oProteccionesModel.getProperty("/" + oExc.modelKey)) {
							oData.Excitaciones.push(oExc.text);
						}
					});
					
					oData.OtrasActuaciones = oProteccionesModel.getProperty("/OtrasActuaciones" + sPrefix) || "";
					oData.LocFalla = oProteccionesModel.getProperty("/LocFalla" + sPrefix) || "";
				}
				
				return oData;
			};
			
			// Crear objeto para la tabla guardando datos completos para editar despues
			var that = this;
			var createProteccionItem = function (oProt, sPrefix, sEtKey) {
				if (!oProt.Et) {
					return null;
				}

				// Snapshot de todos los campos del modelo para restaurar al editar
				var oFormData = { Empresa: sEmpresa, EtPrefix: sPrefix, EtKey: sEtKey || ("Et" + sPrefix) };
				var oModelData = oProteccionesModel.getData();

				// Guardar todos los campos con el sufijo correspondiente
				Object.keys(oModelData).forEach(function (sKey) {
					if (sKey.endsWith(sPrefix) && sKey !== "Et" + sPrefix && sKey !== "Protecciones") {
						oFormData[sKey] = oModelData[sKey];
					}
				});
				// Guardar el Fn para TRA HBox1 (binding intencional)
				if (!bIsTBA && sPrefix === "1") {
					oFormData["Fn"] = oModelData["Fn"];
				}
				oFormData["Et"] = oProt.Et;

				var oItem = {
					ET: oProt.Et,
					LocFalla: oProt.LocFalla || "",
					Km: oProt.Km || "",
					ProteccionActuante: oProt.Protecciones.join(", ") || "",
					Exitacion: oProt.Excitaciones.join(", ") || "",
					_formData: oFormData
				};

				// Generar payload OData y guardarlo como _signalData
				oItem._signalData = that._buildODataPayloadFromRow(oItem, sEmpresa);

				// Calcular Posicion auto-incremental
				var iMaxPos = 0;
				aProtecciones.forEach(function (oExisting) {
					if (oExisting._signalData && oExisting._signalData.Posicion) {
						var iPos = parseInt(oExisting._signalData.Posicion, 10);
						if (iPos > iMaxPos) { iMaxPos = iPos; }
					}
				});
				oItem._signalData.Posicion = (iMaxPos + 1).toString();

				return oItem;
			};

			var bIsEditing = this._iEditingProteccionIndex >= 0;
			var iAdded = 0;
			var aNewItems = [];

			if (bIsEditing) {
				// Modo edición: recolectar solo del HBox correspondiente
				var sEditPrefix = this._sEditingProteccionPrefix;
				var sEditEtKey = this._sEditingProteccionEtKey;
				var oProtData = collectProteccionData(sEditPrefix, sEditEtKey);
				if (oProtData.Et) {
					var oNewItem = createProteccionItem(oProtData, sEditPrefix, sEditEtKey);
					if (oNewItem) {
						// Preservar Posicion original
						var oOldItem = aProtecciones[this._iEditingProteccionIndex];
						if (oOldItem && oOldItem._signalData && oOldItem._signalData.Posicion) {
							oNewItem._signalData.Posicion = oOldItem._signalData.Posicion;
						}
						aProtecciones[this._iEditingProteccionIndex] = oNewItem;
						aNewItems.push(oNewItem);
						iAdded++;
						this._resetProteccionFields(sEditPrefix, bIsTBA);
					}
				}

				if (iAdded > 0) {
					oProteccionesModel.setProperty("/Protecciones", aProtecciones);
					oProteccionesModel.updateBindings();

					var sIdNovedad = that._sIdNovedad || ModelHelper.getModel("NovedadesFormJsonModel", oView).getProperty("/IdNovedad") || "";
					var sEmpresaPost = that._sEmpresa || ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety") || "";
					var oOldSignalData = this._oEditingProteccionSignalData;

					if (sIdNovedad && oOldSignalData && oOldSignalData.Id && oOldSignalData.Posicion) {
						// DELETE viejo + POST nuevo
						ProteccionesService.remove(oOldSignalData)
							.then(function () {
								var oPayload = jQuery.extend({}, aNewItems[0]._signalData);
								return ProteccionesService.IndividualPOSTEdition(oPayload, sIdNovedad, sEmpresaPost);
							})
							.then(function () {
															})
							.catch(function (oError) {
								sap.m.MessageBox.error("Error al actualizar la proteccion en el servidor");
								Logger.error("Error en actualizar proteccion", oError);
							});
					} else if (sIdNovedad) {
						var oPayload = jQuery.extend({}, aNewItems[0]._signalData);
						ProteccionesService.IndividualPOSTEdition(oPayload, sIdNovedad, sEmpresaPost)
							.then(function () {
															})
							.catch(function (oError) {
								sap.m.MessageBox.error("Error al guardar la proteccion en el servidor");
								Logger.error("Error en IndividualPOSTEdition", oError);
							});
					} else {
											}
				} else {
					sap.m.MessageBox.warning("Debe seleccionar al menos una ET para guardar la proteccion");
				}

				// Resetear estado de edición
				this._iEditingProteccionIndex = -1;
				this._oEditingProteccionSignalData = null;
				this._sEditingProteccionPrefix = null;
				this._sEditingProteccionEtKey = null;
				this._setProteccionButtonMode("add");
			} else {
				// Modo agregar: comportamiento original
				if (bIsTBA) {
					var oProteccionTBA1 = collectProteccionData("1", "Et2");
					if (oProteccionTBA1.Et) {
						var oItem1 = createProteccionItem(oProteccionTBA1, "1", "Et2");
						if (oItem1) {
							aProtecciones.push(oItem1);
							aNewItems.push(oItem1);
							iAdded++;
							this._resetProteccionFields("1", true);
						}
					}

					var oProteccionTBA2 = collectProteccionData("2", "Et1");
					if (oProteccionTBA2.Et) {
						var oItem2 = createProteccionItem(oProteccionTBA2, "2", "Et1");
						if (oItem2) {
							aProtecciones.push(oItem2);
							aNewItems.push(oItem2);
							iAdded++;
							this._resetProteccionFields("2", true);
						}
					}
				} else {
					var oProteccion1 = collectProteccionData("1", "Et");
					var oProteccion2 = collectProteccionData("2", "Et2");

					if (oProteccion1.Et) {
						var oItem1 = createProteccionItem(oProteccion1, "1", "Et");
						if (oItem1) {
							aProtecciones.push(oItem1);
							aNewItems.push(oItem1);
							iAdded++;
							this._resetProteccionFields("1", false);
						}
					}

					if (oProteccion2.Et) {
						var oItem2 = createProteccionItem(oProteccion2, "2", "Et2");
						if (oItem2) {
							aProtecciones.push(oItem2);
							aNewItems.push(oItem2);
							iAdded++;
							this._resetProteccionFields("2", false);
						}
					}
				}

				oProteccionesModel.setProperty("/Protecciones", aProtecciones);
				oProteccionesModel.updateBindings();

				if (iAdded > 0) {
					var sIdNovedad = that._sIdNovedad || ModelHelper.getModel("NovedadesFormJsonModel", oView).getProperty("/IdNovedad") || "";
					var sEmpresaPost = that._sEmpresa || ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety") || "";

					if (sIdNovedad) {
						aNewItems.forEach(function (oNewItem) {
							var oPayload = jQuery.extend({}, oNewItem._signalData);
							ProteccionesService.IndividualPOSTEdition(oPayload, sIdNovedad, sEmpresaPost)
								.then(function () {
																	})
								.catch(function (oError) {
									sap.m.MessageBox.error("Error al guardar la proteccion en el servidor");
									Logger.error("Error en IndividualPOSTEdition", oError);
								});
						});
					} else {
						sap.m.MessageToast.show("Se agrego " + iAdded + " proteccion(es) a la lista");
					}
				} else {
					sap.m.MessageBox.warning("Debe seleccionar al menos una ET para agregar protecciones");
				}
			}

			this.addSignal = true;
		},
		
		/**
		 * Resetea los campos del formulario de protecciones para un prefijo dado
		 * @param {string} sPrefix - "1" o "2"
		 * @param {boolean} bIsTBA - true si es empresa 300
		 * @private
		 */
		_resetProteccionFields: function (sPrefix, bIsTBA) {
			const oView = this.getView();
			const oModel = ModelHelper.getModel("NovedadesProtecciones", oView);
			
			if (bIsTBA) {
				// Campos TBA (empresa 300)
				var aTBAProtFields = ["TBA_Flecha", "TBA_T0", "TBA_T1", "TBA_LI", "TBA_DAG", "TBA_UMayor", "TBA_U",
					"TBA_PDPZ", "TBA_PZ", "TBA_PD", "TBA_LI2_", "TBA_RRPI",
					"TBA_PFI", "TBA_DISC", "TBA_SIN", "TBA_BZ"];
				var aTBAExcFields = ["TBA_FN", "TBA_FR", "TBA_FS", "TBA_FT", "TBA_TX", "TBA_RX", "TBA_T2", "TBA_TS2", "TBA_SINEx"];
				
				aTBAProtFields.forEach(function(sField) {
					oModel.setProperty("/" + sField + sPrefix, false);
				});
				aTBAExcFields.forEach(function(sField) {
					oModel.setProperty("/" + sField + sPrefix, false);
				});
				oModel.setProperty("/TBA_OtrasActuaciones" + sPrefix, "");
				oModel.setProperty("/Km" + sPrefix, "");
				// Limpiar el ET correspondiente: TBA HBox1 usa /Et2, HBox2 usa /Et1
				var sEtKey = sPrefix === "1" ? "/Et2" : "/Et1";
				oModel.setProperty(sEtKey, "");
			} else {
				// Campos TRA (empresa 100)
				var aProtFields = ["Diferencial", "DPO", "Impedancia", "MaximaCorriente", "PFI", "U", "MenorU", "SinSenal"];
				var aExcFields = ["R", "S", "T", "Tierra", "SinExcitacion"];

				aProtFields.forEach(function(sField) {
					oModel.setProperty("/" + sField + sPrefix, false);
				});
				aExcFields.forEach(function(sField) {
					oModel.setProperty("/" + sField + sPrefix, false);
				});
				// Limpiar Fn (Diferencial HBox1, binding intencional)
				if (sPrefix === "1") {
					oModel.setProperty("/Fn", false);
				}
				oModel.setProperty("/OtrasActuaciones" + sPrefix, "");
				oModel.setProperty("/LocFalla" + sPrefix, "");
				// Limpiar el ET correspondiente: HBox1 usa /Et, HBox2 usa /Et2
				var sEtKey = sPrefix === "1" ? "/Et" : "/Et2";
				oModel.setProperty(sEtKey, "");
			}
		},

		/**
		 * Construye un payload OData (Senializaciones) a partir de los datos de un item de la tabla.
		 * Mapea los campos UI (checkboxes con nombre semantico) a los campos OData (Pitr, Pito, etc).
		 * Cada fila de la tabla genera un registro OData independiente con datos en los campos primarios.
		 * @param {object} oRowData - item de la tabla con _formData
		 * @param {string} sEmpresa - codigo de empresa ("100" o "300")
		 * @returns {object} payload listo para POST a /SenializacionesSet
		 */
		_buildODataPayloadFromRow: function (oRowData, sEmpresa) {
			var bIsTBA = sEmpresa === "300";
			var oFormData = oRowData._formData || {};
			var oPayload = {
				Et: oRowData.ET || "",
				Et2: "",
				Km: "",
				Km2: "",
				Texto: "",
				Senializacion: "",
				Pitr: false, Pit1: false, Pili: false, Pito: false,
				Plus: false, Less: false, Rrpi: false, Bz: false,
				Li: false, Rr: false,
				Fn: false, Fr: false, Fs: false, Ft: false,
				Tx: false, Rx: false, T2: false, Ts2: false,
				Fn2: false, Fr2: false, Fs2: false, Ft2: false,
				Tx2: false, Rx2: false, T22: false, Ts22: false,
				Li2: false, Rr2: false
			};

			var sPrefix = oFormData.EtPrefix || "1";

			if (bIsTBA) {
				// TBA: mapeo de campos TBA_ a campos OData primarios
				oPayload.Pitr = !!oFormData["TBA_T0" + sPrefix];
				oPayload.Pit1 = !!oFormData["TBA_T1" + sPrefix];
				oPayload.Li = !!oFormData["TBA_LI" + sPrefix];
				oPayload.Plus = !!oFormData["TBA_UMayor" + sPrefix];
				oPayload.Less = !!oFormData["TBA_U" + sPrefix];
				oPayload.Pili = !!oFormData["TBA_PZ" + sPrefix];
				oPayload.Pito = !!oFormData["TBA_PD" + sPrefix];
				oPayload.Rrpi = !!oFormData["TBA_RRPI" + sPrefix];
				oPayload.Bz = !!oFormData["TBA_BZ" + sPrefix];
				oPayload.Fn = !!oFormData["TBA_FN" + sPrefix];
				oPayload.Fr = !!oFormData["TBA_FR" + sPrefix];
				oPayload.Fs = !!oFormData["TBA_FS" + sPrefix];
				oPayload.Ft = !!oFormData["TBA_FT" + sPrefix];
				oPayload.Tx = !!oFormData["TBA_TX" + sPrefix];
				oPayload.Rx = !!oFormData["TBA_RX" + sPrefix];
				oPayload.T2 = !!oFormData["TBA_T2" + sPrefix];
				oPayload.Ts2 = !!oFormData["TBA_TS2" + sPrefix];
				oPayload.Km = oFormData["Km" + sPrefix] || "";
				oPayload.Texto = oFormData["TBA_OtrasActuaciones" + sPrefix] || "";
			} else {
				// TRA: mapeo de campos semanticos a campos OData primarios
				oPayload.Pitr = !!oFormData["Fn"];  // Diferencial (binding intencional a Fn)
				if (sPrefix === "2") {
					oPayload.Pitr = !!oFormData["Diferencial2"];
				}
				oPayload.Pito = !!oFormData["DPO" + sPrefix];
				oPayload.Pit1 = !!oFormData["Impedancia" + sPrefix];
				oPayload.Pili = !!oFormData["MaximaCorriente" + sPrefix];
				oPayload.Plus = !!oFormData["PFI" + sPrefix];
				oPayload.Less = !!oFormData["U" + sPrefix];
				oPayload.Rr = !!oFormData["MenorU" + sPrefix];
				oPayload.Fr = !!oFormData["R" + sPrefix];
				oPayload.Fs = !!oFormData["S" + sPrefix];
				oPayload.Ft = !!oFormData["T" + sPrefix];
				oPayload.Fn = !!oFormData["Tierra" + sPrefix];
				oPayload.Texto = oFormData["LocFalla" + sPrefix] || "";
				oPayload.Km = "";
			}

			return oPayload;
		},

		/**
		 * Mapea un registro OData (Senializaciones) a los campos del formulario.
		 * Inverso de _buildODataPayloadFromRow.
		 * @param {object} oSignalData - registro OData de Senializaciones
		 * @param {string} sPrefix - "1" o "2" segun en que HBox restaurar
		 * @param {string} sEmpresa - codigo de empresa
		 */
		_mapODataToFormFields: function (oSignalData, sPrefix, sEmpresa) {
			var oView = this.getView();
			var oModel = ModelHelper.getModel("NovedadesProtecciones", oView);
			var bIsTBA = sEmpresa === "300";

			if (bIsTBA) {
				oModel.setProperty("/TBA_T0" + sPrefix, !!oSignalData.Pitr);
				oModel.setProperty("/TBA_T1" + sPrefix, !!oSignalData.Pit1);
				oModel.setProperty("/TBA_LI" + sPrefix, !!oSignalData.Li);
				oModel.setProperty("/TBA_UMayor" + sPrefix, !!oSignalData.Plus);
				oModel.setProperty("/TBA_U" + sPrefix, !!oSignalData.Less);
				oModel.setProperty("/TBA_PZ" + sPrefix, !!oSignalData.Pili);
				oModel.setProperty("/TBA_PD" + sPrefix, !!oSignalData.Pito);
				oModel.setProperty("/TBA_RRPI" + sPrefix, !!oSignalData.Rrpi);
				oModel.setProperty("/TBA_BZ" + sPrefix, !!oSignalData.Bz);
				oModel.setProperty("/TBA_FN" + sPrefix, !!oSignalData.Fn);
				oModel.setProperty("/TBA_FR" + sPrefix, !!oSignalData.Fr);
				oModel.setProperty("/TBA_FS" + sPrefix, !!oSignalData.Fs);
				oModel.setProperty("/TBA_FT" + sPrefix, !!oSignalData.Ft);
				oModel.setProperty("/TBA_TX" + sPrefix, !!oSignalData.Tx);
				oModel.setProperty("/TBA_RX" + sPrefix, !!oSignalData.Rx);
				oModel.setProperty("/TBA_T2" + sPrefix, !!oSignalData.T2);
				oModel.setProperty("/TBA_TS2" + sPrefix, !!oSignalData.Ts2);
				oModel.setProperty("/Km" + sPrefix, oSignalData.Km || "");
				oModel.setProperty("/TBA_OtrasActuaciones" + sPrefix, oSignalData.Texto || "");
				// TBA HBox1 usa Et2, HBox2 usa Et1
				var sEtKey = sPrefix === "1" ? "/Et2" : "/Et1";
				oModel.setProperty(sEtKey, oSignalData.Et || "");
			} else {
				// TRA: HBox1
				if (sPrefix === "1") {
					oModel.setProperty("/Fn", !!oSignalData.Pitr); // Diferencial -> Fn (binding intencional)
				} else {
					oModel.setProperty("/Diferencial2", !!oSignalData.Pitr);
				}
				oModel.setProperty("/DPO" + sPrefix, !!oSignalData.Pito);
				oModel.setProperty("/Impedancia" + sPrefix, !!oSignalData.Pit1);
				oModel.setProperty("/MaximaCorriente" + sPrefix, !!oSignalData.Pili);
				oModel.setProperty("/PFI" + sPrefix, !!oSignalData.Plus);
				oModel.setProperty("/U" + sPrefix, !!oSignalData.Less);
				oModel.setProperty("/MenorU" + sPrefix, !!oSignalData.Rr);
				oModel.setProperty("/R" + sPrefix, !!oSignalData.Fr);
				oModel.setProperty("/S" + sPrefix, !!oSignalData.Fs);
				oModel.setProperty("/T" + sPrefix, !!oSignalData.Ft);
				oModel.setProperty("/Tierra" + sPrefix, !!oSignalData.Fn);
				oModel.setProperty("/LocFalla" + sPrefix, oSignalData.Texto || "");
				// TRA: HBox1 usa Et (sin numero en vista), HBox2 usa Et2
				var sEtKey = sPrefix === "1" ? "/Et" : "/Et2";
				oModel.setProperty(sEtKey, oSignalData.Et || "");
			}
		},

		/**
		 * Edita una proteccion: carga los datos de la fila en el formulario.
		 * Soporta tanto _signalData (cargado desde OData) como _formData (creado localmente).
		 */
		onEditProteccion: function (oEvent) {
			var oView = this.getView();
			var oProteccionesModel = ModelHelper.getModel("NovedadesProtecciones", oView);

			if (this._iEditingProteccionIndex >= 0) {
				sap.m.MessageToast.show("Ya hay una proteccion en edicion. Guarde primero.");
				return;
			}

			var oItem = oEvent.getSource().getParent().getParent();
			var sPath = oItem.getBindingContextPath("NovedadesProtecciones");
			var iIndex = parseInt(sPath.split("/").pop(), 10);

			var aProtecciones = oProteccionesModel.getProperty("/Protecciones") || [];
			if (iIndex < 0 || iIndex >= aProtecciones.length) {
				return;
			}

			var oRow = aProtecciones[iIndex];
			var sEmpresa = ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety") || "100";

			if (oRow._signalData) {
				var sPrefix = (oRow._formData && oRow._formData.EtPrefix) || "1";
				this._mapODataToFormFields(oRow._signalData, sPrefix, sEmpresa);
			} else if (oRow._formData) {
				var oFormData = oRow._formData;
				var sEtKey = oFormData.EtKey || "Et1";
				oProteccionesModel.setProperty("/" + sEtKey, oFormData.Et || oRow.ET || "");

				Object.keys(oFormData).forEach(function (sKey) {
					if (sKey !== "Empresa" && sKey !== "EtPrefix" && sKey !== "EtKey" && sKey !== "Et") {
						oProteccionesModel.setProperty("/" + sKey, oFormData[sKey]);
					}
				});
			} else {
				sap.m.MessageToast.show("No se pueden recuperar los datos para editar");
				return;
			}

			// Guardar estado de edición (no se elimina la fila ni se hace DELETE)
			this._iEditingProteccionIndex = iIndex;
			this._oEditingProteccionSignalData = oRow._signalData || null;
			this._sEditingProteccionPrefix = (oRow._formData && oRow._formData.EtPrefix) || "1";
			this._sEditingProteccionEtKey = (oRow._formData && oRow._formData.EtKey) || "Et1";

			this._setProteccionButtonMode("save");
			this.addSignal = false;
					},

		/**
		 * Elimina una proteccion de la lista.
		 * En modo edicion con datos OData, hace DELETE al backend.
		 */
		onDeleteProteccion: function (oEvent) {
			var oView = this.getView();
			var oProteccionesModel = ModelHelper.getModel("NovedadesProtecciones", oView);

			var oItem = oEvent.getSource().getParent().getParent();
			var sPath = oItem.getBindingContextPath("NovedadesProtecciones");
			var iIndex = parseInt(sPath.split("/").pop(), 10);

			if (iIndex === this._iEditingProteccionIndex) {
				sap.m.MessageToast.show("No se puede eliminar una proteccion en edicion");
				return;
			}

			var aProtecciones = oProteccionesModel.getProperty("/Protecciones") || [];
			if (iIndex < 0 || iIndex >= aProtecciones.length) {
				return;
			}

			var oRow = aProtecciones[iIndex];
			var oEditModel = sap.ui.getCore().getModel("editModel") || oView.getModel("editModel");
			var bEdition = oEditModel ? oEditModel.getProperty("/editableMode") : false;

			var that = this;
			var fnRemoveLocal = function () {
				aProtecciones.splice(iIndex, 1);
				oProteccionesModel.setProperty("/Protecciones", aProtecciones);
				oProteccionesModel.refresh(true);
				// Ajustar índice de edición si se eliminó una fila anterior
				if (that._iEditingProteccionIndex >= 0 && iIndex < that._iEditingProteccionIndex) {
					that._iEditingProteccionIndex--;
				}
				sap.m.MessageToast.show("Proteccion eliminada");
			};

			if (bEdition && oRow._signalData && oRow._signalData.Id && oRow._signalData.Posicion) {
				sap.ui.core.BusyIndicator.show(0);
				ProteccionesService.remove(oRow._signalData)
					.then(function () {
						sap.ui.core.BusyIndicator.hide();
						fnRemoveLocal();
					})
					.catch(function (oError) {
						sap.ui.core.BusyIndicator.hide();
						sap.m.MessageBox.error("Error al eliminar la proteccion del servidor");
						Logger.error("Error al eliminar senializacion", oError);
					});
			} else {
				fnRemoveLocal();
			}
		},

		/**
		 * Mapea registros de SenialXNS_nav a items de la tabla Protecciones.
		 * Cada registro OData es independiente: solo usa campos primarios (Et, no Et2).
		 * Un registro = una fila en la tabla.
		 */
		_mapSignalsToProtecciones: function (aSignals) {
			var oView = this.getView();
			var oProteccionesModel = ModelHelper.getModel("NovedadesProtecciones", oView);
			var sEmpresa = ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety") || "100";
			var bIsTBA = sEmpresa === "300";

			var aProtecciones = [];

			aSignals.forEach(function (oSignal) {
				if (!oSignal.Et) {
					return;
				}

				var aProtNames = [];
				var aExcNames = [];

				if (bIsTBA) {
					if (oSignal.Pitr) aProtNames.push("T0");
					if (oSignal.Pit1) aProtNames.push("T1");
					if (oSignal.Li) aProtNames.push("LI");
					if (oSignal.Plus) aProtNames.push("U>");
					if (oSignal.Less) aProtNames.push("U");
					if (oSignal.Pili) aProtNames.push("PZ");
					if (oSignal.Pito) aProtNames.push("PD");
					if (oSignal.Rrpi) aProtNames.push("RRPI");
					if (oSignal.Bz) aProtNames.push("BZ");
					if (oSignal.Fn) aExcNames.push("FN");
					if (oSignal.Fr) aExcNames.push("FR");
					if (oSignal.Fs) aExcNames.push("FS");
					if (oSignal.Ft) aExcNames.push("FT");
					if (oSignal.Tx) aExcNames.push("TX");
					if (oSignal.Rx) aExcNames.push("RX");
					if (oSignal.T2) aExcNames.push("T2");
					if (oSignal.Ts2) aExcNames.push("TS2");
				} else {
					if (oSignal.Pitr) aProtNames.push("Diferencial");
					if (oSignal.Pito) aProtNames.push("DPO");
					if (oSignal.Pit1) aProtNames.push("Impedancia");
					if (oSignal.Pili) aProtNames.push("Máxima Corriente");
					if (oSignal.Plus) aProtNames.push("PFI");
					if (oSignal.Less) aProtNames.push("U>");
					if (oSignal.Rr) aProtNames.push("<U");
					if (oSignal.Fr) aExcNames.push("R");
					if (oSignal.Fs) aExcNames.push("S");
					if (oSignal.Ft) aExcNames.push("T");
					if (oSignal.Fn) aExcNames.push("Tierra");
				}

				aProtecciones.push({
					ET: oSignal.Et,
					LocFalla: oSignal.Texto || "",
					Km: oSignal.Km || "",
					ProteccionActuante: aProtNames.join(", "),
					Exitacion: aExcNames.join(", "),
					_signalData: oSignal
				});
			});

			if (!oProteccionesModel.getData()) {
				oProteccionesModel.setData({});
			}
			oProteccionesModel.setProperty("/Protecciones", aProtecciones);
		},

		// ========================================
		// Pruebas Realizadas
		// ========================================

		_getPruebasFormDefaults: function () {
			return {
				Terceros: false,
				PersonalTransener: false,
				HoraPrueba: null,
				Comentarios: "",
				Et: "",
				Diferencial: false,
				DPO: false,
				Impedancia: false,
				MaximaCorriente: false,
				PFI: false,
				U: false,
				MenorU: false,
				SinSenal: false,
				OtrasActuaciones: "",
				R: false,
				S: false,
				T: false,
				Tierra: false,
				SinExcitacion: false,
				LocFalla: "",
				InformoEmp: "",
				ComentariosAviso: ""
			};
		},

		_initPruebasFormModel: function (oView) {
			var oModel = ModelHelper.getModel("PruebasFormJsonModel", oView);
			oModel.setData(this._getPruebasFormDefaults());
		},

		_resetPruebasForm: function () {
			var oModel = ModelHelper.getModel("PruebasFormJsonModel", this.getView());
			oModel.setData(this._getPruebasFormDefaults());
		},

		_buildPruebaPayload: function (oFormData) {
			return {
				HoraPrueba: oFormData.HoraPrueba,
				SolicitoTercero: !!oFormData.Terceros,
				SolicitoTransener: !!oFormData.PersonalTransener,
				ET: oFormData.Et || "",
				InformoEmp: oFormData.InformoEmp || "",
				InformoComentarios: oFormData.ComentariosAviso || "",
				LocFalla: oFormData.LocFalla || "",
				OtrasActuaciones: oFormData.OtrasActuaciones || "",
				Comentarios: oFormData.Comentarios || "",
				Pitr: !!oFormData.Diferencial,
				Pito: !!oFormData.DPO,
				Pit: !!oFormData.Impedancia,
				Pili: !!oFormData.MaximaCorriente,
				RR: !!oFormData.PFI,
				Rrpi: !!oFormData.U,
				Rx: !!oFormData.MenorU,
				Li: !!oFormData.SinSenal,
				Fr: !!oFormData.R,
				FS: !!oFormData.S,
				Ft: !!oFormData.T,
				Fn: !!oFormData.Tierra,
				Tx: !!oFormData.SinExcitacion,
				Km: false,
				T2: false,
				Ts2: false
			};
		},

		/**
		 * Recolecta datos del formulario de pruebas, agrega a la tabla
		 * y en modo edicion hace POST individual.
		 */
		onAddPrueba: function () {
			var oView = this.getView();
			var oFormModel = ModelHelper.getModel("PruebasFormJsonModel", oView);
			var oListModel = ModelHelper.getModel("TestProtecciones", oView);
			var oFormData = oFormModel.getData();

			// Armar texto de solicitada por
			var aSolicitada = [];
			if (oFormData.Terceros) { aSolicitada.push("Terceros"); }
			if (oFormData.PersonalTransener) { aSolicitada.push("Personal de Transener"); }
			var sSolicitadaPor = aSolicitada.join(", ");

			// Armar texto de protecciones
			var aProtNames = [];
			if (oFormData.Diferencial) aProtNames.push("Diferencial");
			if (oFormData.DPO) aProtNames.push("DPO");
			if (oFormData.Impedancia) aProtNames.push("Impedancia");
			if (oFormData.MaximaCorriente) aProtNames.push("Maxima Corriente");
			if (oFormData.PFI) aProtNames.push("PFI");
			if (oFormData.U) aProtNames.push("U>");
			if (oFormData.MenorU) aProtNames.push("<U");
			if (oFormData.SinSenal) aProtNames.push("Sin senalizacion");
			if (oFormData.OtrasActuaciones) aProtNames.push(oFormData.OtrasActuaciones);

			// Armar texto de excitaciones
			var aExcNames = [];
			if (oFormData.R) aExcNames.push("R");
			if (oFormData.S) aExcNames.push("S");
			if (oFormData.T) aExcNames.push("T");
			if (oFormData.Tierra) aExcNames.push("Tierra");
			if (oFormData.SinExcitacion) aExcNames.push("Sin Excitacion");

			// Armar item para la tabla
			var aPruebas = oListModel.getProperty("/PruebasProtecciones") || [];

			var iMaxPos = 0;
			aPruebas.forEach(function (oExisting) {
				if (oExisting.Posicion) {
					var iPos = parseInt(oExisting.Posicion, 10);
					if (iPos > iMaxPos) { iMaxPos = iPos; }
				}
			});

			var oODataFields = this._buildPruebaPayload(oFormData);

			var oItem = {
				SolicitadaPor: sSolicitadaPor,
				HoraPrueba: oFormData.HoraPrueba,
				ET: oFormData.Et,
				Proteccion: aProtNames.join(", "),
				Excitacion: aExcNames.join(", "),
				Comentarios: oFormData.Comentarios,
				LocFalla: oFormData.LocFalla || "",
				InformoEmp: oFormData.InformoEmp || "",
				ComentariosAviso: oFormData.ComentariosAviso || "",
				Posicion: (iMaxPos + 1).toString(),
				_formData: jQuery.extend({}, oFormData)
			};
			jQuery.extend(oItem, oODataFields);

			var bIsEditing = this._iEditingPruebaIndex >= 0;
			var sIdNovedad = this._sIdNovedad || ModelHelper.getModel("NovedadesFormJsonModel", oView).getProperty("/IdNovedad") || "";
			var sEmpresa = this._sEmpresa || ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety") || "";

			if (bIsEditing) {
				// Preservar Posicion original
				var oOldRow = this._oEditingPruebaRow;
				oItem.Posicion = aPruebas[this._iEditingPruebaIndex].Posicion;

				// Actualizar in-place
				aPruebas[this._iEditingPruebaIndex] = oItem;
				oListModel.setProperty("/PruebasProtecciones", aPruebas);
				oListModel.refresh(true);

				if (sIdNovedad && oOldRow && oOldRow.Posicion) {
					// DELETE viejo + POST nuevo
					PruebasService.remove({ Empresa: sEmpresa, Posicion: oOldRow.Posicion, IdNovedad: sIdNovedad })
						.then(function () {
							var oPayload = jQuery.extend({}, oODataFields);
							oPayload.Posicion = oItem.Posicion;
							return PruebasService.IndividualPOSTEdition(oPayload, sIdNovedad, sEmpresa);
						})
						.then(function () {
													})
						.catch(function (oError) {
							sap.m.MessageBox.error("Error al actualizar la prueba en el servidor");
							Logger.error("Error en actualizar prueba", oError);
						});
				} else if (sIdNovedad) {
					var oPayload = jQuery.extend({}, oODataFields);
					oPayload.Posicion = oItem.Posicion;
					PruebasService.IndividualPOSTEdition(oPayload, sIdNovedad, sEmpresa)
						.then(function () {
													})
						.catch(function (oError) {
							sap.m.MessageBox.error("Error al guardar la prueba en el servidor");
							Logger.error("Error en PruebasService.IndividualPOSTEdition", oError);
						});
				} else {
									}

				// Resetear estado de edición
				this._iEditingPruebaIndex = -1;
				this._oEditingPruebaRow = null;
				this._setPruebaButtonMode("add");
			} else {
				// Modo agregar: comportamiento original
				aPruebas.push(oItem);
				oListModel.setProperty("/PruebasProtecciones", aPruebas);
				oListModel.refresh(true);

				if (sIdNovedad) {
					var oPayload = jQuery.extend({}, oODataFields);
					oPayload.Posicion = oItem.Posicion;
					PruebasService.IndividualPOSTEdition(oPayload, sIdNovedad, sEmpresa)
						.then(function () {
													})
						.catch(function (oError) {
							sap.m.MessageBox.error("Error al guardar la prueba en el servidor");
							Logger.error("Error en PruebasService.IndividualPOSTEdition", oError);
						});
				} else {
					sap.m.MessageToast.show("Prueba agregada a la lista");
				}
			}

			this._resetPruebasForm();
		},

		/**
		 * Carga una prueba de la tabla al formulario para edicion.
		 */
		onEditPrueba: function (oEvent) {
			var oView = this.getView();
			var oListModel = ModelHelper.getModel("TestProtecciones", oView);

			if (this._iEditingPruebaIndex >= 0) {
				sap.m.MessageToast.show("Ya hay una prueba en edicion. Guarde primero.");
				return;
			}

			var oItem = oEvent.getSource().getParent().getParent();
			var sPath = oItem.getBindingContextPath("TestProtecciones");
			var iIndex = parseInt(sPath.split("/").pop(), 10);

			var aPruebas = oListModel.getProperty("/PruebasProtecciones") || [];
			if (iIndex < 0 || iIndex >= aPruebas.length) { return; }

			var oRow = aPruebas[iIndex];

			if (oRow._formData) {
				ModelHelper.getModel("PruebasFormJsonModel", oView).setData(jQuery.extend({}, oRow._formData));
			} else {
				var oFormModel = ModelHelper.getModel("PruebasFormJsonModel", oView);
				oFormModel.setData(this._getPruebasFormDefaults());
				oFormModel.setProperty("/HoraPrueba", oRow.HoraPrueba || null);
				oFormModel.setProperty("/Comentarios", oRow.Comentarios || "");
				oFormModel.setProperty("/Terceros", !!oRow.SolicitoTercero);
				oFormModel.setProperty("/PersonalTransener", !!oRow.SolicitoTransener);
				oFormModel.setProperty("/Et", oRow.ET || "");
				oFormModel.setProperty("/InformoEmp", oRow.InformoEmp || "");
				oFormModel.setProperty("/ComentariosAviso", oRow.InformoComentarios || "");
				oFormModel.setProperty("/LocFalla", oRow.LocFalla || "");
				oFormModel.setProperty("/OtrasActuaciones", oRow.OtrasActuaciones || "");
				oFormModel.setProperty("/Diferencial", !!oRow.Pitr);
				oFormModel.setProperty("/DPO", !!oRow.Pito);
				oFormModel.setProperty("/Impedancia", !!oRow.Pit);
				oFormModel.setProperty("/MaximaCorriente", !!oRow.Pili);
				oFormModel.setProperty("/PFI", !!oRow.RR);
				oFormModel.setProperty("/U", !!oRow.Rrpi);
				oFormModel.setProperty("/MenorU", !!oRow.Rx);
				oFormModel.setProperty("/SinSenal", !!oRow.Li);
				oFormModel.setProperty("/R", !!oRow.Fr);
				oFormModel.setProperty("/S", !!oRow.FS);
				oFormModel.setProperty("/T", !!oRow.Ft);
				oFormModel.setProperty("/Tierra", !!oRow.Fn);
				oFormModel.setProperty("/SinExcitacion", !!oRow.Tx);
			}

			// Guardar estado de edición (no se elimina la fila ni se hace DELETE)
			this._iEditingPruebaIndex = iIndex;
			this._oEditingPruebaRow = jQuery.extend({}, oRow);

			this._setPruebaButtonMode("save");
					},

		/**
		 * Elimina una prueba de la tabla. Si persistida, DELETE al backend.
		 */
		onDeletePrueba: function (oEvent) {
			var oView = this.getView();
			var oListModel = ModelHelper.getModel("TestProtecciones", oView);

			var oItem = oEvent.getSource().getParent().getParent();
			var sPath = oItem.getBindingContextPath("TestProtecciones");
			var iIndex = parseInt(sPath.split("/").pop(), 10);

			if (iIndex === this._iEditingPruebaIndex) {
				sap.m.MessageToast.show("No se puede eliminar una prueba en edicion");
				return;
			}

			var aPruebas = oListModel.getProperty("/PruebasProtecciones") || [];
			if (iIndex < 0 || iIndex >= aPruebas.length) { return; }

			var oRow = aPruebas[iIndex];
			var sIdNovedad = this._sIdNovedad || "";

			var that = this;
			var fnRemoveLocal = function () {
				aPruebas.splice(iIndex, 1);
				oListModel.setProperty("/PruebasProtecciones", aPruebas);
				oListModel.refresh(true);
				if (that._iEditingPruebaIndex >= 0 && iIndex < that._iEditingPruebaIndex) {
					that._iEditingPruebaIndex--;
				}
				sap.m.MessageToast.show("Prueba eliminada");
			};

			if (sIdNovedad && oRow.Posicion) {
				var sEmpresa = this._sEmpresa || "";
				sap.ui.core.BusyIndicator.show(0);
				PruebasService.remove({ Empresa: sEmpresa, Posicion: oRow.Posicion, IdNovedad: sIdNovedad })
					.then(function () {
						sap.ui.core.BusyIndicator.hide();
						fnRemoveLocal();
					})
					.catch(function (oError) {
						sap.ui.core.BusyIndicator.hide();
						sap.m.MessageBox.error("Error al eliminar la prueba del servidor");
						Logger.error("Error al eliminar prueba", oError);
					});
			} else {
				fnRemoveLocal();
			}
		},

		// ==================== ENS ====================

		millisToMinutes: function (millis) {
			return millis / 60000;
		},

		onAddENS: function () {
			var novedad = ModelHelper.getModel("NovedadesFormJsonModel", this.getView()).getData();
			var dInicioNovedad = novedad.InicioNove;
			var IdNovedad = novedad.IdNovedad;
			var oENSListModel = ModelHelper.getModel("ENSListJsonModel", this.getView());
			var oENS = {
				Modif: "",
				Potencia: "0",
				Reptime: null,
				Begtime: null,
				Corte: "0",
				ENSRow: "0",
				Comments: ""
			};
			if (IdNovedad) {
				oENS.IdNovedad = IdNovedad;
			}
			oENS.Begtime = dInicioNovedad;
			var aENSListData = oENSListModel.getData().ENSRegisters;
			aENSListData.push(oENS);
			oENSListModel.refresh(true);
		},

		onDeleteENS: function (evt) {
			var that = this;
			var oView = this.getView();
			var ens = evt.getSource().getBindingContext("ENSListJsonModel").getObject();
			var fnRemoveLocal = function () {
				var ensList = ModelHelper.getModel("ENSListJsonModel", oView).getData().ENSRegisters;
				for (var row in ensList) {
					if (ensList[row] === ens) {
						ensList.splice(row, 1);
						break;
					}
				}
				ModelHelper.getModel("ENSListJsonModel", oView).updateBindings(true);
				that.calculateAutomaticENS();
			};

			if (ens.Modif) {
				var empresa = ens.Empresa || this._sEmpresa || "";
				var entity = "/ENSRegisterSet(IdNovedad='" + ens.IdNovedad + "',Modif='" + ens.Modif + "',Empresa='" + empresa + "')";
				sap.ui.core.BusyIndicator.show(0);
				oDataServices.getModel("").remove(entity, {
					success: function () {
						sap.ui.core.BusyIndicator.hide();
						fnRemoveLocal();
						sap.m.MessageBox.alert("Se ha borrado correctamente", {
							title: "Borrado Exitoso"
						});
					},
					error: function () {
						sap.ui.core.BusyIndicator.hide();
						sap.m.MessageBox.alert("Ha fallado el borrado del ENS", {
							title: "Borrado fallido"
						});
					}
				});
			} else {
				fnRemoveLocal();
			}
		},

		calcRowCorte: function (oEvent) {
			var oView = this.getView();
			var ENSListModel = ModelHelper.getModel("ENSListJsonModel", oView);
			var sPath = oEvent.getSource().getBindingContext("ENSListJsonModel").getPath();
			var data = ENSListModel.getProperty(sPath);
			var dReposicion = data.Reptime;
			var dInicioNovedadDate = data.Begtime;
			if (dReposicion && dInicioNovedadDate && dReposicion > dInicioNovedadDate) {
				var iMilliSeconds = dReposicion.getTime() - dInicioNovedadDate.getTime();
				var iTotal = this.millisToMinutes(iMilliSeconds);
				ENSListModel.setProperty(sPath + "/Corte", iTotal.toString());
				this.calculateAutomaticENS();
			}
		},

		calculateAutomaticENS: function () {
			var oView = this.getView();
			var ENSListModel = ModelHelper.getModel("ENSListJsonModel", oView);
			var iENS = 0;
			var iTotalMinutes = 0;
			var aENS = ENSListModel.getData().ENSRegisters;
			for (var i = 0; i < aENS.length; i++) {
				var iRowPotencia = this._parseLocalNumber(aENS[i].Potencia);
				var iCorte = parseFloat(aENS[i].Corte);
				if (iRowPotencia && !isNaN(iCorte)) {
					var rowEns = (iRowPotencia * iCorte) / 60;
					aENS[i].ENSRow = rowEns;
					iENS = iENS + rowEns;
				}
				if (!isNaN(iCorte)) {
					iTotalMinutes = iTotalMinutes + iCorte;
				}
			}
			ENSListModel.updateBindings(true);
			var oFormModel = ModelHelper.getModel("NovedadesFormJsonModel", oView);
			oFormModel.setProperty("/Ensval", iENS.toString().substring(0, 10));
			oFormModel.setProperty("/TiempoTotalMin", iTotalMinutes.toString());
			this.calcPotencia();
		},

		_parseLocalNumber: function (sValue) {
			if (!sValue && sValue !== 0) { return 0; }
			var s = sValue.toString();
			// Si tiene punto pero no coma -> formato backend (punto = decimal)
			// Ej: "4444.00000" -> parseFloat directo
			if (s.indexOf(".") !== -1 && s.indexOf(",") === -1) {
				var fVal = parseFloat(s);
				return isNaN(fVal) ? 0 : fVal;
			}
			// Formato local: puntos = miles, coma = decimal
			// Ej: "4.444,5" -> "4444.5"
			var sClean = s.replace(/\./g, "").replace(",", ".");
			var fResult = parseFloat(sClean);
			return isNaN(fResult) ? 0 : fResult;
		},

		onPotenciaLiveChange: function (oEvent) {
			if (this._bPotenciaFormatting) { return; }

			var oInput = oEvent.getSource();
			var sValue = oEvent.getParameter("value");
			// Quitar todo menos digitos y coma
			var sClean = sValue.replace(/[^0-9,]/g, "");
			// Una sola coma
			var aParts = sClean.split(",");
			if (aParts.length > 2) {
				sClean = aParts[0] + "," + aParts[1];
				aParts = sClean.split(",");
			}
			// Agregar puntos de miles a la parte entera
			var sEntero = aParts[0];
			var sFormatted = sEntero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
			if (aParts.length > 1) {
				sFormatted = sFormatted + "," + aParts[1];
			}
			// Valor para modelo: sin puntos, con coma decimal
			var sModelValue = sClean;

			// Guardar en modelo
			var sPath = oInput.getBindingContext("ENSListJsonModel").getPath();
			ModelHelper.getModel("ENSListJsonModel", this.getView()).setProperty(sPath + "/Potencia", sModelValue);

			// Setear valor visual con delay para que UI5 no lo pise
			var that = this;
			that._bPotenciaFormatting = true;
			setTimeout(function () {
				oInput.setValue(sFormatted);
				// Posicionar cursor al final
				var oDomRef = oInput.getFocusDomRef();
				if (oDomRef) {
					oDomRef.setSelectionRange(sFormatted.length, sFormatted.length);
				}
				that._bPotenciaFormatting = false;
			}, 0);
		},

		calcPotencia: function () {
			var oView = this.getView();
			var iPotenciaCortada = 0;
			var aENS = ModelHelper.getModel("ENSListJsonModel", oView).getData().ENSRegisters;
			for (var i = 0; i < aENS.length; i++) {
				var iRowPotencia = this._parseLocalNumber(aENS[i].Potencia);
				iPotenciaCortada = iPotenciaCortada + iRowPotencia;
			}
			ModelHelper.getModel("NovedadesFormJsonModel", oView).setProperty("/Potenafect", iPotenciaCortada.toString());
		},

		_onAfterSaveSuccess: function (oNovedadData) {
			var oView = this.getView();
			var that = this;
			var sIdNovedad = oNovedadData.IdNovedad || ModelHelper.getModel("NovedadesFormJsonModel", oView).getData().IdNovedad;
			var sEmpresa = this._sEmpresa || ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety") || "";
			var oModel = oDataServices.getModel("");
			var aPromises = [];

			// Guardar InformaCammesa
			var oCammesaData = ModelHelper.getModel("CammesaFormJsonModel", oView).getData();
			if (oCammesaData) {
				aPromises.push(CammesaService.postCammesa(oCammesaData, sIdNovedad, sEmpresa));
			}

			// Guardar Normalización
			var oNormData = ModelHelper.getModel("NormalizacionNS", oView).getData();
			if (oNormData) {
				var bNormExists = !!this._bNormalizacionExists;
				aPromises.push(NormalizacionService.saveNormalizacion(oNormData, sIdNovedad, sEmpresa, bNormExists));
			}

			// Guardar ENS
			var aENS = ModelHelper.getModel("ENSListJsonModel", oView).getData().ENSRegisters;
			if (aENS && aENS.length > 0) {
				Logger.info("_onAfterSaveSuccess: Guardando " + aENS.length + " ENS. IdNovedad=" + sIdNovedad + ", Empresa=" + sEmpresa);

				for (var i = 0; i < aENS.length; i++) {
					var oENS = aENS[i];

					Logger.info("ENS[" + i + "]: Modif='" + oENS.Modif + "', Potencia=" + oENS.Potencia + ", Corte=" + oENS.Corte);

					var oPayload = {
						IdNovedad: sIdNovedad,
						Modif: oENS.Modif || "",
						Potencia: String(that._parseLocalNumber(oENS.Potencia)),
						Begtime: oENS.Begtime || null,
						Reptime: oENS.Reptime || null,
						Corte: String(parseFloat(oENS.Corte) || 0),
						Comments: oENS.Comments || "",
						Empresa: sEmpresa
					};

					if (oENS.Modif) {
						// Existente -> UPDATE
						Logger.info("ENS[" + i + "]: UPDATE path=/ENSRegisterSet(IdNovedad='" + sIdNovedad + "',Modif='" + oENS.Modif + "',Empresa='" + sEmpresa + "')");
						var sPath = "/ENSRegisterSet(IdNovedad='" + sIdNovedad + "',Modif='" + oENS.Modif + "',Empresa='" + sEmpresa + "')";
						aPromises.push(this._updateENS(oModel, sPath, oPayload));
					} else {
						// Nuevo -> CREATE
						Logger.info("ENS[" + i + "]: CREATE nuevo registro");
						aPromises.push(this._createENS(oModel, oPayload));
					}
				}
			}

			if (aPromises.length === 0) {
				return Promise.resolve();
			}

			return Promise.all(aPromises).then(function () {
				Logger.info("Registros secundarios guardados correctamente");
			}).catch(function (err) {
				Logger.error("Error guardando registros secundarios", err);
				sap.m.MessageBox.warning("La novedad se guardó pero hubo errores al guardar algunos registros.");
			});
		},

		_createENS: function (oModel, oPayload) {
			return new Promise(function (resolve, reject) {
				oModel.create("/ENSRegisterSet", oPayload, {
					success: function (oData) {
						resolve(oData);
					},
					error: function (oError) {
						reject(oError);
					}
				});
			});
		},

		_updateENS: function (oModel, sPath, oPayload) {
			return new Promise(function (resolve, reject) {
				oModel.update(sPath, oPayload, {
					success: function () {
						resolve();
					},
					error: function (oError) {
						reject(oError);
					}
				});
			});
		},

		_applyPerturbacionesFlags: function (oData) {
			var oView = this.getView();
			var oFormModel = ModelHelper.getModel("formPerturbacionesModel", oView);
			var formPerturbaciones = oFormModel.getData() || {};

			formPerturbaciones.chkRecDeseng = false;
			formPerturbaciones.chkRecierre = false;
			formPerturbaciones.chkDeseng = false;
			formPerturbaciones.chkEmergencia = false;

			if (oData.CodNovedad === "P" && oData.Recierre && oData.GenIndisponibilidad) {
				formPerturbaciones.chkRecDeseng = true;
			} else if (oData.CodNovedad === "P" && oData.Recierre) {
				formPerturbaciones.chkRecierre = true;
			} else if (oData.CodNovedad === "P" && oData.GenIndisponibilidad) {
				formPerturbaciones.chkDeseng = true;
			} else if (oData.CodNovedad === "D" && oData.GenIndisponibilidad && oData.Forzada) {
				formPerturbaciones.chkEmergencia = true;
			}

			oFormModel.setData(formPerturbaciones);
		}
	});
});