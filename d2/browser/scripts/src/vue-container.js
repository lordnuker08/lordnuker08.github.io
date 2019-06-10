export default function VueContainer(options) {
  "use strict";
  var config = {
    el: options.appContainer,
    data: {
      loreDefinition: {
        list: [],
        selected: { name: "", description: "", subtitle: "" }
      },
      recordDefinition: { list: [] },
      collectibleDefinition: {
        list: [],
        selected: { name: "", description: "", iconPath: "" }
      }
    },
    methods: {}
  };

  var jq = options.jq;

  var fetchJson = function(filePath) {
    return jq.ajax({
      type: "GET",
      dataType: "json",
      url: filePath + ".json",
      error: function(xhr, textStatus, errorThrown) {
        console.debug(textStatus + " " + errorThrown);
      }
    });
  };
  var fetchData = function(fileName) {
    return fetchJson("data/" + fileName);
  };

  var fillData = function(fileName, dataContainer) {
    fetchData(fileName).then(function(data) {
      dataContainer.list = [];
      console.debug("Fetched " + data.length + " items.");
      for (var i = 0; i < data.length; i++) {
        var d = data[i];
        dataContainer.list.push(d);
      }
      dataContainer.list.sort(function(a, b) {
        var tA = a.n,
          tB = b.n;
        return tA < tB ? -1 : tA > tB ? 1 : 0;
      });
    });
  };

  var fetchDetails = function(hash, group) {
    return fetchJson("../parsed/" + group + "/" + hash);
  };

  var getImagePath = function(relPath) {
      return "https://bungie.net" + relPath;
  }

  config.methods.listItemClicked = function(definition, e) {
    e.preventDefault();
    var hash = $(e.target).data("hash");
    var group = $(e.target)
      .closest("div.datalist")
      .data("source");
    fetchDetails(hash, group).then(function(details) {
      definition.display(details);
    });
  };

  config.data.loreDefinition.display = function(details) {
    config.data.loreDefinition.selected.name = details.displayProperties.name;
    config.data.loreDefinition.selected.description =
      details.displayProperties.description;
    config.data.loreDefinition.selected.subtitle = details.subtitle;
  };

  config.data.collectibleDefinition.display = function (details) {
      config.data.collectibleDefinition.selected.name = details.displayProperties.name;
      config.data.collectibleDefinition.selected.description =
          details.displayProperties.description;

      config.data.collectibleDefinition.selected.iconPath =
          details.displayProperties.hasIcon ? getImagePath( details.displayProperties.icon ): "";
  }


  this.config = config;
  window.config = config;
  this.vueApp = new Vue(config);
  window.vueApp = this.vueApp;

  fillData("DestinyLoreDefinition", config.data.loreDefinition);
  fillData("DestinyCollectibleDefinition", config.data.collectibleDefinition);
}
