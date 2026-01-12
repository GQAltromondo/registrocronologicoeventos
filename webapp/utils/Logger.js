sap.ui.define([], function () {
	"use strict";

	/**
	 * Servicio de logging centralizado para la aplicación
	 * Permite controlar el nivel de logging según el entorno
	 * 
	 * @namespace transener.registrocronologicoeventos.utils
	 */
	var Logger = {
		/**
		 * Niveles de logging disponibles
		 */
		LogLevel: {
			DEBUG: 0,
			INFO: 1,
			WARN: 2,
			ERROR: 3,
			NONE: 4
		},

		/**
		 * Nivel de logging actual (por defecto ERROR en producción)
		 */
		_currentLevel: 3,

		/**
		 * Indica si el logging está habilitado
		 */
		_enabled: true,

		/**
		 * Configura el nivel de logging
		 * @param {number} level - Nivel de logging (0=DEBUG, 1=INFO, 2=WARN, 3=ERROR, 4=NONE)
		 */
		setLevel: function (level) {
			this._currentLevel = level;
		},

		/**
		 * Habilita o deshabilita el logging
		 * @param {boolean} enabled - true para habilitar, false para deshabilitar
		 */
		setEnabled: function (enabled) {
			this._enabled = enabled;
		},

		/**
		 * Obtiene el nivel de logging según el entorno
		 * @returns {number} Nivel de logging apropiado para el entorno
		 */
		_getEnvironmentLevel: function () {
			// En desarrollo, permitir más logging
			if (window.location.hostname.includes("transener-pm-fioriq") ||
				window.location.hostname === "localhost" ||
				window.location.hostname === "127.0.0.1") {
				return this.LogLevel.DEBUG;
			}
			// En producción, solo errores
			return this.LogLevel.ERROR;
		},

		/**
		 * Inicializa el logger con el nivel apropiado para el entorno
		 */
		init: function () {
			this._currentLevel = this._getEnvironmentLevel();
		},

		/**
		 * Verifica si un nivel de logging debe ser mostrado
		 * @param {number} level - Nivel a verificar
		 * @returns {boolean} true si debe mostrarse
		 */
		_shouldLog: function (level) {
			return this._enabled && level >= this._currentLevel;
		},

		/**
		 * Formatea el mensaje de log
		 * @param {string} level - Nivel del log
		 * @param {string} message - Mensaje
		 * @param {*} data - Datos adicionales
		 * @returns {string} Mensaje formateado
		 */
		_formatMessage: function (level, message, data) {
			var timestamp = new Date().toISOString();
			var prefix = "[" + timestamp + "] [" + level + "]";
			if (data !== undefined) {
				return prefix + " " + message + " | Data: " + JSON.stringify(data);
			}
			return prefix + " " + message;
		},

		/**
		 * Log de nivel DEBUG
		 * @param {string} message - Mensaje a loguear
		 * @param {*} data - Datos adicionales (opcional)
		 */
		debug: function (message, data) {
			if (this._shouldLog(this.LogLevel.DEBUG)) {
				console.debug(this._formatMessage("DEBUG", message, data));
			}
		},

		/**
		 * Log de nivel INFO
		 * @param {string} message - Mensaje a loguear
		 * @param {*} data - Datos adicionales (opcional)
		 */
		info: function (message, data) {
			if (this._shouldLog(this.LogLevel.INFO)) {
				console.info(this._formatMessage("INFO", message, data));
			}
		},

		/**
		 * Log de nivel WARN
		 * @param {string} message - Mensaje a loguear
		 * @param {*} data - Datos adicionales (opcional)
		 */
		warn: function (message, data) {
			if (this._shouldLog(this.LogLevel.WARN)) {
				console.warn(this._formatMessage("WARN", message, data));
			}
		},

		/**
		 * Log de nivel ERROR
		 * @param {string} message - Mensaje a loguear
		 * @param {Error|*} error - Error o datos adicionales (opcional)
		 */
		error: function (message, error) {
			if (this._shouldLog(this.LogLevel.ERROR)) {
				if (error instanceof Error) {
					console.error(this._formatMessage("ERROR", message), error);
				} else {
					console.error(this._formatMessage("ERROR", message, error));
				}
			}
		}
	};

	// Inicializar automáticamente
	Logger.init();

	return Logger;
});
