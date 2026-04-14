sap.ui.define([
    "transener/registrocronologicoeventos/utils/ModelHelper",
    "transener/registrocronologicoeventos/utils/FioriHelper",
    "transener/registrocronologicoeventos/utils/Logger",
    "transener/registrocronologicoeventos/utils/ErrorHandler",
    "transener/registrocronologicoeventos/utils/Constants"
], function (ModelHelper, FioriHelper, Logger, ErrorHandler, Constants) {
    "use strict";
    return {
        isLocalDev: function () {
            try {
                const loc = window.location || {};
                const hostname = (loc.hostname || "").toLowerCase();
                const port = String(loc.port || "");
                const host = (loc.host || "").toLowerCase();

                const isLoopback = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
                const isPort8080Classic = port === "8080" || host.endsWith(":8080");

                // BAS/AppStudio típico: "port8080-workspaces-....applicationstudio.cloud.sap"
                const isBASPort8080 = hostname.startsWith("port8080-");

                // Por si corrés preview con otros puertos en BAS (opcional, no molesta)
                const isBASPortXXXX = /^port\d+-/.test(hostname);

                return isLoopback || isPort8080Classic || isBASPort8080 || isBASPortXXXX;
            } catch (e) {
                return false;
            }
        },

        loadModel: async function (callback) {
            this.callback = callback;

            const oModel = new sap.ui.model.json.JSONModel();

            const mock = {
                firstName: "Dummy",
                lastName: "User",
                email: "dummy.user@com",
                name: "dummy.user@com",
                displayName: "Dummy User (dummy.user@com)",
                login_name: "dummy.user@com",
                groups: [
                    "Mantenimiento_GerRegional",
                    "Examinadores_PT15",
                    "Selector_evaluadores_PT15",
                    "seguridadH_PT15",
                    "Rep_Direccion_PT15",
                    "MedicinaLaboral_PT15",
                    "Gestion_Calidad_PT152",
                    "Direccion_TecnicaPT15",
                    "Auditor_Externo",
                    "Gestion_habilitaciones",
                    "Solicitante_PT15",
                    "Mantenimiento_Secretaria",
                    "Director_Tecnico",
                    "Ger_Operaciones",
                    "Aprobacion_Habilitaciones"
                ]
            };

            if (this.isLocalDev()) {
                oModel.setData(mock);
                this.onReadUserApiSuccess(mock);
                this.onSuccessUserApi(mock);
                return;
            }

            try {
                const url = sap.ui.getCore().getModel("appCurrentInfo").appUrl + "/user-api/currentUser";

                oModel.loadData(url);
                await oModel.dataLoaded();

                const userData = oModel.getData();

                if (!userData.name) {
                    oModel.setData(mock);
                    this.onReadUserApiSuccess(mock);
                    this.onSuccessUserApi(mock);
                    return;
                }

                await this.fetchUserDetails(userData.name, oModel);
            } catch (error) {
                Logger.error("Error loading user data", error);
                oModel.setData(mock);
                this.onReadUserApiSuccess(mock);
                this.onSuccessUserApi(mock);
            }
        },

        fetchUserDetails: async function (userName, oModel) {
            const cUrl = sap.ui.getCore().getModel("appCurrentInfo").appUrl +
                `/IAS/service/scim/Users?filter=userName eq "${userName}"`;

            try {
                const response = await $.ajax({
                    type: "GET",
                    contentType: "application/scim+json",
                    url: cUrl,
                    dataType: "json",
                    async: true
                });

                if (response && response.Resources) {
                    const aDatosUsuario = this.armarDatos(response.Resources);
                    this.onReadUserApiSuccess(aDatosUsuario);
                    this.onSuccessUserApi(aDatosUsuario);
                    oModel.setData(aDatosUsuario);
                } else {
                    throw new Error("Invalid API response");
                }
            } catch (error) {
                Logger.error("Error fetching user details", error);
                this.onReadUserApiError(error);
            }
        },

        armarDatos: function (datos) {
            var aGroupsTemporal = datos[0].corporateGroups ? datos[0].corporateGroups : datos[0].groups;

            var aGroups = aGroupsTemporal.map(function (fila) {
                return fila.value;
            });

            return {
                firstName: datos[0].name.givenName,
                lastName: datos[0].name.familyName,
                email: datos[0].emails[0].value,
                name: datos[0].emails[0].value,
                displayName: datos[0].displayName,
                login_name: datos[0].userName,
                groups: aGroups
            };
        },

        getRoles: function (groupData) {
            var aData = [];
            if (groupData && groupData.constructor === Array) {
                aData = aData.concat(groupData);
            } else {
                if (groupData !== "") {
                    aData.push(groupData);
                }
            }
            return aData;
        },

        onReadUserApiSuccess: function (data) {
            ModelHelper.getModel("UserJsonModel").setData({
                nombre: data.firstName,
                apellido: data.lastName,
                login_name: data.login_name,
                email: data.email,
                roles: this.getRoles(data.groups)
            });
        },

        onSuccessUserApi: function (data) {
            var UserDataModel = data;
            UserDataModel.oVisualizador = true;
            UserDataModel.viewEquipos = this.validateViewEquipos(UserDataModel.groups);
            UserDataModel.isEditor = this._checkIsEditor(UserDataModel.groups);

            UserDataModel.DateNow = new Date();
            var oModel = ModelHelper.getModel("UserDataModel");
            oModel.setData(UserDataModel);

            setInterval(function () {
                oModel.setProperty("/DateNow", new Date());
            }, 60 * 1000);
        },

        onErrorUserApi: function () { },

        ValidateVisualizador: function (Groups) {
            if (typeof Groups === "string") {
                Groups = [Groups];
            }
            return !Groups.some(group => group === "ope_visualizador" || group === "Visualizador");
        },

        validateViewEquipos: function (groups) {
            const roles = [
                "Programacion_COTDT", "Programacion_COT", "Jefe_COTDT", "Jefe_COT",
                "ope_programacion_cotdt", "ope_programacion_cot", "ope_jefe_cotdt", "ope_jefe_cot"
            ];

            if (typeof groups === "string") {
                groups = [groups];
            }

            return groups.some(group => roles.includes(group));
        },

        _checkIsEditor: function (groups) {
            if (!groups) { return false; }
            if (typeof groups === "string") { groups = [groups]; }
            return groups.some(function (group) {
                return Constants.ROLES.EDITOR_GROUPS.indexOf(group) !== -1;
            });
        },

        isEditor: function () {
            var oUserData = ModelHelper.getModel("UserDataModel").getData();
            return !!oUserData.isEditor;
        },

        isSuperOperator: function () {
            var oUserData = ModelHelper.getModel("UserDataModel").getData();
            var aGroups = oUserData.groups || [];
            if (typeof aGroups === "string") { aGroups = [aGroups]; }
            return aGroups.some(function (group) {
                return Constants.ROLES.SUPER_GROUPS.indexOf(group) !== -1;
            });
        },

        getLoginName: function () {
            var oUserData = ModelHelper.getModel("UserDataModel").getData();
            return oUserData.login_name || "";
        },

        getLegajo: function () {
            var oUserData = ModelHelper.getModel("UserDataModel").getData();
            return oUserData.Legajo || "";
        },

        onReadUserApiError: function (jqXHR, textStatus, error) {
            var sessionTimeoutResponseCode = 503;
            if (error && error.response && error.response.statusCode === sessionTimeoutResponseCode) {
                FioriHelper.showSessionTimeoutMessageBox();
                return;
            }

            var errorText = error && error.response ? error.response.body : "";
            var contentType = error && error.response && error.response.headers ? (error.response.headers["Content-Type"] || "") : "";

            if (contentType.indexOf("text/html") >= 0) {
                errorText = $(errorText).text();
            } else if (contentType.indexOf("application/json") >= 0) {
                try {
                    var oError = JSON.parse(errorText);
                    errorText = oError.error.message.value;
                } catch (ex) {
                    errorText = error && error.response ? error.response.body : "";
                }
            }
        }
    };
});
