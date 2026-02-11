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
					Et2State: "None"
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
			
			// Asignar ExtremoA a Et1
			if (sExtremoA) {
				oProteccionesModel.setProperty("/Et1", sExtremoA);
				oProteccionesModel.setProperty("/Et1State", "None");
			}
			
			// Asignar ExtremoB a Et2
			if (sExtremoB) {
				oProteccionesModel.setProperty("/Et2", sExtremoB);
				oProteccionesModel.setProperty("/Et2State", "None");
			}
			
			// Si hay ExtremoC pero no hay ExtremoB, asignar ExtremoC a Et2
			if (!sExtremoB && sExtremoC) {
				oProteccionesModel.setProperty("/Et2", sExtremoC);
				oProteccionesModel.setProperty("/Et2State", "None");
			}
			
			// Actualizar los ComboBox de ET en la vista si existen
			const oEt1ComboBox = oView.byId("proteccionEt1");
			const oEt2ComboBox = oView.byId("proteccionEt2");
			
			if (oEt1ComboBox && sExtremoA) {
				oEt1ComboBox.setSelectedKey(sExtremoA);
			}
			
			if (oEt2ComboBox && sExtremoB) {
				oEt2ComboBox.setSelectedKey(sExtremoB);
			} else if (oEt2ComboBox && sExtremoC) {
				oEt2ComboBox.setSelectedKey(sExtremoC);
			}
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
					Et2: ""
				});
			}
			
			const aProtecciones = oProteccionesModel.getProperty("/Protecciones") || [];
			
			// Función helper para recolectar datos de un HBox de protecciones
			const collectProteccionData = function (sPrefix) {
				const oData = {
					Et: oView.byId("proteccion" + sPrefix + "Et" + (sPrefix === "1" ? "1" : "2"))?.getSelectedKey() || "",
					Protecciones: [],
					Excitaciones: [],
					OtrasActuaciones: oView.byId("proteccion" + sPrefix + "OtrasActuaciones")?.getValue() || "",
					LocFalla: oView.byId("proteccion" + sPrefix + "LocFalla")?.getValue() || ""
				};
				
				// Recolectar protecciones actuantes seleccionadas
				const aProteccionesActuantes = [
					{ id: "Diferencial", text: "Diferencial" },
					{ id: "DPO", text: "DPO" },
					{ id: "Impedancia", text: "Impedancia" },
					{ id: "MaxCorriente", text: "Máxima Corriente" },
					{ id: "PFI", text: "PFI" },
					{ id: "U", text: "U>" },
					{ id: "SinSenal", text: "Sin señalizacion de protecciones" }
				];
				
				aProteccionesActuantes.forEach(function(oProt) {
					const oCheckBox = oView.byId("proteccion" + sPrefix + oProt.id);
					if (oCheckBox && oCheckBox.getSelected()) {
						oData.Protecciones.push(oProt.text);
					}
				});
				
				// Recolectar excitaciones seleccionadas
				const aExcitaciones = [
					{ id: "ExR", text: "R" },
					{ id: "ExS", text: "S" },
					{ id: "ExT", text: "T" },
					{ id: "ExTierra", text: "Tierra" },
					{ id: "SinExcitacion", text: "Sin Excitación de fase" }
				];
				
				aExcitaciones.forEach(function(oExc) {
					const oCheckBox = oView.byId("proteccion" + sPrefix + oExc.id);
					if (oCheckBox && oCheckBox.getSelected()) {
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
						Proteccion: sText1,
						Data: oProteccion1
					});
				}
			}
			
			if (oProteccion2.Et) {
				const sText2 = formatProteccionText(oProteccion2);
				if (sText2) {
					aProtecciones.push({
						Proteccion: sText2,
						Data: oProteccion2
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