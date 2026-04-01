sap.ui.define(["sap/ui/core/format/NumberFormat", "sap/ui/core/format/DateFormat"], function (NumberFormat, DateFormat) {
	"use strict";
	return {

		formatThousands: function (sValue) {
			if (!sValue && sValue !== 0) { return ""; }
			var s = sValue.toString();
			// Si tiene punto pero no coma, viene del backend (punto = decimal)
			// Ej: "4444.00000" -> convertir a "4444,00000"
			if (s.indexOf(".") !== -1 && s.indexOf(",") === -1) {
				s = s.replace(".", ",");
			}
			var aParts = s.split(",");
			// La parte entera no debe tener puntos residuales
			var sEntero = aParts[0].replace(/[^0-9]/g, "");
			var sFormatted = sEntero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
			return aParts.length > 1 ? sFormatted + "," + aParts[1] : sFormatted;
		},

		formatNumber: function (sValue) {
			if (!sValue && sValue !== 0) {
				return "0";
			}
			var fValue = parseFloat(sValue);
			if (isNaN(fValue)) {
				return "0";
			}
			var oFormat = NumberFormat.getFloatInstance({
				groupingEnabled: true,
				groupingSeparator: ".",
				decimalSeparator: ",",
				maxFractionDigits: 2,
				minFractionDigits: 2
			});
			return oFormat.format(fValue);
		},

		formatMinutesToHHMM: function (sValue) {
			if (!sValue && sValue !== 0) {
				return "00:00";
			}
			var iMinutes = parseInt(sValue, 10);
			if (isNaN(iMinutes)) {
				return "00:00";
			}
			var iHours = Math.floor(iMinutes / 60);
			var iMins = iMinutes % 60;
			return (iHours < 10 ? "0" : "") + iHours + ":" + (iMins < 10 ? "0" : "") + iMins;
		},

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