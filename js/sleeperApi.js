// sleeperApi.js
 export async function getNflState() {
    const url = "https://api.sleeper.app/v1/state/nfl";
    const res = await fetch(url);
    if (!res.ok) throw new Error(`NFL state not found (${res.status})`);
    return res.json();
}

export async function fetchUser(userName) {
    if (typeof userName !== "string") {
        throw new Error("Invalid username input.");
    }
    const url = `https://api.sleeper.app/v1/user/${userName.toLowerCase()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`User not found (${res.status})`);
    return res.json();
}

export async function fetchAllLeagues(userId) {
    const nflState = await getNflState();
    const season = nflState.season;
    const url = `https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${season}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Leagues not found (${res.status})`);
    return res.json();
}

export async function fetchLeagueData(leagueId) {
    const url = `https://api.sleeper.app/v1/league/${leagueId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`League not found (${res.status})`);
    return res.json();
}

export async function fetchLeagueUsers(leagueId) {
    const url = `https://api.sleeper.app/v1/leauge/${leagueId}/users`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`League users not found (${res.status})`);
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

export async function fetchLeagueRosters(leagueId) {
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