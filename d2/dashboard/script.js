var app,
    dailyActivityChart, dailyActivityChartConfig,
    pvpActivityChart, pvpActivityChartConfig;

var config = {
    el: "#app",
    data: {
            activetab: 1,
            charactersInfo: [],
            activities: [],
            membershipInfo: [],
            searchTerm:"",
            errorMessage:""
    },
    computed : {
        isSearchDisabled : function () {
            return this.searchTerm.trim().length > 0;
        },
        isLoadingComplete : function () {
            for(var c = 0; c < this.charactersInfo.length; c++) {
                if(this.charactersInfo[c].loaded === false) {
                    return false;
                }
            }
            return true;
        }
    },
    methods: {
        chartTabClicked : function () {
            this.activetab = 3;
            // Slow tab switch
            setTimeout( function() {
                drawActivitySummaryGraph();
            }, 500);
        }
    }
};

function prepareConfig($, $document) {
    "use strict";
    var api_key =
        window.location.href.indexOf("beta") > -1
            ? "2dea235ddd854458ab0dae8adc2f0835"
            : "755e377b63b5405090a4e4d202a58537";
    var bungieSite = "https://bungie.net";
    var NAMESPACE = ".ln08"; // :)
    var EVENT_LOAD_CHARACTER_DATA = "load_character_data" + NAMESPACE;

    // Parse data from url
    var hrefParts = window.location.href.split('#');
    if(hrefParts.length > 1) {
        config.data.searchTerm = decodeURIComponent( hrefParts[1] );
    }

    var setErrorMessage = function (message) {
        config.data.errorMessage = message;
    };

    var ajaxError = function (xhr, textStatus, errorThrown ) {
        setErrorMessage(textStatus + " " + errorThrown);
    }

    var prepareGetParams = function(getUrl) {
        var base = "https://www.bungie.net/Platform/Destiny2/";
        setErrorMessage("");
        return {
            type: "GET",
            headers: { "X-API-Key": api_key },
            error: ajaxError,
            url: base + getUrl
        };
    };

    var callApi = function(api) {
        return $.ajax(prepareGetParams(api));
    };

    var storeActivityData = function(characterId, membershipType, activities) {
        if (activities) {
            activities.forEach(function(activity) {
                activity.characterId = characterId;
                activity.membershipType = membershipType;
                activity.isPvP = pvpActivities.indexOf(activity.activityDetails.mode) !== -1;
                config.data.activities.push(activity);
            });
        }
    };

    var sortActivities = function() {
        config.data.activities.sort(function(a, b) {
            return new Date(b.period).getTime() - new Date(a.period).getTime();
        });
    };

    var triggerLoadCharacterData = function(characterIndex, membershipInfoIndex) {
        $document.trigger(EVENT_LOAD_CHARACTER_DATA, {characterIndex : characterIndex, membershipInfoIndex : membershipInfoIndex});
    };

    $document.on(EVENT_LOAD_CHARACTER_DATA, function(event, data) {
        var membershipInfo = config.data.membershipInfo[data.membershipInfoIndex],
            maxRecord = 250,
            platformId = membershipInfo.membershipType,
            character = membershipInfo.characters[data.characterIndex];

        var processor = function(result) {
            if (
                result.Response &&
                result.Response.activities &&
                result.Response.activities.length > 0
            ) {
                storeActivityData(
                    character.characterId,
                    membershipInfo.membershipType,
                    result.Response.activities
                );
                config.data.membershipInfo[data.membershipInfoIndex].characters[data.characterIndex].activitiesPage++;
                triggerLoadCharacterData(data.characterIndex, data.membershipInfoIndex);
            } else {
                console.debug(
                    "Loaded " +
                    character.activitiesPage +
                    " page(s) of activites for chracter: " +
                    character.characterId
                );
                config.data.membershipInfo[data.membershipInfoIndex].characters[data.characterIndex].loaded = true;
                sortActivities();
            }
        };

        callApi(
            "" +
            platformId +
            "/Account/" +
            membershipInfo.membershipId +
            "/Character/" +
            character.characterId +
            "/Stats/Activities/?mode=None&count=" +
            maxRecord +
            "&page=" +
            config.data.membershipInfo[data.membershipInfoIndex].characters[data.characterIndex].activitiesPage
        ).then(processor);
    });

    config.methods.fetchPlayerData = function() {
        this.activities = [];
        this.characterIds = [];
        var searchTerm = config.data.searchTerm.trim();

        if(searchTerm.length === 0) {
            return;
        }

        var searchPlayer = function() {
            return callApi("SearchDestinyPlayer/-1/" + searchTerm + "/");
        };

        var parseCharacterDetails = function(membershipInfo, charactersData) {
            var characters = []
            for (var c in charactersData) {
                var cd = charactersData[c];
                cd.platformIconPath =
                    bungieSite + membershipInfo.iconPath;
                cd.membershipType = membershipInfo.membershipType;
                cd.activitiesPage = 0;
                cd.loaded = false;
                characters.push(cd);
            }
            return characters;
        };

        var loadFullProfile = function(membershipInfo) {
            return callApi(membershipInfo.membershipType + "/Profile/" + membershipInfo.membershipId + "/?components=100,200");
        };

        var createCharacterDynamicCss = function(membershipInfo) {
            var characterStyle = "";
            for (var c in membershipInfo.characters) {
                var cd = membershipInfo.characters[c];
                characterStyle =
                    characterStyle +
                    " .char-class-" +
                    cd.characterId +
                    ' { background-image: url("' +
                    bungieSite +
                    cd.emblemPath +
                    '" )}';

                characterStyle =
                    characterStyle +
                    " .char-class-emblem-bg-" +
                    cd.characterId +
                    ' { background-image: url("' +
                    bungieSite +
                    cd.emblemBackgroundPath +
                    '" )}';
            }
            //console.debug("Dynamic character styles generated: ", characterStyle);

            var $customStyle = $('<style id="user-custom-' + membershipInfo.membershipType + '">' );
            $customStyle.text(characterStyle);
            $customStyle.appendTo(document.head);
        };

        var loadAllCharacterActivities = function(membershipInfoIndex) {
            var membershipInfo = config.data.membershipInfo[membershipInfoIndex];
            console.debug("membershipInfoIndex: " + membershipInfoIndex);
            console.debug(membershipInfo);
            // All characters available
            for (var characterIndex = 0; characterIndex < membershipInfo.characters.length; characterIndex++) {
                triggerLoadCharacterData(characterIndex, membershipInfoIndex);
            }
        };

        searchPlayer().then(function(result) {
            config.data.membershipInfo = [];
            config.data.charactersInfo = [];
            var membershipInfoIndex = 0;
            var playerFound = false;
            result.Response.forEach(function(membershipInfo) {
                // Add any additional data here
                // Load data for each membership information
                loadFullProfile(membershipInfo).then(function(result) {

                    membershipInfo.profile = result.Response.profile.data;
                    membershipInfo.characterIds = result.Response.profile.data.characterIds;
                    membershipInfo.characters = parseCharacterDetails(membershipInfo, result.Response.characters.data);
                    config.data.charactersInfo.push(...membershipInfo.characters);
                    createCharacterDynamicCss(membershipInfo);

                    // Save membership info
                    config.data.membershipInfo.push(membershipInfo);

                    // Load activities for this membership
                    loadAllCharacterActivities(membershipInfoIndex);
                    membershipInfoIndex++;
                });
                playerFound = true;
            });
            if(!playerFound) {
                setErrorMessage("No data found for [" + config.data.searchTerm
                    + "]. Either the player does not exist or there are no characters on this account.")
            }
        });
    };

    config.methods.getActivityType = function(activityHash) {
        return activityTypeMap.get(activityHash);
    };

    config.methods.getActivityModeTypes = function(activityModes) {
        var descriptions = [];
        activityModes.forEach(function(mode) {
            descriptions.push(activitModeTypeMap.get(mode));
        });
        return descriptions.join(",");
    };

    config.methods.getActivityModeType = function(activityMode) {
        return activityModeTypeMap.get(activityMode);
    };

    config.methods.getDurationFromMinutes = function(minutes) {
        var d = Math.floor(minutes / 1440), // Days
            dh = minutes % 1440; // remaining minutes
        var h = Math.floor(dh / 60); // Remaining hours
        var m = dh % 60; // remaining minutes
        return d + "d " + h + "h " + m + "m";
    };

    // Auto load
    if(config.data.searchTerm.length > 0) {
        config.methods.fetchPlayerData();
    }
}

function drawActivitySummaryGraph() {
    "use strict";
    var summarizeByDate = function () {
        return config.data.activities.reduce(function(r, e) {
            var date = e.period.substr(0, e.period.indexOf('T'));

            if (r[date] === undefined) {
                r[date] = {count: 1, time: 0};
            }

            r[date].count = r[date].count + 1;
            r[date].time = r[date].time + e.values.timePlayedSeconds.basic.value;

            return r
        }, []);
    };

    var summarizedPvPActivities = config.data.activities.reduce(function(r, e) {

        if(e.isPvP) {
            var date = e.period.substr(0, e.period.indexOf('T'));
            if (r[date] === undefined) {
                r[date] = { details : [], won : 0, lost : 0 };
            }
            if(r[date].details[e.activityDetails.mode] === undefined) {
                r[date].details[e.activityDetails.mode] = {won:0, lost:0};
            }
            if(e.values.standing.basic.value === 0 ) {
                r[date].won++;
                r[date].details[e.activityDetails.mode].won++;
            } else {
                r[date].lost++;
                r[date].details[e.activityDetails.mode].lost++;
            }
        }

        return r;
    }, []);


    var summarizedActivities = summarizeByDate()

    // convert to array
    var dailyActivityChartData = [];
    for(var item in summarizedActivities) {
        var details = summarizedActivities[item];
        dailyActivityChartData.push({"date": item, "count" : details.count, "time" : details.time})
    }

    var pvpActivityChartData = [];

    for(var item in summarizedPvPActivities) {
        var pvpActivityDetail = summarizedPvPActivities[item];
        pvpActivityChartData.push( {"date" : item, won : pvpActivityDetail.won, lost: pvpActivityDetail.lost });
    }

    var dailyActivityChartCtx = document.getElementById('summary-chart');

    dailyActivityChartConfig = {
        type: 'bar',
        options: {
            responsive: true,
            hoverMode: 'index',
            stacked: false,
            title: {
                display: true,
                text: 'Daily Activity Summary'
            },
            scales: {
                yAxes: [
                    {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        id: 'y-axis-activity-count'
                    },
                    {

                        type: 'linear',
                        display: true,
                        position: 'right',
                        id: 'y-axis-time-played',

                        // grid line settings
                        gridLines: {
                            drawOnChartArea: false,
                        },

                        ticks: {
                            // Change to hours and minutes
                            callback: function(value, index, values) {
                                var display = "";
                                var h = Math.floor( value / 60 );
                                var m = value % 60;
                                if( h > 0) {
                                    display = h + "h ";
                                }
                                if( m > 0) {
                                    display = display + m + "m";
                                }
                                return display;
                            }
                        }
                    }]
            }
        },
        data : {
            labels: [],
            datasets: [
                {
                    label: "Total Daily Activities",
                    borderColor: "rgb(255, 99, 132)",
                    backgroundColor: "rgb(255, 99, 132)",
                    fill: false,
                    yAxisID: 'y-axis-activity-count',
                    data: [],
                },
                {
                    label: "Time Played (minutes)",
                    borderColor: "rgb(54, 162, 235)",
                    backgroundColor: "rgb(54, 162, 235)",
                    fill: false,
                    yAxisID: 'y-axis-time-played',
                    data: []
                }
            ]
        }
    };

    for(var i = 0; i < dailyActivityChartData.length; i++) {
        var cd = dailyActivityChartData[i];
        dailyActivityChartConfig.data.labels.push(cd.date);
        dailyActivityChartConfig.data.datasets[0].data.push(cd.count);
        dailyActivityChartConfig.data.datasets[1].data.push( ( Math.floor(cd.time/60)));
    }


    dailyActivityChart = new Chart.Line(dailyActivityChartCtx, dailyActivityChartConfig);

    pvpActivityChartConfig = {
        type: 'bar',
        options: {
            title: {
                display: true,
                text: 'Daily PvP Summary'
            },
            tooltips: {
                mode: 'index',
                intersect: false
            },
            responsive: true,
            scales: {
                xAxes: [{
                    stacked: true,
                }],
                yAxes: [{
                    stacked: true
                }]
            }
        },
        data : {
            labels: [],
            datasets: [
                {
                    label: "Matches Won",
                    borderColor: "rgb(12, 255, 132)",
                    backgroundColor: "rgb(12, 255, 132)",
                    fill: false,
                    data: [],
                },
                {
                    label: "Matches Lost",
                    borderColor: "rgb(255, 99, 132)",
                    backgroundColor: "rgb(255, 99, 132)",
                    fill: false,
                    data: []
                }
            ]
        }
    };

    for(var i =0; i < pvpActivityChartData.length; i++) {
        var cd = pvpActivityChartData[i];
        pvpActivityChartConfig.data.labels.push(cd.date);
        pvpActivityChartConfig.data.datasets[0].data.push(cd.won); // Wins
        pvpActivityChartConfig.data.datasets[1].data.push(-1 * cd.lost); // Losses are negative
    }

    var pvpActivityChartCtx = document.getElementById('pvp-summary-chart');
    pvpActivityChart = new Chart(pvpActivityChartCtx, pvpActivityChartConfig);
}
prepareConfig($, $(document));
app  = new Vue(config);