sap.ui.define(["sap/ui/core/format/NumberFormat", "sap/ui/core/format/DateFormat"], function (NumberFormat, DateFormat) {
	"use strict";
	return {

		uppercase: function (string) {
			if (!string) {
				return
			} else {
				return string.toUpperCase()
			}
		},
		novedadType: function (novedad) {
			switch (novedad) {
			case "C":
				return "Comentario";
			case "D":
				return "Desconexion";
			case "P":
				return "Perturbacion";
			case "I":
				return "Indisponibilidad";
			default:
				return novedad;
			}
		},
		formatDateWithoutGMT: function (dateString) {
			if (!dateString) {
				return "";
			}
			var date = new Date(dateString);
			return DateFormat.getDateTimeInstance({
				pattern: "dd/MM/yyyy HH:mm"
			}).format(date);
		},
		formatComboText: function (sCodigo) {
			var sDescripcion = this.getView().getModel("Estaciones").getProperty(this.getBindingContext("Estaciones").getPath() + "/Descripcion");
			return sCodigo + " - " + sDescripcion;
		},

		formatDescripcionCod: function (sDescripcion, sCod) {
			if (!sDescripcion || !sCod) {
				return "";
			}
			return sDescripcion + " - " + sCod;
		},
		formatName: function (bEditable) {
			return (bEditable) ? "Guardar Cambios" : "Guardar";
		},

	};
});