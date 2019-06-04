export default function EventManager(options) {
    var jq = options.jq;
    var NAMESPACE = ".ln08"; // :)
    var EVENT_LOAD_CHARACTER_DATA = "load_character_data" + NAMESPACE;
    var EVENT_REDRAW_CHARTS = "redraw_chars" + NAMESPACE;

    this.triggerLoadCharacterData = function(eventData) {
        jq.trigger(EVENT_LOAD_CHARACTER_DATA, {
            characterIndex: eventData.characterIndex,
            membershipInfoIndex: eventData.membershipInfoIndex
        });
    };

    this.triggerRedrawCharts = function (eventData) {
        jq.trigger(EVENT_REDRAW_CHARTS, eventData);
    };

    this.getCharacterDataLoadedEventName = function () {
        return EVENT_LOAD_CHARACTER_DATA;
    }

    this.getRedrawChartsEventName = function () {
        return EVENT_REDRAW_CHARTS;
    }
}