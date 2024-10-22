sap.ui.define([
	//utils
"transener/registrocronologicoeventos/utils/ModelHelper"
], function(ModelHelper) {
	"use strict";

	return {
		getTranslation: function(i18nMessage, parameterArray) {
		
		
			var i18nModel = ModelHelper.getModel("i18n");
			console.log(i18nModel)
			var translation = i18nModel.getResourceBundle().getText(i18nMessage, parameterArray);
			if (translation) {
				return translation;
			}
			return i18nMessage;
		}

	};
});