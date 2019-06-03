function VueContainer(options) {
    "use strict";

    var jq = options.jq;
    var bungieApi = options.bungieApi;
    var config = {
        el: options.appContainer,
        data: {
            activetab: 1,
            charactersInfo: [],
            activities: [],
            membershipInfo: [],
            searchTerm: "",
            pcUserSearchResults: [],
            selectedBlizzardUserMembershipId: 0,
            errorMessage: "",
            resolvedMemberships: []
        },
        computed: {
            isSearchDisabled: function() {
                return this.searchTerm.trim().length > 0;
            },
            isLoadingComplete: function() {
                for (var c = 0; c < this.charactersInfo.length; c++) {
                    if (this.charactersInfo[c].loaded === false) {
                        return false;
                    }
                }
                return true;
            }
        },
        methods: {
            chartTabClicked: function() {
                this.activetab = 3;
                // Slow tab switch
                setTimeout(function() {
                    drawActivitySummaryGraphs();
                }, 500);
            }
        }
    };

    var NAMESPACE = ".ln08"; // :)
    var EVENT_LOAD_CHARACTER_DATA = "load_character_data" + NAMESPACE;
    var bungieSite = bungieApi.getBungieSiteUrl();

    var parseDataFromUrl = function() {
        var hrefParts = options.href.split("#");
        if (hrefParts.length > 1) {
            config.data.searchTerm = decodeURIComponent(hrefParts[1]);
        }
    };

    var setErrorMessage = function(message) {
        config.data.errorMessage = message;
    };

    bungieApi.setErrorDisplayHandler(setErrorMessage);

    var storeActivityData = function(characterId, membershipType, activities) {
        if (activities) {
            activities.forEach(function(activity) {
                activity.characterId = characterId;
                activity.membershipType = membershipType;
                activity.isPvP =
                    pvpActivities.indexOf(activity.activityDetails.mode) !== -1;
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
        jq.trigger(EVENT_LOAD_CHARACTER_DATA, {
            characterIndex: characterIndex,
            membershipInfoIndex: membershipInfoIndex
        });
    };

    jq.on(EVENT_LOAD_CHARACTER_DATA, function(event, data) {
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
                config.data.membershipInfo[data.membershipInfoIndex].characters[
                    data.characterIndex
                    ].activitiesPage++;
                triggerLoadCharacterData(data.characterIndex, data.membershipInfoIndex);
            } else {
                console.debug(
                    "Loaded " +
                    character.activitiesPage +
                    " page(s) of activites for chracter: " +
                    character.characterId
                );
                config.data.membershipInfo[data.membershipInfoIndex].characters[
                    data.characterIndex
                    ].loaded = true;
                sortActivities();
            }
        };

        bungieApi
            .getActivities(
                platformId,
                membershipInfo.membershipId,
                character.characterId,
                maxRecord,
                config.data.membershipInfo[data.membershipInfoIndex].characters[
                    data.characterIndex
                    ].activitiesPage
            )
            .then(processor);
    });

    config.methods.blizzardUserClicked = function(e) {
        e.preventDefault();

        var membershipId = $(e.target).attr("data-membership-id");
        console.debug("Blizzard member: " + membershipId);
        resolvePcUserMemberships(membershipId);
    };

    var resolvePcUserMemberships = function(membershipId) {
        config.data.resolvedMemberships = [];
        // membership is only valid for pc platform but can fetch other platform information weirdly
        bungieApi.getMembershipById(membershipId).then(function(response) {
            for (var i = 0; i < response.Response.destinyMemberships.length; i++) {
                var dm = response.Response.destinyMemberships[i];
                config.data.resolvedMemberships.push(dm);
            }

            if (config.data.resolvedMemberships.length > 0) {
                processResolvedMemberships();
            }
        });
    };

    var processResolvedMemberships = function() {
        var membershipInfoIndex = 0;
        config.data.activities = [];
        config.data.characterIds = [];
        config.data.charactersInfo = [];

        var parseCharacterDetails = function(membershipInfo, charactersData) {
            var characters = [];
            for (var c in charactersData) {
                var cd = charactersData[c];
                cd.platformIconPath = bungieSite + membershipInfo.iconPath;
                cd.membershipType = membershipInfo.membershipType;
                if (cd.membershipType === 4) {
                    // Icon is not provided for blizzard... cheap!
                    cd.platformIconPath = "/d2/images/logos/battlenet-icon.jpg";
                }
                cd.activitiesPage = 0;
                cd.loaded = false;
                characters.push(cd);
            }
            return characters;
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

            var $customStyle = $(
                '<style id="user-custom-' + membershipInfo.membershipType + '">'
            );
            $customStyle.text(characterStyle);
            $customStyle.appendTo(document.head);
        };

        var loadAllCharacterActivities = function(membershipInfoIndex) {
            var membershipInfo = config.data.membershipInfo[membershipInfoIndex];
            console.debug("membershipInfoIndex: " + membershipInfoIndex);
            console.debug(membershipInfo);
            // All characters available
            for (
                var characterIndex = 0;
                characterIndex < membershipInfo.characters.length;
                characterIndex++
            ) {
                triggerLoadCharacterData(characterIndex, membershipInfoIndex);
            }
        };

        config.data.resolvedMemberships.forEach(function(membershipInfo) {
            // Add any additional data here
            // Load data for each membership information
            bungieApi.loadFullProfile(membershipInfo).then(function(result) {
                membershipInfo.profile = result.Response.profile.data;
                membershipInfo.characterIds = result.Response.profile.data.characterIds;
                membershipInfo.characters = parseCharacterDetails(
                    membershipInfo,
                    result.Response.characters.data
                );
                config.data.charactersInfo.push(...membershipInfo.characters);
                createCharacterDynamicCss(membershipInfo);

                // Save membership info
                config.data.membershipInfo.push(membershipInfo);

                // Load activities for this membership
                loadAllCharacterActivities(membershipInfoIndex);
                membershipInfoIndex++;
            });
        });
    };

    config.methods.clearSearchData = function() {
        config.data.pcUserSearchResults = [];
        config.data.activities = [];
        config.data.characterIds = [];
        config.data.membershipInfo = [];
        config.data.charactersInfo = [];
        config.data.resolvedMemberships = [];
    };

    config.methods.findPlayers = function() {
        config.methods.clearSearchData();

        var searchTerm = config.data.searchTerm.trim();

        if (searchTerm.length === 0) {
            return;
        }

        bungieApi.searchUsers(searchTerm).then(function(response) {
            for (var i = 0; i < response.Response.results.length; i++) {
                var r = response.Response.results[i];
                // Only way for blizzard
                if (r.blizzardDisplayName !== undefined) {
                    config.data.pcUserSearchResults.push(r);
                }
            }

            if (config.data.pcUserSearchResults.length === 0) {
                // Unlikely but look for registered non pc users
                bungieApi.searchDestinyPlayers(searchTerm).then(function(result) {
                    var playerFound = false;
                    result.Response.forEach(function(membershipInfo) {
                        // Add any additional data here
                        // Load data for each membership information
                        config.data.resolvedMemberships.push(membershipInfo);
                        playerFound = true;
                    });
                    if (!playerFound) {
                        setErrorMessage(
                            "No data found for [" +
                            config.data.searchTerm +
                            "]. Either the player does not exist or there are no characters on this account."
                        );
                    } else {
                        processResolvedMemberships();
                    }
                });
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

    config.methods.drawActivitySummaryGraphs = function () {
        if(options.graphUpdater !== undefined) {
            options.graphUpdater.drawActivitySummaryGraphs();
        }
    }
    this.getAllActivities = function () {
        return config.data.activities;
    };

    this.vueApp = new Vue(config);

    parseDataFromUrl();

    // Auto load
    if (config.data.searchTerm.length > 0) {
        config.methods.findPlayers();
    }
}
