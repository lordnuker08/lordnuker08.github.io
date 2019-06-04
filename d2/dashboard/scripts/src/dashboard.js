import VueContainer from "./vue-container.js";
import BungieApi from "./bungie-api.js";
import ChartingContainer from "./charting-container.js";
import Utils from "./utils.js";
import DataManager from "./data-manager.js";
import EventManager from "./event-manager.js";

export default function Dashboard($) {
  "use strict";
  var vueContainer, bungieApi, chartingContainer, eventManager, dataManager;

  eventManager = new EventManager({ jq: $ });

  bungieApi = new BungieApi({ jq: $ });
  vueContainer = new VueContainer({
    jq: $,
    bungieApi: bungieApi,
    appContainer: "#dashboard-app",
    eventManager: eventManager,
    href: window.location.href
  });

  bungieApi.setErrorDisplayHandler(vueContainer.setErrorMessage);
  dataManager = new DataManager({
    getActivities: vueContainer.getAllActivities
  });

  chartingContainer = new ChartingContainer({
    getActivities: vueContainer.getAllActivities,
    summaryChartElement: "summary-chart",
    pvpSummaryChartElement: "pvp-summary-chart",
    eventManager: eventManager,
    dataManager: dataManager,
    jq: $
  });

  var _self = this;
  this.bungieApi = bungieApi;
  this.vueContainer = vueContainer;
  this.chartingContainer = chartingContainer;

  window.appContainers = {
    vueContainer: _self.vueContainer,
    chartingContainer: _self.chartingContainer
  };
}
