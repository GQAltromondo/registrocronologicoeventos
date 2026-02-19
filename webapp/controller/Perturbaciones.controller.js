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

			ModelHelper.getModel("ConsequentListJsonModel", this.getView());
			
			// Inicializar modelo de protecciones
			const oView = this.getView();
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
					// Campos TBA (empresa 300) - Protecciones
					TBA_Flecha1: false, TBA_T01: false, TBA_T11: false, TBA_LI1: false,
					TBA_DAG1: false, TBA_UMayor1: false, TBA_U1: false,
					TBA_PDPZ1: false, TBA_PZ1: false, TBA_PD1: false, TBA_LI2_1: false,
					TBA_PFI1: false, TBA_DISC1: false, TBA_SIN1: false, TBA_BZ1: false,
					TBA_OtrasActuaciones1: "",
					// Campos TBA (empresa 300) - Excitaciones
					TBA_FN1: false, TBA_FR1: false, TBA_FS1: false, TBA_FT1: false,
					TBA_TX1: false, TBA_RX1: false, TBA_TS21: false, TBA_SINEx1: false
				});
			}
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
			
			// Crear objeto para la tabla guardando datos completos para editar después
			const createProteccionItem = function(oProt, sPrefix, sEtKey) {
				if (!oProt.Et) {
					return null;
				}
				
				// Snapshot de todos los campos del modelo para restaurar al editar
				var oFormData = { Empresa: sEmpresa, EtPrefix: sPrefix, EtKey: sEtKey || ("Et" + sPrefix) };
				var oModelData = oProteccionesModel.getData();
				var sFieldPrefix = bIsTBA ? "TBA_" : "";
				
				// Guardar todos los campos con el sufijo correspondiente
				Object.keys(oModelData).forEach(function(sKey) {
					if (sKey.endsWith(sPrefix) && sKey !== "Et" + sPrefix && sKey !== "Protecciones") {
						oFormData[sKey] = oModelData[sKey];
					}
				});
				// Guardar también el Et
				oFormData["Et"] = oProt.Et;
				
				return {
					ET: oProt.Et,
					LocFalla: oProt.LocFalla || "",
					Km: oProt.Km || "",
					ProteccionActuante: oProt.Protecciones.join(", ") || "",
					Exitacion: oProt.Excitaciones.join(", ") || "",
					_formData: oFormData
				};
			};
			
			var iAdded = 0;
			
			if (bIsTBA) {
				// Empresa 300: un solo HBox, usa Et2 y campos TBA_ con sufijo 1
				const oProteccionTBA = collectProteccionData("1", "Et2");
				if (oProteccionTBA.Et) {
					const oItem = createProteccionItem(oProteccionTBA, "1", "Et2");
					if (oItem) {
						aProtecciones.push(oItem);
						iAdded++;
						this._resetProteccionFields("1", true);
					}
				}
			} else {
				// Empresa 100: dos HBox
				const oProteccion1 = collectProteccionData("1");
				const oProteccion2 = collectProteccionData("2");
				
				if (oProteccion1.Et) {
					const oItem1 = createProteccionItem(oProteccion1, "1");
					if (oItem1) {
						aProtecciones.push(oItem1);
						iAdded++;
						this._resetProteccionFields("1", false);
					}
				}
				
				if (oProteccion2.Et) {
					const oItem2 = createProteccionItem(oProteccion2, "2");
					if (oItem2) {
						aProtecciones.push(oItem2);
						iAdded++;
						this._resetProteccionFields("2", false);
					}
				}
			}
			
			// Actualizar el modelo
			oProteccionesModel.setProperty("/Protecciones", aProtecciones);
			oProteccionesModel.updateBindings();
			
			if (iAdded > 0) {
				sap.m.MessageToast.show("Se agregó " + iAdded + " protección(es) a la lista");
			} else {
				sap.m.MessageBox.warning("Debe seleccionar al menos una ET para agregar protecciones");
			}
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
					"TBA_PDPZ", "TBA_PZ", "TBA_PD", "TBA_LI2_", "TBA_PFI", "TBA_DISC", "TBA_SIN", "TBA_BZ"];
				var aTBAExcFields = ["TBA_FN", "TBA_FR", "TBA_FS", "TBA_FT", "TBA_TX", "TBA_RX", "TBA_TS2", "TBA_SINEx"];
				
				aTBAProtFields.forEach(function(sField) {
					oModel.setProperty("/" + sField + sPrefix, false);
				});
				aTBAExcFields.forEach(function(sField) {
					oModel.setProperty("/" + sField + sPrefix, false);
				});
				oModel.setProperty("/TBA_OtrasActuaciones" + sPrefix, "");
				oModel.setProperty("/Km" + sPrefix, "");
			} else {
				// Campos TRA (empresa 100)
				var aProtFields = ["Diferencial", "DPO", "Impedancia", "MaximaCorriente", "PFI", "U", "SinSenal"];
				var aExcFields = ["R", "S", "T", "Tierra", "SinExcitacion"];
				
				aProtFields.forEach(function(sField) {
					oModel.setProperty("/" + sField + sPrefix, false);
				});
				aExcFields.forEach(function(sField) {
					oModel.setProperty("/" + sField + sPrefix, false);
				});
				oModel.setProperty("/OtrasActuaciones" + sPrefix, "");
				oModel.setProperty("/LocFalla" + sPrefix, "");
			}
		},
		
		/**
		 * Edita una protección: carga los datos de la fila en el formulario y la elimina de la lista
		 */
		onEditProteccion: function (oEvent) {
			const oView = this.getView();
			const oProteccionesModel = ModelHelper.getModel("NovedadesProtecciones", oView);
			
			// Obtener el índice de la fila
			const oItem = oEvent.getSource().getParent().getParent();
			const sPath = oItem.getBindingContextPath("NovedadesProtecciones");
			const iIndex = parseInt(sPath.split("/").pop(), 10);
			
			const aProtecciones = oProteccionesModel.getProperty("/Protecciones") || [];
			if (iIndex < 0 || iIndex >= aProtecciones.length) {
				return;
			}
			
			const oRow = aProtecciones[iIndex];
			const oFormData = oRow._formData;
			
			if (!oFormData) {
				sap.m.MessageToast.show("No se pueden recuperar los datos para editar");
				return;
			}
			
			// Restaurar el ET en la key correcta
			var sEtKey = oFormData.EtKey || "Et1";
			oProteccionesModel.setProperty("/" + sEtKey, oFormData.Et || oRow.ET || "");
			
			// Restaurar todos los campos guardados en _formData
			var sPrefix = oFormData.EtPrefix || "1";
			Object.keys(oFormData).forEach(function(sKey) {
				if (sKey !== "Empresa" && sKey !== "EtPrefix" && sKey !== "EtKey" && sKey !== "Et") {
					oProteccionesModel.setProperty("/" + sKey, oFormData[sKey]);
				}
			});
			
			// Eliminar la fila de la lista
			aProtecciones.splice(iIndex, 1);
			oProteccionesModel.setProperty("/Protecciones", aProtecciones);
			oProteccionesModel.refresh(true);
			
			sap.m.MessageToast.show("Protección cargada para edición");
		},
		
		/**
		 * Elimina una protección de la lista
		 */
		onDeleteProteccion: function (oEvent) {
			const oView = this.getView();
			const oProteccionesModel = ModelHelper.getModel("NovedadesProtecciones", oView);
			
			// Obtener el índice de la fila
			const oItem = oEvent.getSource().getParent().getParent();
			const sPath = oItem.getBindingContextPath("NovedadesProtecciones");
			const iIndex = parseInt(sPath.split("/").pop(), 10);
			
			const aProtecciones = oProteccionesModel.getProperty("/Protecciones") || [];
			if (iIndex < 0 || iIndex >= aProtecciones.length) {
				return;
			}
			
			aProtecciones.splice(iIndex, 1);
			oProteccionesModel.setProperty("/Protecciones", aProtecciones);
			oProteccionesModel.refresh(true);
			
			sap.m.MessageToast.show("Protección eliminada");
		}
	});
});