sap.ui.define([
	"sap/m/MessageBox",
	"transener/registrocronologicoeventos/utils/Logger",
	"transener/registrocronologicoeventos/utils/i18nTranslationHelper"
], function (MessageBox, Logger, i18nTranslationHelper) {
	"use strict";

	/**
	 * Servicio centralizado para manejo de errores
	 * Proporciona una interfaz consistente para mostrar y loguear errores
	 * 
	 * @namespace transener.registrocronologicoeventos.utils
	 */
	var ErrorHandler = {
		/**
		 * Maneja un error de forma genérica
		 * @param {Error|string} error - Error o mensaje de error
		 * @param {string} context - Contexto donde ocurrió el error (opcional)
		 * @param {boolean} showToUser - Si debe mostrarse al usuario (default: true)
		 * @param {Function} callback - Callback a ejecutar después de mostrar el error (opcional)
		 */
		handleError: function (error, context, showToUser, callback) {
			var errorMessage = this._extractErrorMessage(error);
			var errorContext = context || "Error desconocido";

			// Log del error
			Logger.error("Error en " + errorContext + ": " + errorMessage, error);

			// Mostrar al usuario si es necesario
			if (showToUser !== false) {
				var userMessage = this._getUserFriendlyMessage(errorMessage, context);
				MessageBox.error(userMessage, {
					title: "Error",
					actions: [MessageBox.Action.OK],
					onClose: function () {
						if (callback && typeof callback === "function") {
							callback();
						}
					}
				});
			} else if (callback && typeof callback === "function") {
				callback();
			}
		},

		/**
		 * Maneja errores de servicios OData
		 * @param {Object} oError - Error del servicio OData
		 * @param {string} operation - Operación que falló (ej: "crear novedad", "actualizar novedad")
		 * @param {Function} callback - Callback opcional
		 */
		handleODataError: function (oError, operation, callback) {
			var errorMessage = this._extractODataErrorMessage(oError);
			var context = "Operación: " + (operation || "OData");
			
			Logger.error("Error OData en " + context, oError);
			
			var userMessage = "Error al " + (operation || "realizar la operación") + ".\n" + errorMessage;
			
			MessageBox.error(userMessage, {
				title: "Error",
				actions: [MessageBox.Action.OK],
				onClose: function () {
					if (callback && typeof callback === "function") {
						callback();
					}
				}
			});
		},

		/**
		 * Maneja errores de validación
		 * @param {Array|Object} validationErrors - Errores de validación
		 * @param {string} formName - Nombre del formulario (opcional)
		 */
		handleValidationError: function (validationErrors, formName) {
			var context = formName ? "Validación de " + formName : "Validación";
			var message = "Existen errores de validación:\n\n";

			if (Array.isArray(validationErrors)) {
				validationErrors.forEach(function (error) {
					if (typeof error === "string") {
						message += "- " + error + "\n";
					} else if (error.message) {
						message += "- " + error.message + "\n";
					}
				});
			} else if (typeof validationErrors === "string") {
				message += validationErrors;
			} else if (validationErrors.message) {
				message += validationErrors.message;
			}

			Logger.warn(context, validationErrors);
			MessageBox.warning(message, {
				title: "Validación",
				actions: [MessageBox.Action.OK]
			});
		},

		/**
		 * Extrae el mensaje de error de diferentes tipos de objetos de error
		 * @param {Error|string|Object} error - Objeto de error
		 * @returns {string} Mensaje de error
		 * @private
		 */
		_extractErrorMessage: function (error) {
			if (!error) {
				return "Error desconocido";
			}

			if (typeof error === "string") {
				return error;
			}

			if (error instanceof Error) {
				return error.message || error.toString();
			}

			if (error.message) {
				return error.message;
			}

			if (error.responseText) {
				try {
					var parsed = JSON.parse(error.responseText);
					if (parsed.error && parsed.error.message) {
						return parsed.error.message.value || parsed.error.message;
					}
				} catch (e) {
					return error.responseText;
				}
			}

			if (error.statusText) {
				return error.statusText;
			}

			return JSON.stringify(error);
		},

		/**
		 * Extrae mensaje de error específico de OData
		 * @param {Object} oError - Error de OData
		 * @returns {string} Mensaje de error
		 * @private
		 */
		_extractODataErrorMessage: function (oError) {
			if (!oError) {
				return "Error desconocido en el servicio";
			}

			// Intentar obtener mensaje de error de OData
			if (oError.responseText) {
				try {
					var parsed = JSON.parse(oError.responseText);
					if (parsed.error) {
						if (parsed.error.message && parsed.error.message.value) {
							return parsed.error.message.value;
						}
						if (parsed.error.message) {
							return parsed.error.message;
						}
					}
				} catch (e) {
					Logger.debug("No se pudo parsear respuesta de error OData", e);
				}
			}

			// Fallback a mensajes genéricos según el código de estado
			if (oError.statusCode) {
				switch (oError.statusCode) {
					case 400:
						return "Solicitud inválida. Verifique los datos ingresados.";
					case 401:
						return "No autorizado. Por favor, inicie sesión nuevamente.";
					case 403:
						return "No tiene permisos para realizar esta operación.";
					case 404:
						return "Recurso no encontrado.";
					case 500:
						return "Error interno del servidor. Por favor, intente más tarde.";
					default:
						return "Error en el servidor (Código: " + oError.statusCode + ")";
				}
			}

			return this._extractErrorMessage(oError);
		},

		/**
		 * Obtiene un mensaje amigable para el usuario
		 * @param {string} technicalMessage - Mensaje técnico
		 * @param {string} context - Contexto del error
		 * @returns {string} Mensaje amigable
		 * @private
		 */
		_getUserFriendlyMessage: function (technicalMessage, context) {
			// Intentar traducir si hay contexto
			if (context) {
				var i18nKey = "error." + context.toLowerCase().replace(/\s+/g, ".");
				var translated = i18nTranslationHelper.getTranslation(i18nKey);
				if (translated && translated !== i18nKey) {
					return translated;
				}
			}

			// Mensajes genéricos amigables
			if (technicalMessage.includes("NetworkError") || technicalMessage.includes("Failed to fetch")) {
				return "Error de conexión. Por favor, verifique su conexión a internet e intente nuevamente.";
			}

			if (technicalMessage.includes("timeout")) {
				return "La operación tardó demasiado tiempo. Por favor, intente nuevamente.";
			}

			// Retornar mensaje técnico si no hay mejor opción
			return technicalMessage;
		},

		/**
		 * Muestra un mensaje de éxito
		 * @param {string} message - Mensaje de éxito
		 * @param {string} title - Título (opcional, default: "Éxito")
		 */
		showSuccess: function (message, title) {
			Logger.info("Operación exitosa: " + message);
			MessageBox.success(message, {
				title: title || "Éxito",
				actions: [MessageBox.Action.OK]
			});
		}
	};

	return ErrorHandler;
});
