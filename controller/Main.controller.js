sap.ui.define(["sap/ui/core/mvc/Controller", "sap/m/MessageToast", "sap/ui/model/Filter", "sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel", "sap/ui/core/Fragment", "sap/m/MessageStrip",
	"transener/registrocronologicoeventos/services/UserDataService", "transener/registrocronologicoeventos/utils/formatter"
], function (e, t, o, s, i, a, r, l, n) {
	"use strict";
	var d = null;
	return e.extend("transener.registrocronologicoeventos.controller.Main", {
		testOperators: ["Bonavita", "Vandale", "Burbaud"],
		_valueHelpDialog3: null,
		currentUser: {},
		formatter: n,
		onInit: function () {
			var e = this;
			this.getView().setModel();
			this.getView().getModel("LGuardias");
			var t = new sap.ui.model.json.JSONModel({});
			this.getView().setModel(t, "utilsModel")
		},
		onAfterRendering: function () {
			this.loadSociety()
		},
		loadSociety: function () {
			var e = this;
			var t = this.getView().getModel("Operaciones");
			t.read("/EmpresaUsuarioSet", {
				success: function (t) {
					console.log(t);
					var o = t.results[0].Empresa;
					e.currentUser.Legajo = t.results[0].Legajo;
					e.currentUser.login_name = t.results[0].Usuario;
					if (o == 999) {
						e.InitSociety();
						e.getView().setModel(new sap.ui.model.json.JSONModel({
							canCreate: false
						}), "specialModel")
					} else {
						var s = e.getView().getModel("utilsModel");
						if (o == 100) {
							s.setProperty("/empresa", "Transener")
						} else {
							s.setProperty("/empresa", "Transba")
						}
						var i = true;
						if (e.currentUser.groups.includes("Programacion_COT_COTDT") || e.currentUser.groups.includes("Visualizador")) {
							i = false
						}
						e.getView().setModel(new sap.ui.model.json.JSONModel({
							canCreate: i
						}), "specialModel");
						e.society = o
					}
				},
				error: function (e) {}
			})
		},
		loadTipoNovedades: function () {
			var e = this;
			var t = [];
			t.push(new sap.ui.model.Filter("Empresa", sap.ui.model.FilterOperator.EQ, this.society));
			var o = this.getView().getModel("LGuardias");
			o.read("/TipoNovedadSet", {
				filters: t,
				success: function (t) {
					var o = new sap.ui.model.json.JSONModel({
						novs: t.results
					});
					o.setSizeLimit(99999);
					e.getView().setModel(o, "Novedades");
					sap.ui.getCore().setModel(o, "Novedades");
					var s = e.getView().getModel("Novedades");
					console.log(s.getData())
				},
				error: function (e) {}
			})
		},
		InitSociety: function () {
			this.dialogSociety = new sap.m.Dialog({
				type: sap.m.DialogType.Message,
				title: "Selección de Empresa",
				escapeHandler: function (e) {
					e.reject()
				},
				content: [new sap.m.VBox({
					items: [new sap.m.Label({
						text: "Debe seleccionar la empresa:"
					}), new sap.m.Select({
						change: [this.ValidateCombo, this],
						selectedKey: "{Society>/Code}",
						items: [new sap.ui.core.Item({
							key: "",
							text: "Elija Uno"
						}), new sap.ui.core.Item({
							key: "100",
							text: "TRANSENER S.A."
						}), new sap.ui.core.Item({
							key: "300",
							text: "TRANSBA S.A."
						})]
					})]
				})],
				buttons: [new sap.m.Button({
					icon: "sap-icon://save",
					type: sap.m.ButtonType.Emphasized,
					text: "Guardar",
					press: [this.onSelectedSociety, this]
				})]
			});
			var e = new sap.ui.model.json.JSONModel;
			this.dialogSociety.setModel(e, "Society");
			this.dialogSociety.open()
		},
		onSelectedSociety: function () {
			var e = this.dialogSociety.getModel("Society").getData().Code;
			if (e !== "" && typeof e !== "undefined") {
				this.society = e;
				var t = this.getView().getModel("utilsModel");
				if (e == 100) {
					t.setProperty("/empresa", "Transener")
				} else {
					t.setProperty("/empresa", "Transba")
				}
				this.loadTipoNovedades();
				this.loadEstaciones();
				this.loadTipoEquipo();
				this.dialogSociety.close()
			} else {
				MessageBox.alert("Debe seleccionar una de empresa!", {
					title: "Selección de Empresa"
				});
				onSer
			}
		},
		loadEstaciones: function () {
			var e = this;
			var t = this.getView().getModel("Operaciones");
			var o = [];
			o.push(new sap.ui.model.Filter("Empresa", sap.ui.model.FilterOperator.EQ, this.society));
			t.read("/EstacionesSet", {
				filters: o,
				success: function (t) {
					var o = new sap.ui.model.json.JSONModel({
						Estaciones: t.results
					});
					o.setSizeLimit(1e4);
					e.getView().setModel(o, "Estaciones");
					sap.ui.getCore().setModel(o, "Estaciones")
				},
				error: function (e) {}
			})
		},
		loadTipoEquipo: function () {
			var e = this;
			var t = this.getView().getModel("Operaciones");
			var o = [];
			o.push(new sap.ui.model.Filter("Empresa", sap.ui.model.FilterOperator.EQ, this.society));
			t.read("/TipoEquipoSet", {
				filters: o,
				success: function (t) {
					var o = new sap.ui.model.json.JSONModel({
						Tipo: t.results
					});
					o.setSizeLimit(1e4);
					e.getView().setModel(o, "TipoModel");
					sap.ui.getCore().setModel(o, "TipoModel")
				},
				error: function (e) {}
			})
		},
		getEquiposModel: function () {
			var e = this.getView().getModel("EquiposModel");
			if (!e) {
				e = new sap.ui.model.json.JSONModel;
				e.setSizeLimit(1e4);
				this.getView().setModel(e, "EquiposModel")
			}
			return e
		},
		handleChangeF: function (e) {
			var t = e.getParameter("value");
			var o = e.getSource().getSelectedKey();
			var s = this.getEquiposModel();
			s.setData({
				Equipos: [],
				busy: true
			});
			var i = [];
			if (!o) {
				onSuccessCallback({
					results: []
				});
				return
			}
			i.push(new sap.ui.model.Filter("Estacion", sap.ui.model.FilterOperator.EQ, o));
			var a = this.getView().getModel("Operaciones");
			a.read("/EquiposSet", {
				filters: i,
				success: e => {
					this.onSuccessEquipos(e)
				},
				error: e => {
					this.onErrorEquipos()
				}
			});
			if (!t) {
				this.getView().byId("EquipoFilter").setEnabled(true)
			}
		},
		onSuccessEquipos: function (e) {
			var t = [];
			if (e.results.lentgh > 0) {
				t = e.results
			} else {
				t = [{
					CodEquipo: "NoData",
					CodigoEquipo: "Sin datos disponibles"
				}]
			}
			console.log(t);
			var o = this.getView().getModel("EquiposModel");
			if (!o) {
				o = new sap.ui.model.json.JSONModel;
				o.setSizeLimit(1e4);
				this.getView().setModel(o, "EquiposModel")
			}
			o.setData({
				Equipos: t,
				busy: false
			})
		},
		onErrorEquipos: function () {},
		ValidateCombo: function (e) {
			var t = this.dialogSociety.getModel("Society").getData().Code;
			if (t !== "") {
				e.getSource().setValueState("None")
			} else {
				e.getSource().setValueState("Error")
			}
		},
		onEdit: function (e) {
			var t = e.getSource();
			var o = t.getParent();
			var s = o.getBindingContext("filtered");
			var i = s.getObject();
			for (var a in data) {
				if (data.hasOwnProperty(a)) {
					var r = data[a];
					if (r.value === i.place) {
						i.key = r.id;
						break
					}
				}
			}
			console.log(i);
			this.getView().getModel("tempOData").setData(i);
			this.openDialog("transener.registrocronologicoeventos.fragments.forms.tableEdit")
		},
		onSearchLGuard: function (e) {
			var t = this.getView();
			var a = t.byId("generalTable"),
				r = t.byId("tableNovedades");
			a.setBusy(true);
			r.setBusy(true);
			var l = this.getView().getModel("LGuardias");
			var n = new i([]);
			var d = this.getView().getModel("Operaciones");
			var u = new i([]);
			var c = [];
			var p = [];
			var g = sap.ui.getCore().byId("msgStrip");
			if (g) {
				g.destroy()
			}
			var h = this.byId("LugarFilter").getSelectedKey();
			var v = this.byId("NovedadesFilter").getSelectedKeys();
			var f = this.byId("TipoEquipoFilter").getSelectedKey();
			var m = this.byId("FromDateFilter").getDateValue();
			var S = this.byId("ToDateFilter").getDateValue();
			if (h) {
				c.push(new o("Lugar", s.EQ, h));
				p.push(new o("Tplnr", s.EQ, h))
			}
			if (v && v.length > 0) {
				var y = [];
				v.forEach(e => {
					y.push(new o("Tiponovedad", s.EQ, e))
				});
				var w = new o(y, false);
				c.push(w)
			}
			if (f) {
				c.push(new o("Equipo", s.EQ, f));
				p.push(new o("COD_TIPO", s.EQ, f))
			}
			if (m && S) {
				c.push(new sap.ui.model.Filter({
					path: "Fechahora",
					operator: sap.ui.model.FilterOperator.BT,
					value1: m,
					value2: S
				}))
			} else if (m) {
				c.push(new sap.ui.model.Filter({
					path: "Fechahora",
					operator: sap.ui.model.FilterOperator.GT,
					value1: m
				}));
				// p.push(new sap.ui.model.Filter({
				// 	path: "INICIO_NOVE",
				// 	operator: sap.ui.model.FilterOperator.GT,
				// 	value1: m
				// }))
			} else if (S) {
				c.push(new sap.ui.model.Filter({
					path: "Fechahora",
					operator: sap.ui.model.FilterOperator.LT,
					value1: m
				}))
			}
			console.log(c);
			l.read("/GuardiasListSet", {
				filters: c,
				success: e => {
					n.setData(e.results);
					a.setShowOverlay(false);
					a.setBusy(false);
					console.log(e)
				},
				error: e => {
					console.log(e);
					a.setBusy(false)
				}
			});
			d.read("/NovedadesServicioSet", {
				filters: p,
				success: e => {
					u.setData(e.results);
					r.setShowOverlay(false);
					r.setBusy(false);
					console.log(e)
				},
				error: e => {
					console.log(e);
					r.setBusy(false)
				}
			});
			t.setModel(u, "novedadesFiltered");
			t.setModel(n, "filtered")
		},
		onSelectionChange: function () {
			this.getView().byId("generalTable").setShowOverlay(true);
			this.getView().byId("tableNovedades").setShowOverlay(true)
		},
		onClearFilters: function () {
			var e = this.getView();
			e.byId("LugarFilter").setSelectedKey("");
			e.byId("TipoEquipoFilter").setSelectedKey("");
			e.byId("NovedadesFilter").setSelectedKeys("");
			e.byId("FromDateFilter").setValue(null);
			e.byId("ToDateFilter").setValue(null)
		},
		openDialog: function (e) {
			if (d) {
				d.destroy()
			}
			a.load({
				name: e,
				controller: this
			}).then(function (e) {
				d = e;
				this.getView().addDependent(d);
				d.open()
			}.bind(this))
		},
		onTabSelect: function (e) {
			var t = e.getParameter("key");
			console.log("Selected Tab Key: " + t)
		},
		closeDialog: function () {
			if (d) {
				d.close()
			}
		},
		dateWeekAgo: function () {
			var e = new Date;
			return new Date(e.getTime() - 3 * 24 * 60 * 60 * 1e3)
		},
		saveEdit: function () {
			t.show("Datos actualizados")
		},
		onDelete: function () {
			t.show("Delete Pressed")
		},
		onDisturbancesPress: function () {
			this.openDialog("transener.registrocronologicoeventos.fragments.forms.formPerturbaciones")
		},
		onScheduledPress: function () {
			this.openDialog("transener.registrocronologicoeventos.fragments.forms.formProgramadas")
		},
		onNoveltiesPress: function () {
			this.openDialog("transener.registrocronologicoeventos.fragments.forms.formNovelties")
		}
	})
});