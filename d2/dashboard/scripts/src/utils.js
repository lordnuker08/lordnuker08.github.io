export default function Utils() {
  "use strict";

  this.getDurationFromMinutes = function(minutes) {
    var d = Math.floor(minutes / 1440), // Days
      dh = minutes % 1440; // remaining minutes
    var h = Math.floor(dh / 60); // Remaining hours
    var m = dh % 60; // remaining minutes
    return d + "d " + h + "h " + m + "m";
  };

  this.minutesToHours = function(minutes) {
    var display = "";
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    if (h > 0) {
      display = h + "h ";
    }
    if (m > 0) {
      display = display + m + "m";
    }
    return display;
  };

  this.objectToArray = function(obj, transformer) {
    var output = [];

    for (var o in obj) {
      var item = obj[o];
      output.push(transformer !== undefined ? transformer(item) : item);
    }
    return output;
  };
}
