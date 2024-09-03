sap.ui.define([], function () {
	"use strict";
	return {
		aMessages: [],

		getMessages: function () {
			return this.aMessages;
		},

		cleanMessages: function () {
			this.aMessages = [];
		},

		addMessage: function (sMessage, sTab) {
			this.getMessages().push({
				tab: sTab,
				message: sMessage
			});
		},

		generateMessageContent: function () {
			var oVBox = new sap.m.VBox({
				items: []
			});

			var aMessages = this.getMessages();
			for (var i = 0; i < aMessages.length; i++) {
				oVBox.addItem(new sap.m.Text({
					text: aMessages[i].tab + " " + aMessages[i].message
				}));
			}
			return oVBox;
		}

	};

});