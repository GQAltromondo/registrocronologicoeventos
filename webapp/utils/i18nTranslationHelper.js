sap.ui.define([
	//utils
"transener/registrocronologicoeventos/utils/ModelHelper",
"transener/registrocronologicoeventos/utils/Logger"
], function(ModelHelper, Logger) {
	"use strict";

	return {
		getTranslation: function(i18nMessage, parameterArray) {
		
		
			var i18nModel = ModelHelper.getModel("i18n");
			Logger.debug("Obteniendo traducción", { message: i18nMessage, model: i18nModel });
			var translation = i18nModel.getResourceBundle().getText(i18nMessage, parameterArray);
			if (translation) {
				return translation;
			}
			return i18nMessage;
		}

	};
});