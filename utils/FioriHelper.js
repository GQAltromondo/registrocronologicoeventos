sap.ui.define([
	//helpers
	"transener/registrocronologicoeventos/utils/MessageBoxHelper"
], function(MessageBoxHelper) {
	"use strict";

	return {

		getAppPath: function() {
			return jQuery.sap.getModulePath("transener.registrocronologicoeventos") + "/";
		},

		// /*******************************session timeout***************************/
		// loadCorporateStyling: function() {
		// 	var corporateStylePath = "transenerstyling/css/styles.css";
		// 	//checks if app is running on SAPWeb IDE or deployed version
		// 	var serverPath = "";
		// 	if (window.location.hostname.indexOf("webidetesting") >= 0) {
		// 		//SAP web ide
		// 		serverPath = "/destinations/transenerStyling/";
		// 	} else {
		// 		//deployed version
		// 		serverPath = "/sap/fiori/";
		// 	}
		// 	var path = serverPath + corporateStylePath;
		// 	jQuery.sap.includeStyleSheet(path);
		// },

		// /*******************************session timeout***************************/
		loadSessionTimeoutReload: function() {
			var FioriHelper = this;
			//attaches lister for ajax resuests
			jQuery(document).ajaxComplete(function(e, jqXHR) {
				//checks response for timeout
				var sessionTimeout = FioriHelper._responseHasSessionTimeout(jqXHR);
				if (sessionTimeout) {
					FioriHelper.showSessionTimeoutMessageBox();
				}
			});
		},

		showSessionTimeoutMessageBox: function() {
			MessageBoxHelper.showAlert(
				"SessionTimeout",
				"SessionHasExpiredThePageWillNowReload",
				jQuery.proxy(this._reloadPage, this)
			);
		},

		_responseHasSessionTimeout: function(jqXHR) {
			var contentType = jqXHR.getResponseHeader("Content-Type");
			var status = jqXHR.status;
			return ((status === 503) &&
				(contentType && contentType.indexOf("text/html") === 0));
		},

		_reloadPage: function() {
			window.location.reload();
		}

	};
});