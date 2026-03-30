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
	"transener/registrocronologicoeventos/utils/Logger"
], function (BaseController, formatter, ModelHelper, Constants, EquiposService, CausasService, ProteccionesService, NovedadesService, PruebasService, Logger) {
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
			}

			this.addSignal = true;

			// Guardar referencia de la novedad para saber si esta persistida
			this._sIdNovedad = (sIdNovedad && sIdNovedad !== "new") ? sIdNovedad : "";
			this._sEmpresa = sEmpresa || "";

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
					}

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

					// InformeCammesaSet
					if (oData.InformeCammesaSet && oData.InformeCammesaSet.results && oData.InformeCammesaSet.results.length > 0) {
						var oCammesa = oData.InformeCammesaSet.results[0];
						oCammesa.Autoriza = oCammesa.Autoriza === "S";
						oCammesa.InformaCammesa = oCammesa.InformaCammesa === "S";
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
		
		/**
		 * Agrega las protecciones de los HBox a la lista
		 */
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

			var iAdded = 0;
			var aNewItems = [];

			if (bIsTBA) {
				// Empresa 300: dos HBox - HBox1 usa Et2/sufijo 1, HBox2 usa Et1/sufijo 2
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
				// Empresa 100: HBox1 usa Et (sin numero en vista)/sufijo 1, HBox2 usa Et2/sufijo 2
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

			// Actualizar el modelo
			oProteccionesModel.setProperty("/Protecciones", aProtecciones);
			oProteccionesModel.updateBindings();

			if (iAdded > 0) {
				// Usar el IdNovedad guardado de la ruta (fiable, no depende de timing asincrono)
				var sIdNovedad = that._sIdNovedad || ModelHelper.getModel("NovedadesFormJsonModel", oView).getProperty("/IdNovedad") || "";
				var sEmpresaPost = that._sEmpresa || ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety") || "";

				// Novedad persistida -> POST individual al backend
				if (sIdNovedad) {
					aNewItems.forEach(function (oNewItem) {
						var oPayload = jQuery.extend({}, oNewItem._signalData);
						ProteccionesService.IndividualPOSTEdition(oPayload, sIdNovedad, sEmpresaPost)
							.then(function () {
								sap.m.MessageToast.show("Proteccion guardada en el servidor");
							})
							.catch(function (oError) {
								sap.m.MessageBox.error("Error al guardar la proteccion en el servidor");
								Logger.error("Error en IndividualPOSTEdition", oError);
							});
					});
				} else {
					// Novedad no persistida -> solo local, se guarda al persistir la novedad
					sap.m.MessageToast.show("Se agrego " + iAdded + " proteccion(es) a la lista");
				}
			} else {
				sap.m.MessageBox.warning("Debe seleccionar al menos una ET para agregar protecciones");
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
				// Datos desde OData: usar mapeo inverso
				var sPrefix = (oRow._formData && oRow._formData.EtPrefix) || "1";
				this._mapODataToFormFields(oRow._signalData, sPrefix, sEmpresa);
			} else if (oRow._formData) {
				// Datos creados localmente: restaurar desde _formData
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

			// En modo edicion, si tiene datos OData, hacer DELETE para re-crear al agregar
			var oEditModel = sap.ui.getCore().getModel("editModel") || oView.getModel("editModel");
			var bEdition = oEditModel ? oEditModel.getProperty("/editableMode") : false;

			if (bEdition && oRow._signalData && oRow._signalData.Id && oRow._signalData.Posicion) {
				ProteccionesService.remove(oRow._signalData)
					.then(function () {
						Logger.info("Senializacion eliminada para re-edicion", { posicion: oRow._signalData.Posicion });
					})
					.catch(function (oError) {
						Logger.error("Error al eliminar senializacion para edicion", oError);
					});
			}

			// Eliminar la fila de la lista
			aProtecciones.splice(iIndex, 1);
			oProteccionesModel.setProperty("/Protecciones", aProtecciones);
			oProteccionesModel.refresh(true);

			this.addSignal = false;
			sap.m.MessageToast.show("Proteccion cargada para edicion");
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

			var aProtecciones = oProteccionesModel.getProperty("/Protecciones") || [];
			if (iIndex < 0 || iIndex >= aProtecciones.length) {
				return;
			}

			var oRow = aProtecciones[iIndex];
			var oEditModel = sap.ui.getCore().getModel("editModel") || oView.getModel("editModel");
			var bEdition = oEditModel ? oEditModel.getProperty("/editableMode") : false;

			var fnRemoveLocal = function () {
				aProtecciones.splice(iIndex, 1);
				oProteccionesModel.setProperty("/Protecciones", aProtecciones);
				oProteccionesModel.refresh(true);
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

			aPruebas.push(oItem);
			oListModel.setProperty("/PruebasProtecciones", aPruebas);
			oListModel.refresh(true);

			// POST si novedad persistida
			var sIdNovedad = this._sIdNovedad || ModelHelper.getModel("NovedadesFormJsonModel", oView).getProperty("/IdNovedad") || "";
			var sEmpresa = this._sEmpresa || ModelHelper.getModel("Empresa", oView).getProperty("/selectedSociety") || "";

			if (sIdNovedad) {
				var oPayload = {
					HoraPrueba: oFormData.HoraPrueba,
					Comentarios: oFormData.Comentarios || "",
					Posicion: oItem.Posicion
				};
				PruebasService.IndividualPOSTEdition(oPayload, sIdNovedad, sEmpresa)
					.then(function () {
						sap.m.MessageToast.show("Prueba guardada en el servidor");
					})
					.catch(function (oError) {
						sap.m.MessageBox.error("Error al guardar la prueba en el servidor");
						Logger.error("Error en PruebasService.IndividualPOSTEdition", oError);
					});
			} else {
				sap.m.MessageToast.show("Prueba agregada a la lista");
			}

			this._resetPruebasForm();
		},

		/**
		 * Carga una prueba de la tabla al formulario para edicion.
		 */
		onEditPrueba: function (oEvent) {
			var oView = this.getView();
			var oListModel = ModelHelper.getModel("TestProtecciones", oView);

			var oItem = oEvent.getSource().getParent().getParent();
			var sPath = oItem.getBindingContextPath("TestProtecciones");
			var iIndex = parseInt(sPath.split("/").pop(), 10);

			var aPruebas = oListModel.getProperty("/PruebasProtecciones") || [];
			if (iIndex < 0 || iIndex >= aPruebas.length) { return; }

			var oRow = aPruebas[iIndex];

			// Restaurar formulario desde _formData si existe
			if (oRow._formData) {
				ModelHelper.getModel("PruebasFormJsonModel", oView).setData(jQuery.extend({}, oRow._formData));
			} else {
				// Datos desde OData, restaurar lo que se pueda
				var oFormModel = ModelHelper.getModel("PruebasFormJsonModel", oView);
				oFormModel.setData(this._getPruebasFormDefaults());
				oFormModel.setProperty("/HoraPrueba", oRow.HoraPrueba || null);
				oFormModel.setProperty("/Comentarios", oRow.Comentarios || "");
			}

			// Si persistida, DELETE para re-crear
			var sIdNovedad = this._sIdNovedad || "";
			if (sIdNovedad && oRow.Posicion) {
				var sEmpresa = this._sEmpresa || "";
				PruebasService.remove({ Empresa: sEmpresa, Posicion: oRow.Posicion, IdNovedad: sIdNovedad })
					.then(function () {
						Logger.info("Prueba eliminada para re-edicion", { posicion: oRow.Posicion });
					})
					.catch(function (oError) {
						Logger.error("Error al eliminar prueba para edicion", oError);
					});
			}

			aPruebas.splice(iIndex, 1);
			oListModel.setProperty("/PruebasProtecciones", aPruebas);
			oListModel.refresh(true);
			sap.m.MessageToast.show("Prueba cargada para edicion");
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

			var aPruebas = oListModel.getProperty("/PruebasProtecciones") || [];
			if (iIndex < 0 || iIndex >= aPruebas.length) { return; }

			var oRow = aPruebas[iIndex];
			var sIdNovedad = this._sIdNovedad || "";

			var fnRemoveLocal = function () {
				aPruebas.splice(iIndex, 1);
				oListModel.setProperty("/PruebasProtecciones", aPruebas);
				oListModel.refresh(true);
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
		}
	});
});