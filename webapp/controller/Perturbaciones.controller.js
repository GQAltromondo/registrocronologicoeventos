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
			
			// Función helper para recolectar datos de un HBox de protecciones desde el modelo
			const collectProteccionData = function (sPrefix) {
				const oData = {
					Et: oProteccionesModel.getProperty("/Et" + sPrefix) || "",
					Protecciones: [],
					Excitaciones: [],
					OtrasActuaciones: oProteccionesModel.getProperty("/OtrasActuaciones" + sPrefix) || "",
					LocFalla: oProteccionesModel.getProperty("/LocFalla" + sPrefix) || ""
				};
				
				// Recolectar protecciones actuantes seleccionadas desde el modelo
				const aProteccionesActuantes = [
					{ modelKey: "Diferencial" + sPrefix, text: "Diferencial" },
					{ modelKey: "DPO" + sPrefix, text: "DPO" },
					{ modelKey: "Impedancia" + sPrefix, text: "Impedancia" },
					{ modelKey: "MaximaCorriente" + sPrefix, text: "Máxima Corriente" },
					{ modelKey: "PFI" + sPrefix, text: "PFI" },
					{ modelKey: "U" + sPrefix, text: "U>" },
					{ modelKey: "SinSenal" + sPrefix, text: "Sin señalizacion de protecciones" }
				];
				
				aProteccionesActuantes.forEach(function(oProt) {
					if (oProteccionesModel.getProperty("/" + oProt.modelKey)) {
						oData.Protecciones.push(oProt.text);
					}
				});
				
				// Recolectar excitaciones seleccionadas desde el modelo
				const aExcitaciones = [
					{ modelKey: "R" + sPrefix, text: "R" },
					{ modelKey: "S" + sPrefix, text: "S" },
					{ modelKey: "T" + sPrefix, text: "T" },
					{ modelKey: "Tierra" + sPrefix, text: "Tierra" },
					{ modelKey: "SinExcitacion" + sPrefix, text: "Sin Excitación de fase" }
				];
				
				aExcitaciones.forEach(function(oExc) {
					if (oProteccionesModel.getProperty("/" + oExc.modelKey)) {
						oData.Excitaciones.push(oExc.text);
					}
				});
				
				return oData;
			};
			
			// Recolectar datos de ambos HBox
			const oProteccion1 = collectProteccionData("1");
			const oProteccion2 = collectProteccionData("2");
			
			// Crear texto descriptivo para la lista
			const formatProteccionText = function(oProt) {
				if (!oProt.Et) {
					return null; // No agregar si no hay ET seleccionada
				}
				
				let sText = "ET: " + oProt.Et;
				if (oProt.Protecciones.length > 0) {
					sText += " | Protecciones: " + oProt.Protecciones.join(", ");
				}
				if (oProt.Excitaciones.length > 0) {
					sText += " | Excitaciones: " + oProt.Excitaciones.join(", ");
				}
				if (oProt.OtrasActuaciones) {
					sText += " | Otras: " + oProt.OtrasActuaciones;
				}
				if (oProt.LocFalla) {
					sText += " | Loc Falla: " + oProt.LocFalla;
				}
				
				return sText;
			};
			
			// Agregar protecciones a la lista si tienen ET seleccionada
			if (oProteccion1.Et) {
				const sText1 = formatProteccionText(oProteccion1);
				if (sText1) {
					aProtecciones.push({
						Proteccion: sText1
					});
				}
			}
			
			if (oProteccion2.Et) {
				const sText2 = formatProteccionText(oProteccion2);
				if (sText2) {
					aProtecciones.push({
						Proteccion: sText2
					});
				}
			}
			
			// Actualizar el modelo
			oProteccionesModel.setProperty("/Protecciones", aProtecciones);
			
			// Mostrar mensaje de confirmación
			if (aProtecciones.length > 0) {
				sap.m.MessageToast.show("Se agregaron " + aProtecciones.length + " protección(es) a la lista");
			} else {
				sap.m.MessageBox.warning("Debe seleccionar al menos una ET para agregar protecciones");
			}
		}
	});
});