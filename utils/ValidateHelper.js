sap.ui.define([
	//helpers
	"sap/ui/core/format/NumberFormat",
	"sap/ui/core/format/DateFormat",
	"transener/registrocronologicoeventos/utils/FormatHelper"
], function (NumberFormat, DateFormat, FormatHelper) {
	"use strict";

	return {

		errors: [],

		_oData: null,
		make: function (data, rules) {
			this._clearData(data);
			this._oData = data;
			this._clearErrors(data);
			for (var property in rules) {
				if (!(property in data)) {
					data[property] = null;
				}
			}
			if (data.length < rules.length) return false;
			for (var property in data) {
				var value = data[property];
				var stop = false;
				for (var index in rules[property]) {
					var rule = rules[property][index];
					var isNotValid, error;
					if (!stop) {
						switch (rule) {
							//para casos mail
							//para casos de campos requeridos
						case 'required':
							var type = FormatHelper.getType(value);
							if (type === "array") {
								isNotValid = value.length === 0;
							} else {
								isNotValid = this._required(value);
							}
							if (isNotValid) {
								error = {};
								error[property] = rule;
								this.errors.push(error);
								stop = true;
							}
							break;
						case "mail":
							isNotValid = this._mail(value);
							if (!isNotValid) {
								error = {};
								error[property] = rule;
								this.errors.push(error);
								stop = true;
							}
							break;
						case "cuil":
							isNotValid = this._cuil(value);
							if (!isNotValid) {
								error = {};
								error[property] = rule;
								this.errors.push(error);
								stop = true;
							}
							break;
						case 'numeric':
							if (value != null && value != "") {
								isNotValid = (value == null || value == "") ? false : this._type('number', (isNaN(parseInt(value))) ? "" : parseInt(value));
								if (isNotValid) {
									error = {};
									error[property] = rule;
									this.errors.push(error);
									stop = true;
								}
							}
							break;
						case 'date':
							isNotValid = (value == null || value == "") ? false : this._type('date', value);
							if (isNotValid) {
								error = {};
								error[property] = rule;
								this.errors.push(error);
								stop = true;
							}
							break;
						default:
							var r = rule.split(':');
							switch (r[0]) {
							case 'min':
								isNotValid = (value == null || value == "") ? false : this._min(value, parseInt(r[1]));
								if (isNotValid) {
									error = {};
									error[property] = r[0];
									this.errors.push(error);
									stop = true;
								}
								break;
							case 'max':
								isNotValid = (value == null || value == "") ? false : this._max(value, parseInt(r[1]));
								if (isNotValid) {
									error = {};
									error[property] = r[0];
									this.errors.push(error);
									stop = true;
								}
								break;
							case 'maxDate':
								isNotValid = (value == null || value == "") ? false : this._dateMax(value, data[r[1]]);
								if (isNotValid) {
									error = {};
									error[property] = r[0];
									this.errors.push(error);
									stop = true;
								}
								break;
							case 'minDate':
								isNotValid = (value == null || value == "") ? false : this._dateMin(value, data[r[1]]);
								if (isNotValid) {
									error = {};
									error[property] = r[0];
									this.errors.push(error);
									stop = true;
								}
								break;
							}
							break;
						}
					}
				}
			}
			this._attachErrors();
			return (this.errors.length > 0);
		},

		_required: function (value) {
			return (value === "" || value === null);
		},

		_mail: function (value) {
			return (/(.+)@(.+){2,}\.(.+){2,}/.test(value));
		},

		_cuil: function (value) {
			if (value.length !== 11) {
				return false;
			}

			var acumulado = 0;
			var digitos = value.split("");
			var digito = digitos.pop();

			for (var i = 0; i < digitos.length; i++) {
				acumulado += digitos[9 - i] * (2 + (i % 6));
			}

			var verif = 11 - (acumulado % 11);
			if (verif === 11) {
				verif = 0;
			} else if (verif === 10) {
				verif = 9;
			}

			return digito === verif.toString();
		},

		//se realizó esta funcion porque tambien es necesario dejar pasar si el cuil es vacio 
		_cuilOptional: function (value) {
			if (value === "") {
				return true
			} else {
				if (value.length !== 11) {
					return false;
				}

				var acumulado = 0;
				var digitos = value.split("");
				var digito = digitos.pop();

				for (var i = 0; i < digitos.length; i++) {
					acumulado += digitos[9 - i] * (2 + (i % 6));
				}

				var verif = 11 - (acumulado % 11);
				if (verif === 11) {
					verif = 0;
				} else if (verif === 10) {
					verif = 9;
				}
				return digito === verif.toString();
			}
		},

		_min: function (value, length) {
			return (value.length < length);
		},

		_max: function (value, length) {
			return (value.length > length);
		},

		_dateMax: function (date, dateMax) {
			return (date > dateMax);
		},

		_dateMin: function (date, dateMin) {
			return (date < dateMin);
		},

		_type: function (expected, value) {
			var type = ({}).toString.call(value).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
			return (type != expected);
		},

		_clearErrors: function (data) {
			for (var property in data) {
				if (property.substr(property.length - 5, property.length - 1) == "State") {
					data[property] = null;
				}
			}
			this.errors.length = 0;
		},

		_attachErrors: function () {
			for (var index in this.errors) {
				for (var property in this.errors[index]) {
					var rule = this.errors[index][property];
					this._oData[property + "State"] = "Error";
					this._oData[property + "StateMessage"] = "";
					switch (rule) {
					case 'required':
						this._oData[property + "StateMessage"] = "Este campo es requerido";
						break;
					case 'numeric':
						this._oData[property + "StateMessage"] = "Este campo debe ser numerico";
						break;
					case 'date':
						this._oData[property + "StateMessage"] = "Este campo debe ser de formato fecha";
						break;
					case 'mail':
						this._oData[property + "StateMessage"] = "El formato de mail es invalido";
						break;
					case 'cuil':
						this._oData[property + "StateMessage"] = "CUIL Invalido";
						break;
					}
				}
			}
			//this._oModel.updateBindings(true);
		},

		resetErrors: function () {
			for (var index in this.errors) {
				for (var property in this.errors[index]) {
					this._oData[property + "State"] = "None";
				}
			}
		},

		_clearData: function (oModelData) {
			for (var property in oModelData) {
				if (oModelData.hasOwnProperty(property + "State")) {
					delete oModelData[property + "State"];
				}
				if (oModelData.hasOwnProperty(property + "StateMessage")) {
					delete oModelData[property + "StateMessage"];
				}
			}
		}

	};
});