sap.ui.define([
  "transener/registrocronologicoeventos/controller/BaseController",
  "sap/ui/core/routing/History",
  "sap/ui/core/Fragment",
  "sap/m/MessageToast",
  "transener/registrocronologicoeventos/utils/Constants",
  "transener/registrocronologicoeventos/services/EquiposService",
  "transener/registrocronologicoeventos/utils/ModelHelper",
  "transener/registrocronologicoeventos/utils/Logger",
  "transener/registrocronologicoeventos/utils/ErrorHandler"
], function (BaseController, History, Fragment, MessageToast, Constants, EquiposService, ModelHelper, Logger, ErrorHandler) {
  "use strict";

  return BaseController.extend("transener.registrocronologicoeventos.controller.Novedades", {
    /**
     * Inicializa el controlador
     * Configura el router para detectar cuando se navega a esta vista
     */
    onInit: function () {
      this.getOwnerComponent().getRouter()
        .getRoute("Novedades")
        .attachPatternMatched(this._onRouteMatched, this);
    },

    /**
     * Maneja el evento cuando se navega a la vista Novedades
     * Configura el modo de edición y carga datos iniciales si existen
     * @param {sap.ui.base.Event} oEvent - Evento de navegación
     * @private
     */
    _onRouteMatched: function (oEvent) {
      var oArgs = oEvent.getParameter("arguments") || {};
      var sMode = (oArgs.mode || Constants.EDIT_MODES.VIEW).toLowerCase();
      var oView = this.getView();
      
      if (!oView) {
        Logger.error("Vista no disponible en _onRouteMatched");
        return;
      }

      // Configurar el modo de edición
      var oEditModel = ModelHelper.getModel("editModel", oView) || sap.ui.getCore().getModel("editModel");
      if (oEditModel) {
        oEditModel.setProperty("/mode", sMode);
        var bIsEditMode = sMode === Constants.EDIT_MODES.EDIT;
        oEditModel.setProperty("/editableMode", bIsEditMode);
      }

      // Leer los datos del modelo NovedadesFormJsonModel
      var oNovedadModel = ModelHelper.getModel("NovedadesFormJsonModel", oView);
      if (!oNovedadModel) {
        Logger.debug("NovedadesFormJsonModel no encontrado en _onRouteMatched");
        return;
      }

      var oNovedadData = oNovedadModel.getData();
      if (!oNovedadData) {
        Logger.debug("NovedadesFormJsonModel no tiene datos en _onRouteMatched");
        return;
      }

      // Si está en modo CREATE, limpiar CodNovedad y fragmentos
      if (sMode === Constants.EDIT_MODES.CREATE) {
        Logger.debug("Modo CREATE detectado, limpiando CodNovedad y fragmentos");
        oNovedadModel.setProperty("/CodNovedad", "");
        this._clearFragmentContainer();
      }
      
      // Si hay Tplnr (ubicación), cargar los equipos correspondientes
      if (oNovedadData.Tplnr) {
        var empresa = this._getEmpresa(oView);
        if (empresa) {
          Logger.debug("Cargando equipos para ubicación: " + oNovedadData.Tplnr);
          EquiposService.LoadLTEquipos(oNovedadData.Tplnr, empresa);
        } else {
          Logger.warn("No se pudo obtener la empresa para cargar equipos");
        }
      }

      // Si hay CodNovedad, cargar el fragmento correspondiente
      if (oNovedadData.CodNovedad) {
        Logger.debug("Cargando fragmento para CodNovedad: " + oNovedadData.CodNovedad);
        this._loadFragmentByCodNovedad(oNovedadData.CodNovedad);
      } else {
        // Si no hay CodNovedad, asegurarse de que el contenedor esté limpio
        this._clearFragmentContainer();
      }
    },

    /**
     * Obtiene el código de empresa del modelo
     * @param {sap.ui.core.mvc.View} oView - Vista actual
     * @returns {string} Código de empresa o Constants.EMPRESAS.DEFAULT si no se encuentra
     * @private
     */
    _getEmpresa: function (oView) {
      if (!oView) {
        Logger.warn("Vista no disponible en _getEmpresa, usando empresa por defecto");
        return Constants.EMPRESAS.DEFAULT;
      }

      var oUtilsModel = ModelHelper.getModel("utilsModel", oView);
      var empresa = oUtilsModel?.getProperty("/Empresa") || 
                    oUtilsModel?.getProperty("/CodEmpresa") ||
                    ModelHelper.getModel("Empresa", oView)?.getProperty("/selectedSociety");
      
      return empresa || Constants.EMPRESAS.DEFAULT;
    },

    /**
     * Encuentra el nombre del fragmento basado en el código de novedad y la empresa
     * @param {string} sCodNovedad - Código de novedad
     * @param {string} sEmpresa - Código de empresa (opcional, se obtiene del modelo si no se proporciona)
     * @returns {string|null} Nombre del fragmento o null si no se encuentra
     * @private
     */
    _findFragmentByCodNovedad: function (sCodNovedad, sEmpresa) {
      if (!sCodNovedad) {
        Logger.warn("_findFragmentByCodNovedad: sCodNovedad no proporcionado");
        return null;
      }

      var oView = this.getView();
      var empresa = sEmpresa || this._getEmpresa(oView);
      
      // Determinar qué mapeo usar según la empresa
      var sMappingKey = empresa === Constants.EMPRESAS.TRA ? "TRA" : "TBA";
      var oMapping = Constants.NOVEDAD_FRAGMENT_MAPPING[sMappingKey];
      
      if (!oMapping) {
        Logger.warn("No se encontró mapeo para empresa: " + empresa);
        return null;
      }

      // Buscar el fragmento que contiene el código de novedad
      var sFragmentName = null;
      Object.keys(oMapping).some(function (sCategory) {
        if (oMapping[sCategory].includes(sCodNovedad)) {
          sFragmentName = sCategory;
          return true;
        }
        return false;
      });

      if (sFragmentName) {
        Logger.debug("Fragmento encontrado para CodNovedad " + sCodNovedad + ": " + sFragmentName);
      } else {
        Logger.warn("No se encontró fragmento para CodNovedad: " + sCodNovedad);
      }

      return sFragmentName;
    },

    /**
     * Carga el fragmento correspondiente a un código de novedad
     * @param {string} sCodNovedad - Código de novedad
     * @private
     */
    _loadFragmentByCodNovedad: function (sCodNovedad) {
      if (!sCodNovedad) {
        Logger.warn("_loadFragmentByCodNovedad: sCodNovedad no proporcionado");
        return;
      }

      var sFragmentName = this._findFragmentByCodNovedad(sCodNovedad);
      if (sFragmentName) {
        var sFragmentPath = Constants.FRAGMENT_PATHS.NOVEDADES_BASE + sFragmentName;
        this._showNovedadFragment(sFragmentPath);
      }
    },

    /**
     * Maneja la selección de un tipo de novedad
     * Actualiza el modelo y carga el fragmento correspondiente
     * Si se deselecciona (valor vacío), limpia el fragmento
     * @param {sap.ui.base.Event} oEvent - Evento de selección
     */
    onNovedadSelected: function (oEvent) {
      var oSource = oEvent.getSource();
      if (!oSource) {
        Logger.error("onNovedadSelected: fuente del evento no disponible");
        return;
      }

      var sSelectedKey = oSource.getSelectedKey();
      var oView = this.getView();
      if (!oView) {
        Logger.error("onNovedadSelected: vista no disponible");
        return;
      }
      
      // Actualizar el modelo con el CodNovedad seleccionado (puede ser vacío)
      var oNovedadModel = ModelHelper.getModel("NovedadesFormJsonModel", oView);
      if (!oNovedadModel) {
        Logger.error("onNovedadSelected: NovedadesFormJsonModel no encontrado");
        ErrorHandler.handleError("Modelo de novedades no disponible", "Seleccionar tipo de novedad", true);
        return;
      }

      // Si se deseleccionó (valor vacío), limpiar CodNovedad y fragmentos
      if (!sSelectedKey || sSelectedKey === "") {
        Logger.debug("TipoNovedad deseleccionado, limpiando CodNovedad y fragmentos");
        oNovedadModel.setProperty("/CodNovedad", "");
        this._clearFragmentContainer();
        return;
      }

      oNovedadModel.setProperty("/CodNovedad", sSelectedKey);
      Logger.debug("CodNovedad actualizado en modelo: " + sSelectedKey);

      // Buscar y cargar el fragmento correspondiente
      var sFragmentName = this._findFragmentByCodNovedad(sSelectedKey);
      if (!sFragmentName) {
        MessageToast.show("No existe un fragmento para la opción seleccionada.");
        Logger.warn("No se encontró fragmento para CodNovedad: " + sSelectedKey);
        // Limpiar fragmentos si no se encontró uno válido
        this._clearFragmentContainer();
        return;
      }

      var sFragmentPath = Constants.FRAGMENT_PATHS.NOVEDADES_BASE + sFragmentName;
      this._showNovedadFragment(sFragmentPath);
    },

    /**
     * Maneja el cambio de selección en ComboBoxes
     * Actualiza el modelo y dispara acciones relacionadas (ej: cargar equipos)
     * @param {sap.ui.base.Event} oEvent - Evento de cambio de selección
     */
    onSelectionChange: function (oEvent) {
      var oSource = oEvent.getSource();
      if (!oSource) {
        Logger.error("onSelectionChange: fuente del evento no disponible");
        return;
      }

      var sSelectedKey = oSource.getSelectedKey();
      var oView = this.getView();
      if (!oView) {
        Logger.error("onSelectionChange: vista no disponible");
        return;
      }

      var oNovedadModel = ModelHelper.getModel("NovedadesFormJsonModel", oView);
      if (!oNovedadModel) {
        Logger.error("onSelectionChange: NovedadesFormJsonModel no encontrado");
        return;
      }
      
      // Obtener el binding path para determinar qué campo cambió
      var sBindingPath = oSource.getBindingPath("selectedKey");
      if (!sBindingPath) {
        Logger.debug("onSelectionChange: no se encontró binding path");
        return;
      }
      
      // Normalizar el binding path (puede tener diferentes formatos)
      var sNormalizedPath = sBindingPath.replace(/^.*\//, ""); // Obtener solo el nombre del campo
      
      // Si el cambio es en el ComboBox de ubicación (Tplnr)
      if (sNormalizedPath === "Tplnr" || sBindingPath.indexOf("/Tplnr") !== -1) {
        Logger.debug("Cambio en ubicación (Tplnr): " + sSelectedKey);
        // Actualizar el modelo con la nueva ubicación
        oNovedadModel.setProperty("/Tplnr", sSelectedKey);
        oNovedadModel.setProperty("/Equnr", ""); // Limpiar equipo seleccionado
        
        // Cargar equipos para la nueva ubicación usando onUbicacionChange de BaseController
        if (sSelectedKey) {
          this.onUbicacionChange(oEvent);
        }
      }
      // Si el cambio es en el ComboBox de equipo (Equnr)
      else if (sNormalizedPath === "Equnr" || sBindingPath.indexOf("/Equnr") !== -1) {
        Logger.debug("Cambio en equipo (Equnr): " + sSelectedKey);
        oNovedadModel.setProperty("/Equnr", sSelectedKey);
      }
      // Para otros campos, actualizar según el binding
      else {
        var sModelPath = sBindingPath.replace(/^.*NovedadesFormJsonModel>\//, "").replace(/^.*\//, "");
        if (sModelPath) {
          Logger.debug("Actualizando campo en modelo: " + sModelPath + " = " + sSelectedKey);
          oNovedadModel.setProperty("/" + sModelPath, sSelectedKey);
        }
      }
    },

    /**
     * Limpia el contenedor de fragmentos
     * @private
     */
    _clearFragmentContainer: function () {
      var oView = this.getView();
      if (!oView) {
        Logger.warn("_clearFragmentContainer: vista no disponible");
        return;
      }

      var oContainer = this.byId("fragContainer");
      if (oContainer) {
        oContainer.removeAllItems();
        Logger.debug("Contenedor de fragmentos limpiado");
      } else {
        Logger.warn("_clearFragmentContainer: contenedor de fragmentos no encontrado");
      }
    },

    /**
     * Muestra un fragmento de novedad en el contenedor
     * @param {string} sFragmentPath - Ruta completa del fragmento a cargar
     * @private
     */
    _showNovedadFragment: async function (sFragmentPath) {
      if (!sFragmentPath) {
        Logger.error("_showNovedadFragment: sFragmentPath no proporcionado");
        ErrorHandler.handleError("Ruta de fragmento no válida", "Cargar fragmento", true);
        return;
      }

      var oView = this.getView();
      if (!oView) {
        Logger.error("_showNovedadFragment: vista no disponible");
        ErrorHandler.handleError("Vista no disponible", "Cargar fragmento", true);
        return;
      }

      var oContainer = this.byId("fragContainer");
      if (!oContainer) {
        Logger.error("_showNovedadFragment: contenedor de fragmentos no encontrado");
        MessageToast.show("Contenedor de fragmentos no encontrado");
        return;
      }

      oContainer.removeAllItems();

      try {
        var sFragmentId = oView.getId() + "--" + sFragmentPath.split(".").pop();
        Logger.debug("Cargando fragmento: " + sFragmentPath + " con ID: " + sFragmentId);

        var oFrag = await Fragment.load({
          id: sFragmentId,
          name: sFragmentPath,
          controller: this
        });

        if (!oFrag) {
          Logger.error("_showNovedadFragment: el fragmento no se pudo cargar: " + sFragmentPath);
          MessageToast.show("El fragmento no se pudo cargar: " + sFragmentPath);
          return;
        }

        // Verificar que el fragmento sea un ManagedObject válido antes de agregarlo
        var isValidControl = function(oControl) {
          return oControl && 
                 typeof oControl === "object" && 
                 (oControl.isA && typeof oControl.isA === "function");
        };

        if (Array.isArray(oFrag)) {
          oFrag.forEach(function (c) {
            if (isValidControl(c)) {
              oContainer.addItem(c);
            } else {
              Logger.warn("_showNovedadFragment: control inválido en array de fragmentos");
            }
          });
        } else if (isValidControl(oFrag)) {
          oContainer.addItem(oFrag);
        } else {
          Logger.error("_showNovedadFragment: el fragmento cargado no es un control válido: " + sFragmentPath);
          MessageToast.show("El fragmento cargado no es un control válido: " + sFragmentPath);
          return;
        }

        Logger.debug("Fragmento cargado exitosamente: " + sFragmentPath);
      } catch (e) {
        Logger.error("Error cargando fragmento: " + sFragmentPath, e);
        ErrorHandler.handleError(e, "Cargar fragmento de novedad", true);
      }
    }
  });
});
