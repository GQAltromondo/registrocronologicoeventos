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

		_expandGuardia: "NovedadesSet,ManiobrasOperativas_nav,NormalizacionLG_nav,Alarmas_nav,CargaEquipos_nav,FueraBanda_nav",

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
		},

		_getLGModel: function (oView) {
			var oModel = null;
			if (oView) {
				oModel = oView.getModel("LGuardias");
			}
			if (!oModel) {
				oModel = sap.ui.getCore().getModel("LGuardias");
			}
			if (!oModel) {
				oModel = oDataServices.getModel();
			}
			return oModel;
		},

		getGuardiaConDetalle: function (sId, sEmpresa, oView) {
			var that = this;
			return new Promise(function (resolve, reject) {
				if (!sId) {
					Logger.warn("LibroGuardiaService.getGuardiaConDetalle: Id requerido");
					reject(new Error("El Id de la guardia es requerido"));
					return;
				}
				var sEmp = sEmpresa || that._getEmpresa(oView);
				if (!sEmp) {
					Logger.warn("LibroGuardiaService.getGuardiaConDetalle: Empresa requerida");
					reject(new Error("La Empresa es requerida"));
					return;
				}
				var oModel = that._getLGModel(oView);
				if (!oModel) {
					Logger.error("LibroGuardiaService.getGuardiaConDetalle: No se pudo obtener el modelo OData");
					reject(new Error("No se pudo obtener el modelo OData"));
					return;
				}
				var sPath = that._entitySet + "(Id='" + sId + "',Empresa='" + sEmp + "')";
				Logger.debug("LibroGuardiaService.getGuardiaConDetalle: Leyendo", { path: sPath, expand: that._expandGuardia });
				oModel.read(sPath, {
					urlParameters: { "$expand": that._expandGuardia },
					success: function (oData) {
						Logger.info("LibroGuardiaService.getGuardiaConDetalle: Guardia leída con detalle", { id: sId });
						resolve(oData);
					},
					error: function (oError) {
						Logger.error("LibroGuardiaService.getGuardiaConDetalle: Error al leer guardia con detalle", oError);
						ErrorHandler.handleODataError(oError, "leer guardia con detalle");
						reject(oError);
					}
				});
			});
		},

		_createChild: function (sSet, oData, sAccion, oView) {
			var that = this;
			return new Promise(function (resolve, reject) {
				if (!oData) {
					reject(new Error("No se proporcionaron datos para " + sAccion));
					return;
				}
				var oPayload = Object.assign({}, oData);
				delete oPayload.__metadata;
				if (!oPayload.Empresa) {
					oPayload.Empresa = that._getEmpresa(oView);
				}
				if (!oPayload.Empresa || !oPayload.IdNovedad) {
					Logger.warn("LibroGuardiaService." + sAccion + ": Faltan Empresa o IdNovedad", oPayload);
					reject(new Error("Empresa e IdNovedad son requeridos"));
					return;
				}
				var oModel = that._getLGModel(oView);
				if (!oModel) {
					reject(new Error("No se pudo obtener el modelo OData"));
					return;
				}
				Logger.debug("LibroGuardiaService." + sAccion + ": Creando", oPayload);
				oModel.create(sSet, oPayload, {
					success: function (oResp) {
						Logger.info("LibroGuardiaService." + sAccion + ": Registro creado");
						MessageToast.show("Registro creado correctamente");
						resolve(oResp);
					},
					error: function (oError) {
						Logger.error("LibroGuardiaService." + sAccion + ": Error", oError);
						ErrorHandler.handleODataError(oError, sAccion);
						reject(oError);
					}
				});
			});
		},

		_updateChild: function (sSet, oData, aKeyNames, sAccion, oView) {
			var that = this;
			return new Promise(function (resolve, reject) {
				if (!oData) {
					reject(new Error("No se proporcionaron datos para " + sAccion));
					return;
				}
				var oPayload = Object.assign({}, oData);
				delete oPayload.__metadata;
				if (!oPayload.Empresa) {
					oPayload.Empresa = that._getEmpresa(oView);
				}
				for (var i = 0; i < aKeyNames.length; i++) {
					if (!oPayload[aKeyNames[i]]) {
						Logger.warn("LibroGuardiaService." + sAccion + ": Falta clave " + aKeyNames[i], oPayload);
						reject(new Error("Falta clave requerida: " + aKeyNames[i]));
						return;
					}
				}
				var oModel = that._getLGModel(oView);
				if (!oModel) {
					reject(new Error("No se pudo obtener el modelo OData"));
					return;
				}
				var aKeyParts = aKeyNames.map(function (k) {
					return k + "='" + oPayload[k] + "'";
				});
				var sPath = sSet + "(" + aKeyParts.join(",") + ")";
				Logger.debug("LibroGuardiaService." + sAccion + ": Actualizando", { path: sPath, payload: oPayload });
				oModel.update(sPath, oPayload, {
					method: "PUT",
					success: function (oResp) {
						Logger.info("LibroGuardiaService." + sAccion + ": Registro actualizado");
						MessageToast.show("Registro actualizado correctamente");
						resolve(oResp);
					},
					error: function (oError) {
						Logger.error("LibroGuardiaService." + sAccion + ": Error", oError);
						ErrorHandler.handleODataError(oError, sAccion);
						reject(oError);
					}
				});
			});
		},

		_deleteChild: function (sSet, oKeys, aKeyNames, sAccion, oView) {
			var that = this;
			return new Promise(function (resolve, reject) {
				if (!oKeys) {
					reject(new Error("No se proporcionaron claves para " + sAccion));
					return;
				}
				var oK = Object.assign({}, oKeys);
				if (!oK.Empresa) {
					oK.Empresa = that._getEmpresa(oView);
				}
				for (var i = 0; i < aKeyNames.length; i++) {
					if (!oK[aKeyNames[i]]) {
						Logger.warn("LibroGuardiaService." + sAccion + ": Falta clave " + aKeyNames[i], oK);
						reject(new Error("Falta clave requerida: " + aKeyNames[i]));
						return;
					}
				}
				var oModel = that._getLGModel(oView);
				if (!oModel) {
					reject(new Error("No se pudo obtener el modelo OData"));
					return;
				}
				var aKeyParts = aKeyNames.map(function (k) {
					return k + "='" + oK[k] + "'";
				});
				var sPath = sSet + "(" + aKeyParts.join(",") + ")";
				Logger.debug("LibroGuardiaService." + sAccion + ": Eliminando", { path: sPath });
				oModel.remove(sPath, {
					success: function () {
						Logger.info("LibroGuardiaService." + sAccion + ": Registro eliminado");
						MessageToast.show("Registro eliminado correctamente");
						resolve();
					},
					error: function (oError) {
						Logger.error("LibroGuardiaService." + sAccion + ": Error", oError);
						ErrorHandler.handleODataError(oError, sAccion);
						reject(oError);
					}
				});
			});
		},

		createManiobra: function (oData, oView) {
			return this._createChild("/ManiobrasOperativasSet", oData, "createManiobra", oView);
		},
		updateManiobra: function (oData, oView) {
			return this._updateChild("/ManiobrasOperativasSet", oData, ["Empresa", "IdNovedad", "Posicion"], "updateManiobra", oView);
		},
		deleteManiobra: function (oKeys, oView) {
			return this._deleteChild("/ManiobrasOperativasSet", oKeys, ["Empresa", "IdNovedad", "Posicion"], "deleteManiobra", oView);
		},

		createNormalizacion: function (oData, oView) {
			return this._createChild("/NormalizacionLGSet", oData, "createNormalizacion", oView);
		},
		updateNormalizacion: function (oData, oView) {
			return this._updateChild("/NormalizacionLGSet", oData, ["Empresa", "IdNovedad"], "updateNormalizacion", oView);
		},
		deleteNormalizacion: function (oKeys, oView) {
			return this._deleteChild("/NormalizacionLGSet", oKeys, ["Empresa", "IdNovedad"], "deleteNormalizacion", oView);
		},

		createAlarma: function (oData, oView) {
			return this._createChild("/AlarmasLGSet", oData, "createAlarma", oView);
		},
		updateAlarma: function (oData, oView) {
			return this._updateChild("/AlarmasLGSet", oData, ["Empresa", "IdNovedad", "Posicion"], "updateAlarma", oView);
		},
		deleteAlarma: function (oKeys, oView) {
			return this._deleteChild("/AlarmasLGSet", oKeys, ["Empresa", "IdNovedad", "Posicion"], "deleteAlarma", oView);
		},

		createCargaEquipo: function (oData, oView) {
			return this._createChild("/CargaEquiposSet", oData, "createCargaEquipo", oView);
		},
		updateCargaEquipo: function (oData, oView) {
			return this._updateChild("/CargaEquiposSet", oData, ["Empresa", "IdNovedad", "Posicion"], "updateCargaEquipo", oView);
		},
		deleteCargaEquipo: function (oKeys, oView) {
			return this._deleteChild("/CargaEquiposSet", oKeys, ["Empresa", "IdNovedad", "Posicion"], "deleteCargaEquipo", oView);
		},

		createFueraBanda: function (oData, oView) {
			return this._createChild("/FueraBandaSet", oData, "createFueraBanda", oView);
		},
		updateFueraBanda: function (oData, oView) {
			return this._updateChild("/FueraBandaSet", oData, ["Empresa", "IdNovedad", "Posicion"], "updateFueraBanda", oView);
		},
		deleteFueraBanda: function (oKeys, oView) {
			return this._deleteChild("/FueraBandaSet", oKeys, ["Empresa", "IdNovedad", "Posicion"], "deleteFueraBanda", oView);
		}
	};
});
