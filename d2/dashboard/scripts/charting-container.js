function ChartingContainer(options) {
  "use strict";
  var COLOR_RED = "rgb(255, 99, 132)",
    COLOR_BLUE = "rgb(54, 162, 235)",
    COLOR_GREEN = "rgb(12, 255, 132)";

  var jq = options.jq;

  var getDailyActivityChart = function() {
    var summarizeByDate = function() {
      return options.dataManager.getActivities().reduce(function(r, e) {
        var date = e.period.substr(0, e.period.indexOf("T"));

        if (r[date] === undefined) {
          r[date] = { count: 1, time: 0 };
        }

        r[date].count = r[date].count + 1;
        r[date].time = r[date].time + e.values.timePlayedSeconds.basic.value;

        return r;
      }, []);
    };

    var summarizedActivities = summarizeByDate();
    // convert to array
    var dailyActivityChartData = options.utils.objectToArray(
      summarizedActivities,
      function(item) {
        return {
          date: item,
          count: details.count,
          time: details.time
        };
      }
    );

    var dailyActivityChartConfig = {
      type: "bar",
      options: {
        responsive: true,
        hoverMode: "index",
        stacked: false,
        title: {
          display: true,
          text: "Daily Activity Summary"
        },
        scales: {
          yAxes: [
            {
              type: "linear",
              display: true,
              position: "left",
              id: "y-axis-activity-count"
            },
            {
              type: "linear",
              display: true,
              position: "right",
              id: "y-axis-time-played",

              // grid line settings
              gridLines: {
                drawOnChartArea: false
              },

              ticks: {
                // Change to hours and minutes
                callback: function(value, index, values) {
                  return options.utils.minutesToHours(value);
                }
              }
            }
          ]
        }
      },
      data: {
        labels: [],
        datasets: [
          {
            label: "Total Daily Activities",
            borderColor: COLOR_RED,
            backgroundColor: COLOR_BLUE,
            fill: false,
            yAxisID: "y-axis-activity-count",
            data: []
          },
          {
            label: "Time Played (minutes)",
            borderColor: COLOR_RED,
            backgroundColor: COLOR_BLUE,
            fill: false,
            yAxisID: "y-axis-time-played",
            data: []
          }
        ]
      }
    };

    for (var i = 0; i < dailyActivityChartData.length; i++) {
      var cd = dailyActivityChartData[i];
      dailyActivityChartConfig.data.labels.push(cd.date);
      dailyActivityChartConfig.data.datasets[0].data.push(cd.count);
      dailyActivityChartConfig.data.datasets[1].data.push(
        Math.floor(cd.time / 60)
      );
    }

    var dailyActivityChartCtx = document.getElementById(
      options.summaryChartElement
    );

    return new Chart.Line(dailyActivityChartCtx, dailyActivityChartConfig);
  };

  var getPvPActivityChart = function() {
    var summarizedPvPActivities = options.dataManager
      .getActivities()
      .reduce(function(r, e) {
        if (e.isPvP) {
          var date = e.period.substr(0, e.period.indexOf("T"));
          if (r[date] === undefined) {
            r[date] = { details: [], won: 0, lost: 0 };
          }
          if (r[date].details[e.activityDetails.mode] === undefined) {
            r[date].details[e.activityDetails.mode] = { won: 0, lost: 0 };
          }
          if (e.values.standing.basic.value === 0) {
            r[date].won++;
            r[date].details[e.activityDetails.mode].won++;
          } else {
            r[date].lost++;
            r[date].details[e.activityDetails.mode].lost++;
          }
        }

        return r;
      }, []);

    var pvpActivityChartData = utils.objectToArray(
      summarizedPvPActivities,
      function(item) {
        return {
          date: item,
          won: pvpActivityDetail.won,
          lost: pvpActivityDetail.lost
        };
      }
    );

    var pvpActivityChartConfig = {
      type: "bar",
      options: {
        title: {
          display: true,
          text: "Daily PvP Summary"
        },
        tooltips: {
          mode: "index",
          intersect: false
        },
        responsive: true,
        scales: {
          xAxes: [
            {
              stacked: true
            }
          ],
          yAxes: [
            {
              stacked: true
            }
          ]
        }
      },
      data: {
        labels: [],
        datasets: [
          {
            label: "Matches Won",
            borderColor: COLOR_GREEN,
            backgroundColor: COLOR_GREEN,
            fill: false,
            data: []
          },
          {
            label: "Matches Lost",
            borderColor: COLOR_RED,
            backgroundColor: COLOR_RED,
            fill: false,
            data: []
          }
        ]
      }
    };

    for (var i = 0; i < pvpActivityChartData.length; i++) {
      var cd = pvpActivityChartData[i];
      pvpActivityChartConfig.data.labels.push(cd.date);
      pvpActivityChartConfig.data.datasets[0].data.push(cd.won); // Wins
      pvpActivityChartConfig.data.datasets[1].data.push(-1 * cd.lost); // Losses are negative
    }

    var pvpActivityChartCtx = document.getElementById(
      options.pvpSummaryChartElement
    );
    return new Chart(pvpActivityChartCtx, pvpActivityChartConfig);
  };

  var _self = this;
  var drawActivitySummaryGraphs = function() {
    _self.dailyActivityChart = getDailyActivityChart();
    _self.pvpActivityChart = getPvPActivityChart();
  };

  jq.on(options.eventManager.getRedrawChartsEventName(), function(event, data) {
    drawActivitySummaryGraphs();
  });
}
