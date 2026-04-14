sap.ui.define([], function () {
	"use strict";

	/**
	 * Constantes de la aplicación
	 * Centraliza todos los valores mágicos y códigos hardcodeados
	 * 
	 * @namespace transener.registrocronologicoeventos.utils
	 */
	return {
		/**
		 * Códigos de tipos de novedades
		 */
		NOVEDAD_TYPES: {
			PERTURBACION: "P",
			DESCONEXION: "D",
			CONEXION: "C",
			INTERRUPCION: "I"
		},

		/**
		 * Códigos de tipos de equipos (líneas)
		 */
		LINEAS: ["L1", "L2", "L3", "L4", "L5", "L6", "L9"],

		/**
		 * Estados de tramitación
		 */
		TRAMITACION_ESTADOS: {
			PENDIENTE: "01",
			APROBADO: "02"
		},

		/**
		 * Modos de edición
		 */
		EDIT_MODES: {
			CREATE: "create",
			EDIT: "edit",
			VIEW: "view"
		},

		/**
		 * Roles y grupos de autorización
		 */
		ROLES: {
			EDITOR_GROUPS: ["ope_jefe_turno_cot","ope_oper-turno_cot","ope_programacion_cot"],
			SUPER_GROUPS: ["ope_jefe_turno_cot", "Jefe_COT", "Jefe_COTDT", "ope_jefe_cot", "ope_jefe_cotdt"]
		},

		TURNO: {
			STATUS_ABIERTO: "ABIERTO",
			STATUS_CERRADO: "CERRADO",
			TIMEZONE_OFFSET_HOURS: -3
		},

		/**
		 * Valores booleanos para campos
		 */
		BOOLEAN_VALUES: {
			YES: "S",
			NO: "N"
		},

		/**
		 * Límites y tamaños
		 */
		LIMITS: {
			MODEL_SIZE: 9999,
			PROGRESS_BAR_MAX: 100
		},

		/**
		 * Códigos de empresa
		 */
		EMPRESAS: {
			TRA: "100",
			TBA: "200",
			DEFAULT: "100"
		},

		/**
		 * Mapeo de códigos de novedad a fragmentos por empresa
		 * TRA: Transener
		 * TBA: Transba
		 */
		NOVEDAD_FRAGMENT_MAPPING: {
			TRA: {
				General: ["ADAP","AUTO","AUTR","DENE","DESC","DFOR","DISP","ENER","ESER","ESPO", "FINA","FSER","FSPO","HABI","INDI","INFO","INHI","INIC","MANU","NADA","NAUT","R495","R500","R5005","REAN","RMON","RTRI","SREC","SUSP"],
				Alarma: ["ALAR","RTNA"],
				CargaDeEquipos: ["CMAX","CNOM","INTF","NRLI","SULI",],
				EnBandaFueraDeBanda: ["EBAN","FBAN"],
				ManiobrasOperativas: ["AACO","ABTR","AINT","CBAR","CNOR","ESSP"],
			
			},
			TBA: {
				General: ["DI","IN","HABI","INHI","COM","RH","RA","APADECSUB","ACT SUB V","GUI","MIN FREC","NGUI","NFORM","PT","RESTR","RSSP"],
				Alarma: ["ALARMA","FT","FTP","IFUIM","NT","RTNA"],
				CargaDeEquipos: ["INTF","CNOM","NRESTR","VANO"],
				EnBandaFueraDeBanda: ["EB","FB"],
				ManiobrasOperativas: ["CR","DF","DG","EP","FP","PFIH","PFII","SOLGEN","SPG","SSG","TORET","TORS","TORT","U10%","U5%","UNORM"],
			}
		},

		/**
		 * Ruta base para fragmentos de novedades
		 */
		FRAGMENT_PATHS: {
			NOVEDADES_BASE: "transener.registrocronologicoeventos.fragments.novedades."
		},

		/**
		 * Operadores de prueba
		 */
		TEST_OPERATORS: ["Bonavita", "Vandale", "Burbaud"],

		/**
		 * Propiedades expandidas para OData
		 */
		ODATA_EXPAND_PROPERTIES: "ConsecuentesSet,InformeCammesaSet,ComentariosSet,ENSRegXNS_NAV,SenialXNS_nav,PruebasXNS_nav,Normalizacion_nav",

		/**
		 * Configuración de modelos OData
		 */
		ODATA_CONFIG: {
			DEFAULT_OPERATION_MODE: "Server",
			DEFAULT_BINDING_MODE: "OneWay",
			DEFAULT_COUNT_MODE: "Request",
			USE_BATCH: false
		},

		/**
		 * Mensajes de error comunes
		 */
		ERROR_MESSAGES: {
			REQUIRED_FIELD: "Este campo es requerido",
			INVALID_DATE: "La fecha ingresada no es válida",
			INVALID_DATE_RANGE: "El rango de fechas no es válido",
			SAVE_ERROR: "Error al guardar los datos",
			LOAD_ERROR: "Error al cargar los datos",
			DELETE_ERROR: "Error al eliminar el registro",
			VALIDATION_ERROR: "Existen campos con errores de validación",
			NETWORK_ERROR: "Error de conexión. Verifique su conexión a internet.",
			UNAUTHORIZED: "No tiene permisos para realizar esta operación",
			TURNO_CERRADO: "No se pueden crear registros en un turno CERRADO.",
			NO_PERTENECE_TURNO: "No se pueden crear registros en un turno al que no pertenece.",
			NO_TURNO_ENCONTRADO: "No se encontró un turno abierto para la fecha seleccionada.",
			NO_PUEDE_EDITAR_AJENO: "No se pueden modificar los registros de otro operador.",
			NO_PUEDE_ELIMINAR_AJENO: "No se pueden eliminar los registros de otro operador."
		},

		/**
		 * Mensajes de éxito comunes
		 */
		SUCCESS_MESSAGES: {
			SAVED: "Los datos se han guardado correctamente",
			DELETED: "El registro se ha eliminado correctamente",
			CREATED: "El registro se ha creado correctamente",
			UPDATED: "El registro se ha actualizado correctamente"
		},

		/**
		 * Validaciones de campos
		 */
		VALIDATION_RULES: {
			CUIL_LENGTH: 11,
			MIN_PASSWORD_LENGTH: 8
		},

		/**
		 * Formatos de fecha
		 */
		DATE_FORMATS: {
			DISPLAY: "dd/MM/yyyy",
			DISPLAY_WITH_TIME: "dd/MM/yyyy HH:mm",
			ODATA: "yyyy-MM-ddTHH:mm:ss"
		}
	};
});
