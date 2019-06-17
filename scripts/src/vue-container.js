import TypeMaps from "./maps.js";
import Utils from "./utils.js";

export default function VueContainer(options) {
  "use strict";

  var jq = options.jq;
  var bungieApi = options.bungieApi;
  var typeMaps = new TypeMaps();
  var utils = new Utils();

  var config = {
    el: options.appContainer,
    data: {
      activetab: 1,
      charactersInfo: [],
      activities: [],
      membershipInfo: [],
      searchTerm: "",
      userSearchResults: [],
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
    methods: {}
  };

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
          typeMaps.pvpActivities.indexOf(activity.activityDetails.mode) !== -1;
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
    options.eventManager.triggerLoadCharacterData({
      characterIndex: characterIndex,
      membershipInfoIndex: membershipInfoIndex
    });
  };

  jq(document).on(
    options.eventManager.getCharacterDataLoadedEventName(),
    function(event, data) {
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
          triggerLoadCharacterData(
            data.characterIndex,
            data.membershipInfoIndex
          );
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
    }
  );

  config.methods.userClicked = function(e) {
    e.preventDefault();

    var membershipId = $(e.target).attr("data-membership-id");
    var membershipType = $(e.target).attr("data-membership-type");
    console.debug("User member: " + membershipId);
    config.data.userSearchResults = [];
    resolveUserMemberships(membershipId, membershipType);
  };

  var resolveUserMemberships = function(membershipId, membershipType) {
    config.data.resolvedMemberships = [];
    // membership is only valid for pc platform but can fetch other platform information weirdly
    bungieApi
      .getMembershipById(membershipId, membershipType)
      .then(function(response) {
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
          cd.platformIconPath = "/images/logos/battlenet-icon.jpg";
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
        for (var i = 0; i < membershipInfo.characters.length; i++) {
          var character = membershipInfo.characters[i];
          character.genderTypeName = typeMaps.genderTypeMap.get(
            character.genderType
          );
          character.raceTypeName = typeMaps.raceTypeMap.get(character.raceType);
          character.classTypeName = typeMaps.classTypeMap.get(
            character.classType
          );
          character.totalDurationPlayed = utils.getDurationFromMinutes(
            character.minutesPlayedTotal
          );
          config.data.charactersInfo.push(character);
        }
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
    config.data.userSearchResults = [];
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
          r.membershipType = 4;
          r.displayName = "[BNet] " + r.blizzardDisplayName;
        } else if (r.psnDisplayName !== undefined) {
          r.membershipType = 2;
          r.displayName = "[PSN] " + r.psnDisplayName;
        } else if (r.xboxDisplayName !== undefined) {
          r.membershipType = 1;
          r.displayName = "[XBL] " + r.xboxDisplayName;
        }

        if (r.membershipType !== undefined) {
          config.data.userSearchResults.push(r);
        }
      }

      // Call other API to
      if (config.data.userSearchResults.length === 0) {
        bungieApi.searchDestinyPlayers(searchTerm).then(function(response) {
          response.Response.forEach(function(member) {
            config.data.resolvedMemberships.push(member);
          });

          if(config.data.resolvedMemberships.length === 0) {
            // No records found
            setErrorMessage("No match found for the search term. Please check the user name and try again.")
          } else {
            processResolvedMemberships();
          }
        });
      }
    });
  };

  config.methods.getActivityType = function(activityHash) {
    return typeMaps.activityTypeMap.get(activityHash);
  };

  config.methods.getActivityModeTypes = function(activityModes) {
    var descriptions = [];
    typeMaps.activityModes.forEach(function(mode) {
      descriptions.push(activitModeTypeMap.get(mode));
    });
    return descriptions.join(",");
  };

  config.methods.getActivityModeType = function(activityMode) {
    return typeMaps.activityModeTypeMap.get(activityMode);
  };

  //config.methods.getDurationFromMinutes = utils.getDurationFromMinutes;

  config.methods.drawActivitySummaryGraphs = function() {
    options.eventManager.triggerRedrawCharts();
  };

  config.data.chartTabClicked = function() {
    config.data.activetab = 3;
    // Slow tab switch
    setTimeout(function() {
      options.eventManager.triggerRedrawCharts();
    }, 500);
  };

  this.getAllActivities = function() {
    return config.data.activities;
  };

  parseDataFromUrl();

  // Auto load
  if (config.data.searchTerm.length > 0) {
    config.methods.findPlayers();
  }

  this.config = config;

  window.config = this.config;
  this.vueApp = new Vue(window.config);

  this.setErrorMessage = setErrorMessage;

  window.vueApp = this.vueApp;
}
