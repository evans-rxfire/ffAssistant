export const LS_USER_KEY = "userData";
export const LS_LEAGUE_KEY = "leagueData";
export const LS_USERS_KEY = "leagueUsers";
export const LS_ROSTERS_KEY = "leagueRosters";
export const LS_MATCHUPS_KEY = "leagueMatchups";

export const ALL_LOCAL_STORAGE_KEYS = [
    LS_USER_KEY,
    LS_LEAGUE_KEY,
    LS_USERS_KEY,
    LS_ROSTERS_KEY,
    LS_MATCHUPS_KEY
]; //for future use - adding more keys

export const localStorageRegistry = {
    [LS_USER_KEY]: {
    get: () => userData,
    set: (data) => { userData = data ?? {}; },
    label: "your profile"
    },
    [LS_LEAGUE_KEY]: {
        get: () => leagueData,
        set: (data) => { leagueData = data ?? {}; },
        label: "league settings"
    },
    [LS_USERS_KEY]: {
        get: () => leagueUsers,
        set: (data) => { leagueUsers = data ?? []; },
        label: "league users"
    },
    [LS_ROSTERS_KEY]: {
        get: () => leagueRosters,
        set: (data) => { leagueRosters = data ?? {}; },
        label: "league rosters"
    },
    [LS_MATCHUPS_KEY]: {
        get: () => leagueMatchups,
        set: (data) => { leagueMatchups = data ?? {} },
        label: "weekly matchups"
    }
};