sap.ui.define([
	//helpers
], function() {
	"use strict";

	return {
		
		_servicePathPrefix: "/services/userapi",
		_servicePath: "/attributes",
		
		getModel: function() {
			//gets component
			//gets model
			var jsonModel = sap.ui.getCore().getModel("UserData");
			//checks if the model exists
			if (!jsonModel) {
				jsonModel = new sap.ui.model.json.JSONModel();
				jsonModel.setSizeLimit(9999);
				sap.ui.getCore().setModel(jsonModel, "UserData");
				//initilializing
				jsonModel.setData({});
			}
			return jsonModel;
		},
		
		loadModel: function(callback) {
			var UserDataService = this;
			this.callback = callback;
			//reads user api
			var path = this._servicePathPrefix + this._servicePath;
			
			console.log(path)
			jQuery.ajax(path + "?multiValuesAsArrays=true", {
				method: "GET",
				success: jQuery.proxy(UserDataService.onReadUserApiSuccess, UserDataService),
				error: jQuery.proxy(UserDataService.onReadUserApiError, UserDataService)
			});
		},
		
		onReadUserApiSuccess: function(data, textStatus, jqXHR) {
			//creates model
			
			console.log(data)
			var jsonModel = this.getModel();
			//sets data
			jsonModel.setData(data);
			if(this.callback) {
				this.callback(data);
				this.callback = null;
			}
		},
				
		onReadUserApiError: function(jqXHR, textStatus, error) {
			//verifies if session is still active
					console.log(jqXHR,textStatus,error)
			var sessionTimeoutResponseCode = 503;
			if (error.status === sessionTimeoutResponseCode) {
				//session timeout
				//FioriHelper.showSessionTimeoutMessageBox();
				return;
			}

			//gets error
			var errorText = error.response.body;
			//parses error
			var contentType = error.response.headers["Content-Type"];
			if (contentType.indexOf("text/html") >= 0) {
				//HTML
				errorText = $(error.response.body).text();
			}
			else if (contentType.indexOf("application/json") >= 0) {
				//JSON
				try {
					var oError = JSON.parse(errorText);
					errorText = oError.error.message.value;
				} catch (ex) {
					//error in parsing
					errorText = error.response.body;
				}
			}
			
			//error message
			//errorText = i18nTranslationHelper.getTranslation("ErrorLoadingAssignedTaxNumbers") + ". \n\n" + errorText;
			//MessageBoxHelper.showAlert("Error", errorText);
		}

	};
});