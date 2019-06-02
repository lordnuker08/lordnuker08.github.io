var app,
    dailyActivityChart,
    dailyActivityChartConfig,
    pvpActivityChart,
    pvpActivityChartConfig;



var config = {
    el: "#app",
    data: {
        activetab: 1,
        charactersInfo: [],
        activities: [],
        membershipInfo: [],
        searchTerm: "",
        platform:"console",
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
                drawActivitySummaryGraph();
            }, 500);
        }
    }
};