function Dashboard($) {
    "use strict";
    var vueContainer, bungieApi, chartingContainer;

    chartingContainer= new ChartingContainer({
        getActivities:vueContainer.getAllActivities,
        summaryChartElement:'summary-chart', pvpSummaryChartElement:'pvp-summary-chart'
    });

     bungieApi = new BungieApi({jq:$});
     vueContainer = new VueContainer({ jq:$, bungieApi : bungieApi, appContainer : 'dashboard-app', graphUpdater:chartingContainer.drawActivitySummaryGraphs});

    this.bungieApi = bungieApi;
    this.vueContainer = vueContainer;
    this.chartingContainer = chartingContainer;

}