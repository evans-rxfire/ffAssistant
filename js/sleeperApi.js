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

export async function fetchLeagueMatchups(leagueId, week) {
    const url = `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Matchups not found (${res.status})`);
    return res.json();
}

export async function savePlayers(players) {
    const db = await dbPromise;
    const tx = db.transaction('players', 'readwrite');
    const store = tx.objectStore('players');
    for (const player of players) {
        await store.put(player);
    }
    await tx.done;
}

export async function loadPlayersFromDB() {
    const db = await dbPromise;
    const allPlayers = await db.getAll('players');
    // Convert array to object keyed by player_id
    return allPlayers.reduce((obj, player) => {
        obj[player.player_id] = player;
        return obj;
    }, {});
}

export async function getLastFetchTime() {
    const db = await dbPromise;
    return db.get('meta', 'lastPlayerFetch');
}

export async function setLastFetchTime(timestamp) {
    const db = await dbPromise;
    const tx = db.transaction('meta', 'readwrite');
    await tx.objectStore('meta').put(timestamp, 'lastPlayerFetch');
    await tx.done;
}

export async function loadPlayerData() {
    const now = Date.now();
    const lastFetch = await getLastFetchTime();

    if (lastFetch && (now - lastFetch) < 24 * 60 * 60 * 1000) {
        const lastFetchDate = new Date(lastFetch);
        console.log(`Loading player data from IndexedDB... Last fetch was at: ${lastFetchDate.toLocaleString()}`);
        return loadPlayersFromDB();
    }

    try {
        console.log("Fetching new player data from API...");
        const res = await fetch('https://api.sleeper.app/v1/players/nfl');
        const data = await res.json();

        const playersArray = Object.values(data).map(player => {
        if (!player.player_id) player.player_id = player.player_id || player.id || null; 
        return player;
        });

        await savePlayers(playersArray);
        await setLastFetchTime(now);

        return data;
    } catch (err) {
        console.error("Failed to fetch player data:", err);
        return await loadPlayersFromDB();
    }
}
