export default function VueContainer(options) {
  "use strict";
  var config = {
    el: options.appContainer,
    data: {
      loreDefinition: { list: [] },
      recordDefinition: { list: [] }
    }
  };

  var jq = options.jq;


  var fetchData = function(fileName) {
    return jq.ajax({
      type: "GET",
      dataType: "json",
      url: "data/" + fileName + ".json",
        error: function(xhr, textStatus, errorThrown) {
          console.debug(textStatus + ' ' + errorThrown)
        }
    });
  };

  var fillData = function(fileName, dataContainer) {
    fetchData(fileName).then(function(data) {
      dataContainer.list = [];
      console.debug('Fetched ' + data.length + ' items.')
      for (var i = 0; i < data.length; i++) {
        var d = data[i];
        dataContainer.list.push(d);
      }
      dataContainer.list.sort(function(a, b) {
          var tA = a.n, tB = b.n;
          return (tA < tB) ? -1 : (tA > tB) ? 1 : 0;
      });
    });
  };



    this.config = config;
    window.config = config;
    this.vueApp = new Vue(config);
    window.vueApp = this.vueApp;


    fillData("DestinyLoreDefinition", config.data.loreDefinition);
}
