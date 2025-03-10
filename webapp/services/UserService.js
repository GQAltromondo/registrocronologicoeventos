sap.ui.define([

    "transener/registrocronologicoeventos/utils/ModelHelper",
    "transener/registrocronologicoeventos/utils/FioriHelper"
], function (ModelHelper, FioriHelper) {
    "use strict";
    return {
        loadModel: async function (callback) {
            this.callback = callback;
            const url = sap.ui.getCore().getModel("appCurrentInfo").appUrl + "/user-api/currentUser";
            const oModel = new sap.ui.model.json.JSONModel();
            const mock = {
                firstname: "Dummy",
                lastname: "User",
                email: "dummy.user@com",
                name: "dummy.user@com",
                displayName: "Dummy User (dummy.user@com)",
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

            try {
                // Load user data
                oModel.loadData(url);
                await oModel.dataLoaded();

                const userData = oModel.getData();

                // If API call failed or no name is returned, use mock data
                if (!userData.name) {
                    oModel.setData(mock);
                    return;
                }

                // Fetch additional user info
                await this.fetchUserDetails(userData.name, oModel);
            } catch (error) {
                console.error("Error loading user data:", error);
                oModel.setData(mock);
            }
        },

        fetchUserDetails: async function (userName, oModel) {
            const cUrl = sap.ui.getCore().getModel("appCurrentInfo").appUrl + `/IAS/service/scim/Users?filter=userName eq "${userName}"`;

            try {
                const response = await $.ajax({
                    type: "GET",
                    contentType: "application/scim+json",
                    url: cUrl,
                    dataType: "json",
                    async: true // Making this truly async
                });

                if (response && response.Resources) {
                    const oModelUser = new sap.ui.model.json.JSONModel();
                    oModelUser.setData(response.Resources);
                    const aDatosUsuario = this.armarDatos(response.Resources);
                    this.onReadUserApiSuccess(aDatosUsuario);
                    oModel.setData(aDatosUsuario);
                } else {
                    throw new Error("Invalid API response");
                }
            } catch (error) {
                console.error("Error fetching user details:", error);
                this.onReadUserApiError(error);
            }
        }
,        

        armarDatos: function (datos) {

            var aGroupsTemporal = datos[0].corporateGroups ? datos[0].corporateGroups : datos[0].groups;

            var aGroups = aGroupsTemporal.map(function (fila) {
                return fila.value;
            });

            var aUserData = {
                firstName: datos[0].name.givenName,
                lastName: datos[0].name.familyName,
                email: datos[0].emails[0].value,
                name: datos[0].emails[0].value,
                displayName: datos[0].displayName,
                login_name: datos[0].userName,
                groups: aGroups


            };

            return aUserData;

        },

        getRoles: function (groupData) {
            var aData = [];
            if (groupData.constructor === Array) {
                aData = aData.concat(groupData);
            } else {
                if (groupData !== "") {
                    aData.push(groupData);
                }
            }
            return aData;
        },

        onReadUserApiSuccess: function (data, textStatus, jqXHR) {

            ModelHelper.getModel("UserJsonModel").setData({
                nombre: data.firstName,
                apellido: data.lastName,
                login_name: data.login_name,
                email: data.email,
                // roles: ["Supervisor_MantenimienTto"],

                // Paso 1 para creacion de licencias.
                // roles: ["ope_solic-lic_transener", "ope_solic-lic_transener"],
                // (Nuevo rol ope_solic-lic_transba Issue #518).
                // roles: ["ope_solic-lic_transba"],

                // Paso 2 Coordinador.
                // roles: ["Coordinador_Mantenimiento"],
                // roles: ["Coordinador_Mantenimiento"],

                // Paso 3 Tramitado -> tramita u observa.
                //roles: ["Tramitador"],

                // Paso 4 Entraga, devolución y cancelación definitiva.
                //roles: ["ope_jefe_cot"],
                //roles: ["Jefe_COT"]
                // roles: ["ope_programacion_cotdt"],
                //roles:["Programacion_COTDT"]
                // roles: ["ope_oper-turno_cot"],

                // IMPORTANTE: deployear siempre con este descomentado.
                // ##########################################################################
                // ############################## IMPORTANTE ################################
                // ##########################################################################
                roles: this.getRoles(data.groups)
                // ##########################################################################
                // ##########################################################################
            });
        },

        onReadUserApiError: function (jqXHR, textStatus, error) {
            //verifies if session is still active
            var sessionTimeoutResponseCode = 503;
            if (error.response.statusCode === sessionTimeoutResponseCode) {
                //session timeout
                FioriHelper.showSessionTimeoutMessageBox();
                return;
            }

            //gets error
            var errorText = error.response.body;
            //parses error
            var contentType = error.response.headers["Content-Type"];
            if (contentType.indexOf("text/html") >= 0) {
                //HTML
                errorText = $(error.response.body).text();
            } else if (contentType.indexOf("application/json") >= 0) {
                //JSON
                try {
                    var oError = JSON.parse(errorText);
                    errorText = oError.error.message.value;
                } catch (ex) {
                    //error in parsing
                    errorText = error.response.body;
                }
            }
        },


    };
});