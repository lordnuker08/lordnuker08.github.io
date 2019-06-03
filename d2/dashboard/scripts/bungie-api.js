function BungieApi(options) {
    "use strict";

    var jq = options.jQuery;
    var api_key =
        window.location.href.indexOf("beta") > -1
            ? "2dea235ddd854458ab0dae8adc2f0835"
            : "755e377b63b5405090a4e4d202a58537";
    var bungieSite = "https://www.bungie.net";

    var _errorDisplayHandler;

    var ajaxError = function(xhr, textStatus, errorThrown) {
        if (_errorDisplayHandler !== undefined) {
            errorDisplayHandler(textStatus + " " + errorThrown);
        }
    };

    var prepareGetParams = function(getUrl, baseOverride) {
        var base =
            baseOverride === undefined
                ? bungieSite + "/Platform/Destiny2/"
                : bungieSite + baseOverride;
        setErrorMessage("");
        return {
            type: "GET",
            headers: { "X-API-Key": api_key },
            error: ajaxError,
            url: base + getUrl
        };
    };

    var callApi = function(api) {
        return jq.ajax(prepareGetParams(api));
    };

    this.loadFullProfile = function(membershipInfo) {
        return callApi(
            membershipInfo.membershipType +
            "/Profile/" +
            membershipInfo.membershipId +
            "/?components=100,200"
        );
    };

    this.searchDestinyPlayers = function(searchTerm) {
        return callApi("SearchDestinyPlayer/-1/" + searchTerm + "/");
    };

    this.searchUsers = function(searchTerm) {
        return jq.ajax(
            prepareGetParams(
                "/User/SearchUsersPaged/" + searchTerm + "/1/25/",
                "/Platform"
            )
        );
    };

    this.getActivities = function(
        platformId,
        membershipId,
        characterId,
        maxRecords,
        page
    ) {
        return callApi(
            "" +
            platformId +
            "/Account/" +
            membershipId +
            "/Character/" +
            ccharacterId +
            "/Stats/Activities/?mode=None&count=" +
            maxRecords +
            "&page=" +
            page
        );
    };

    this.getBungieSiteUrl = function() {
        return bungieSite;
    };

    this.getMembershipById = function(membershipId) {
        return jq.ajax(
            prepareGetParams(
                "/User/GetMembershipsById/" + membershipId + "/4/",
                "/Platform"
            )
        );
    };

    this.loadFullProfile = function(membershipInfo) {
        return callApi(
            membershipInfo.membershipType +
            "/Profile/" +
            membershipInfo.membershipId +
            "/?components=100,200"
        );
    };

    this.setErrorDisplayHandler = function(errorDisplayHandler) {
        _errorDisplayHandler = errorDisplayHandler;
    };
}
