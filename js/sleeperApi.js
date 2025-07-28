function getNflSeasonYear() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    return month < 4 ? year - 1 : year;
}


// sleeperApi.js
export async function fetchUser(userName) {
    if (typeof userName !== "string") {
        throw new Error("Invalid username input.");
    }
    const url = `https://api.sleeper.app/v1/user/${userName.toLowerCase()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`User not found (${res.status})`);
    return res.json();
}

export async function fetchAllLeagues(userId, season = getNflSeasonYear()) {
    const url = `https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${season}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Leagues not found (${res.status})`);
    return res.json();
}

export async function fetchSingleLeague(leagueId) {
    const url = `https://api.sleeper.app/v1/league/${leagueId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`League not found (${res.status})`);
    return res.json();
}

export async function fetchAllDrafts(leagueId) {
    const url = `https://api.sleeper.app/v1/league/${leagueId}/drafts`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Drafts not found (${res.status})`);
    return res.json();
}

export async function fetchSingleDraft(draftId) {
    const url = `https://api.sleeper.app/v1/draft/${draftId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Draft not found (${res.status})`);
    return res.json();
}

export async function fetchRosters(leagueId) {
    const url = `https://api.sleeper.app/v1/league/${leagueId}/rosters`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Rosters not found (${res.status})`);
    return res.json();
}

// this function only needs to be called once a week
export async function fetchPlayers() {
    const url = "https://api.sleeper.app/v1/players/nfl";
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Players not found (${res.status})`);
    return res.json();
}