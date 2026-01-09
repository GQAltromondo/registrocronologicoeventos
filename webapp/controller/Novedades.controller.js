sap.ui.define([
  "transener/registrocronologicoeventos/controller/BaseController",
  "sap/ui/core/routing/History",
  "sap/ui/core/Fragment",
  "sap/m/MessageToast"
], function (BaseController, History, Fragment, MessageToast) {
  "use strict";

  return BaseController.extend("transener.registrocronologicoeventos.controller.Novedades", {
    onInit: function () {},

    onNovedadSelected: function (oEvent) {
      var empresa = "100";

      var oMappingTRA = {
        PantallaGeneral: ["AUTR","NAUT","ADAP","NADA","DFOR","FORZ","DISP","INDI","ENER","ESPO","FINA","INIC","HABI","INHI","INFO","REAN","RMON","RTRI","SUSP","CREC","SREC","AUTO","MANU","R495","R500","R5005","SOLI","SULI"],
        Alarma: ["ALAR","RTNA"],
        CargaDeEquipos: ["VANO","INTF","CNOM","NRLI","SULI","CMAX","SNOR"],
        VinculadoSinTension: ["otro1","otro2"],
        EnBandaFueraDeBanda: ["EBAN","FBAN"],
        IndisponibilidadesSubindice: ["otro1","otro2"],
        ManiobrasOperativas1: ["DESC","DENE","ESER","FSER","FSPO","ABTR","CBAR","AACO","ESSP","AINT","CNOR","AACO"],
        ManiobrasOperativas2: ["otro1","otro2"],
        ManiobrasOperativas3: ["otro1","otro2"]
      };

      var oMappingTBA = {
        PantallaGeneral: ["DI","IN","HABI","INHI","COM","RH","RA","APADECSUB","ACT SUB V","GUI","MIN FREC","NGUI","NFORM","PT","RESTR","RSSP"],
        Alarma: ["ALARMA","FT","FTP","IFUIM","NT","RTNA"],
        CargaDeEquipos: ["INTF","CNOM","NRESTR"],
        VinculadoSinTension: ["otro1","otro2"],
        EnBandaFueraDeBanda: ["EB","FB"],
        IndisponibilidadesSubindice: ["otro1","otro2"],
        ManiobrasOperativas1: ["CR","DF","DG","EP","FP","PFIH","PFII","SOLGEN","SPG","SSG","TORET","TORS","TORT","U10%","U5%","UNORM"],
        ManiobrasOperativas2: ["otro1","otro2"],
        ManiobrasOperativas3: ["otro1","otro2"]
      };

      var oMapping = empresa === "100" ? oMappingTRA : oMappingTBA;

      var sSelectedKey = oEvent.getSource().getSelectedKey();
      var sFragmentName = null;

      Object.keys(oMapping).some(function (sCategory) {
        if (oMapping[sCategory].includes(sSelectedKey)) {
          sFragmentName = sCategory;
          return true;
        }
        return false;
      });

      if (!sFragmentName) {
        MessageToast.show("No existe un fragmento para la opción seleccionada.");
        return;
      }

      var sFragmentPath = "transener.registrocronologicoeventos.fragments.novedades." + sFragmentName;
      this._showNovedadFragment(sFragmentPath);
    },

    _showNovedadFragment: async function (sFragmentPath) {
      var oContainer = this.byId("fragContainer");
      if (!oContainer) return;

      oContainer.removeAllItems();

      try {
        var oFrag = await Fragment.load({
          id: this.getView().getId() + "--" + sFragmentPath.split(".").pop(),
          name: sFragmentPath,
          controller: this
        });

        if (Array.isArray(oFrag)) {
          oFrag.forEach(function (c) { oContainer.addItem(c); });
        } else {
          oContainer.addItem(oFrag);
        }
      } catch (e) {
        MessageToast.show("Error cargando fragmento: " + sFragmentPath);
        /* opcional */ console.error(e);
      }
    }
  });
});
