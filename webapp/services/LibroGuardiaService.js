sap.ui.define([
	"transener/registrocronologicoeventos/services/oDataServices",
	"transener/registrocronologicoeventos/utils/ModelHelper",
	"transener/registrocronologicoeventos/utils/Logger",
	"transener/registrocronologicoeventos/utils/ErrorHandler",
	"sap/m/MessageToast"
], function (oDataServices, ModelHelper, Logger, ErrorHandler, MessageToast) {
	"use strict";

	return {
		_entitySet: "/GuardiasListSet",

		/**
		 * Obtiene la empresa desde el modelo
		 * @param {sap.ui.core.mvc.View} oView - Vista actual (opcional)
		 * @returns {string} Código de la empresa
		 * @private
		 */
		_getEmpresa: function (oView) {
			try {
				var oEmpresaModel = ModelHelper.getModel("Empresa", oView);
				if (oEmpresaModel) {
					var sEmpresa = oEmpresaModel.getProperty("/selectedSociety");
					if (sEmpresa) {
						return sEmpresa;
					}
				}
				// Fallback: intentar obtener desde utilsModel
				var oUtilsModel = ModelHelper.getModel("utilsModel", oView);
				if (oUtilsModel) {
					var sEmpresa = oUtilsModel.getProperty("/Empresa");
					if (sEmpresa) {
						return sEmpresa;
					}
				}
			} catch (e) {
				Logger.debug("LibroGuardiaService._getEmpresa: No se pudo obtener empresa desde modelo", e);
			}
			return "";
		},

		/**
		 * Crea un registro en el Libro de Guardia
		 * @param {Object} oData - Datos del registro a crear
		 * @param {string} [oData.Id="999"] - ID del registro (por defecto "999")
		 * @param {Date|string} oData.Fechahora - Fecha y hora del registro
		 * @param {string} oData.Equipo - Código del equipo
		 * @param {string} oData.Lugar - Código del lugar/ubicación
		 * @param {string} [oData.Novedad=""] - Código de la novedad
		 * @param {string} [oData.Tiponovedad=""] - Tipo de novedad (AREC, RECD, DESE, FSPE)
		 * @param {string} [oData.Empresa] - Código de la empresa (se obtiene automáticamente si no se proporciona)
		 * @param {sap.ui.core.mvc.View} [oView] - Vista actual (opcional, para obtener el modelo y empresa)
		 * @returns {Promise} Promise que se resuelve cuando el registro se crea exitosamente
		 */
		createGuardia: function (oData, oView) {
			return new Promise((resolve, reject) => {
				// Validar datos requeridos
				if (!oData) {
					Logger.error("LibroGuardiaService.createGuardia: No se proporcionaron datos");
					reject(new Error("No se proporcionaron datos para crear el registro"));
					return;
				}

				// Obtener empresa si no se proporcionó
				var sEmpresa = oData.Empresa || this._getEmpresa(oView);
				
				// Preparar el registro con valores por defecto
				var NewRecord = {
					"Id": oData.Id || "999",
					"Fechahora": oData.Fechahora || null,
					"Equipo": oData.Equipo || "",
					"Lugar": oData.Lugar || "",
					"Novedad": oData.Novedad || "",
					"Tiponovedad": oData.Tiponovedad || "",
					"Empresa": sEmpresa
				};

				// Validar campos requeridos
				if (!NewRecord.Fechahora || !NewRecord.Equipo || !NewRecord.Lugar || !NewRecord.Empresa) {
					Logger.warn("LibroGuardiaService.createGuardia: Faltan campos requeridos", NewRecord);
					reject(new Error("Faltan campos requeridos: Fechahora, Equipo, Lugar o Empresa"));
					return;
				}

				Logger.debug("LibroGuardiaService.createGuardia: Creando registro", NewRecord);

				// Obtener el modelo OData
				// Intentar obtener el modelo "NewRec" primero (si existe), luego "LGuardias", y finalmente el modelo principal
				var oModel = null;
				if (oView) {
					oModel = oView.getModel("NewRec") || oView.getModel("LGuardias");
				}
				
				if (!oModel) {
					// Intentar obtener desde el core
					oModel = sap.ui.getCore().getModel("NewRec") || sap.ui.getCore().getModel("LGuardias");
				}

				if (!oModel) {
					// Usar el modelo OData principal como fallback
					oModel = oDataServices.getModel();
					Logger.debug("LibroGuardiaService.createGuardia: Usando modelo OData principal");
				}

				if (!oModel) {
					Logger.error("LibroGuardiaService.createGuardia: No se pudo obtener el modelo OData");
					reject(new Error("No se pudo obtener el modelo OData"));
					return;
				}

				// Crear el registro
				oModel.create(this._entitySet, NewRecord, {
					success: function (oResponse) {
						Logger.debug("LibroGuardiaService.createGuardia: Registro creado exitosamente", oResponse);
						
						// Verificar si hay un mensaje en la respuesta
						if (oResponse && oResponse.create === "") {
							var sMessage = oResponse.Message || "Registro creado con advertencia";
							MessageToast.show(sMessage);
							Logger.warn("LibroGuardiaService.createGuardia: Respuesta con advertencia", sMessage);
						} else {
							MessageToast.show("Registro Creado Correctamente");
							Logger.info("LibroGuardiaService.createGuardia: Registro creado correctamente");
						}

						resolve(oResponse);
					},
					error: function (oError) {
						Logger.error("LibroGuardiaService.createGuardia: Error al crear registro", oError);
						ErrorHandler.handleODataError(oError, "crear registro en Libro de Guardia");
						reject(oError);
					}
				});
			});
		},

		/**
		 * Actualiza un registro en el Libro de Guardia
		 * @param {Object} oData - Datos del registro a actualizar
		 * @param {string} oData.Id - ID del registro a actualizar (requerido)
		 * @param {Date|string} oData.Fechahora - Fecha y hora del registro
		 * @param {string} oData.Equipo - Código del equipo
		 * @param {string} oData.Lugar - Código del lugar/ubicación
		 * @param {string} [oData.Novedad=""] - Código de la novedad
		 * @param {string} [oData.Tiponovedad=""] - Tipo de novedad (AREC, RECD, DESE, FSPE)
		 * @param {string} [oData.Empresa] - Código de la empresa (se obtiene automáticamente si no se proporciona)
		 * @param {sap.ui.core.mvc.View} [oView] - Vista actual (opcional, para obtener el modelo y empresa)
		 * @returns {Promise} Promise que se resuelve cuando el registro se actualiza exitosamente
		 */
		updateGuardia: function (oData, oView) {
			return new Promise((resolve, reject) => {
				// Validar datos requeridos
				if (!oData) {
					Logger.error("LibroGuardiaService.updateGuardia: No se proporcionaron datos");
					reject(new Error("No se proporcionaron datos para actualizar el registro"));
					return;
				}

				// Validar que tenga Id
				if (!oData.Id) {
					Logger.error("LibroGuardiaService.updateGuardia: No se proporcionó el Id del registro");
					reject(new Error("El Id del registro es requerido para actualizar"));
					return;
				}

				// Obtener empresa si no se proporcionó
				var sEmpresa = oData.Empresa || this._getEmpresa(oView);
				
				// Preparar el registro
				var UpdateRecord = {
					"Id": oData.Id,
					"Fechahora": oData.Fechahora || null,
					"Equipo": oData.Equipo || "",
					"Lugar": oData.Lugar || "",
					"Novedad": oData.Novedad || "",
					"Tiponovedad": oData.Tiponovedad || "",
					"Empresa": sEmpresa,
				
				};

				// Validar campos requeridos
				if (!UpdateRecord.Fechahora || !UpdateRecord.Equipo || !UpdateRecord.Lugar || !UpdateRecord.Empresa) {
					Logger.warn("LibroGuardiaService.updateGuardia: Faltan campos requeridos", UpdateRecord);
					reject(new Error("Faltan campos requeridos: Fechahora, Equipo, Lugar o Empresa"));
					return;
				}

				Logger.debug("LibroGuardiaService.updateGuardia: Actualizando registro", UpdateRecord);

				// Obtener el modelo OData
				var oModel = null;
				if (oView) {
					oModel =  oView.getModel("LGuardias");
				}
				
				if (!oModel) {
					oModel = sap.ui.getCore().getModel("LGuardias");
				}

			
				if (!oModel) {
					Logger.error("LibroGuardiaService.updateGuardia: No se pudo obtener el modelo OData");
					reject(new Error("No se pudo obtener el modelo OData"));
					return;
				}

				// Construir la ruta del registro (GuardiasListSet(Id='...',Empresa='...'))
				var sPath = this._entitySet + "(Id='" + UpdateRecord.Id + "',Empresa='" + UpdateRecord.Empresa + "')";

				// Actualizar el registro
				oModel.update(sPath, UpdateRecord, {
					method: "PUT",
					success: function (oResponse) {
						Logger.debug("LibroGuardiaService.updateGuardia: Registro actualizado exitosamente", oResponse);
						MessageToast.show("Registro Actualizado Correctamente");
						Logger.info("LibroGuardiaService.updateGuardia: Registro actualizado correctamente");
						resolve(oResponse);
					},
					error: function (oError) {
						Logger.error("LibroGuardiaService.updateGuardia: Error al actualizar registro", oError);
						ErrorHandler.handleODataError(oError, "actualizar registro en Libro de Guardia");
						reject(oError);
					}
				});
			});
		},

		/**
		 * Crea un registro en el Libro de Guardia y refresca los datos
		 * @param {Object} oData - Datos del registro a crear
		 * @param {sap.ui.core.mvc.View} oView - Vista actual
		 * @param {Function} fnRefreshCallback - Callback opcional para refrescar datos después de crear
		 * @returns {Promise} Promise que se resuelve cuando el registro se crea exitosamente
		 */
		deleteGuardia: function (sId, oView) {
			var that = this;
			return new Promise(function (resolve, reject) {
				if (!sId) {
					Logger.error("LibroGuardiaService.deleteGuardia: No se proporcionó el Id del registro");
					reject(new Error("El Id del registro es requerido para eliminar"));
					return;
				}

				var sEmpresa = that._getEmpresa(oView);
				if (!sEmpresa) {
					Logger.error("LibroGuardiaService.deleteGuardia: No se pudo obtener la empresa");
					reject(new Error("No se pudo obtener la empresa"));
					return;
				}

				var oModel = null;
				if (oView) {
					oModel = oView.getModel("LGuardias");
				}
				if (!oModel) {
					oModel = sap.ui.getCore().getModel("LGuardias");
				}
				if (!oModel) {
					Logger.error("LibroGuardiaService.deleteGuardia: No se pudo obtener el modelo OData");
					reject(new Error("No se pudo obtener el modelo OData"));
					return;
				}

				var sPath = that._entitySet + "(Id='" + sId + "',Empresa='" + sEmpresa + "')";

				oModel.remove(sPath, {
					success: function () {
						Logger.info("LibroGuardiaService.deleteGuardia: Registro eliminado correctamente", { id: sId });
						MessageToast.show("Registro eliminado correctamente");
						resolve();
					},
					error: function (oError) {
						Logger.error("LibroGuardiaService.deleteGuardia: Error al eliminar registro", oError);
						ErrorHandler.handleODataError(oError, "eliminar registro en Libro de Guardia");
						reject(oError);
					}
				});
			});
		},

		createGuardiaAndRefresh: function (oData, oView, fnRefreshCallback) {
			return this.createGuardia(oData, oView)
				.then(function (oResponse) {
					// Publicar evento para refrescar datos en Main
					var oBus = sap.ui.getCore().getEventBus();
					if (oBus) {
						oBus.publish("Main", "onInit");
						Logger.debug("LibroGuardiaService.createGuardiaAndRefresh: Evento publicado para refrescar datos");
					}

					// Ejecutar callback de refresco si se proporciona
					if (fnRefreshCallback && typeof fnRefreshCallback === "function") {
						fnRefreshCallback();
					}

					return oResponse;
				})
				.catch(function (oError) {
					Logger.error("LibroGuardiaService.createGuardiaAndRefresh: Error", oError);
					throw oError;
				});
		}
	};
});
