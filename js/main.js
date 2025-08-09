// import { fetchUser, fetchAllLeagues, fetchSingleLeague, fetchAllDrafts, fetchSingleDraft, fetchRosters, fetchPlayers } from "js/sleeperApi.js";
// import {  } from "js/constants.js";

let nflState = {};
let userData = {};
let leagues = [];
let leagueData = {};
let leagueUsers = {};
let leagueRosters = [];
let leagueMatchups = [];

const getUserBtn = document.getElementById("get-user-button");
const getLeaguesBtn = document.getElementById("get-leagues-button");

const userNameSpan = document.getElementById("user-name-span");

const leagueOptions = document.getElementById("league-options");
const leagueInfoContainer = document.getElementById("league-info-container");

const matchupContainer = document.getElementById("matchup-container");
const userTeamContainer = document.getElementById("user-team-container");
const opponentTeamContainer = document.getElementById("opponent-team-container");

const LS_NFLSTATE_KEY = "nflState";
const LS_USER_KEY = "userData";
const LS_USER_LEAGUES_KEY = "userLeagues";
const LS_LEAGUE_KEY = "leagueData";
const LS_USERS_KEY = "leagueUsers";
const LS_ROSTERS_KEY = "leagueRosters";
const LS_MATCHUPS_KEY = "leagueMatchups";

const ALL_LOCAL_STORAGE_KEYS = [
    LS_NFLSTATE_KEY,
    LS_USER_KEY,
    LS_USER_LEAGUES_KEY,
    LS_LEAGUE_KEY,
    LS_USERS_KEY,
    LS_ROSTERS_KEY,
    LS_MATCHUPS_KEY
]; //for future use - adding more keys

const localStorageRegistry = {
    [LS_NFLSTATE_KEY]: {
        get: () => nflState,
        set: (data) => { nflState = data ?? {}; },
        label: "NFL info" 
    },
    [LS_USER_KEY]: {
        get: () => userData,
        set: (data) => { userData = data ?? {}; },
        label: "your profile"
    },
    [LS_USER_LEAGUES_KEY]: {
        get: () => leagues,
        set: (data) => { leagues = data ?? {}; },
        label: "your leagues"
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

const saveBtn = document.getElementById("save-button");
const clearBtn = document.getElementById("clear-button");
const selectedLeagueBtn = document.getElementById("selected-league-button");


const { openDB, deleteDB } = window.idb;

const dbPromise = idb.openDB('FantasyFootballDB', 1, {
    upgrade(db) {
        if (!db.objectStoreNames.contains('players')) {
        db.createObjectStore('players', { keyPath: 'player_id' }); // keyPath matches player_id field
        }
        if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta'); // for metadata like last fetch timestamp
        }
    }
});


// Functions
// Sleeper API calls
async function getNflState() {
    const url = "https://api.sleeper.app/v1/state/nfl";
    const res = await fetch(url);

    if (!res.ok) throw new Error(`NFL state not found (${res.status})`);

    return res.json();
}


async function fetchUserData(userName) {
    if (typeof userName !== "string") {
        throw new Error("Invalid username input.");
    }

    const url = `https://api.sleeper.app/v1/user/${userName.toLowerCase()}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`User not found (${res.status})`);

    return res.json();
}


async function fetchAllLeagues(userId) {
    const nflState = await getNflState();
    const season = nflState.season;

    const url = `https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${season}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`Leagues not found (${res.status})`);

    return res.json();
}


async function fetchLeagueData(leagueId) {
    const url = `https://api.sleeper.app/v1/league/${leagueId}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`League data not found (${res.status})`);

    return res.json();
}


async function fetchLeagueUsers(leagueId) {
    const url = `https://api.sleeper.app/v1/league/${leagueId}/users`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`League users not found (${res.status})`);

    return res.json();
}


async function fetchLeagueRosters(leagueId) {
    const url = `https://api.sleeper.app/v1/league/${leagueId}/rosters`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`Rosters not found (${res.status})`);

    return res.json();
}


async function fetchLeagueMatchups(leagueId, week) {
    const url = `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`Matchups not found (${res.status})`);

    return res.json();
}


async function savePlayers(players) {
    const db = await dbPromise;
    const tx = db.transaction('players', 'readwrite');
    const store = tx.objectStore('players');
    for (const player of players) {
        await store.put(player);
    }
    await tx.done;
}


async function loadPlayersFromDB() {
    const db = await dbPromise;
    const allPlayers = await db.getAll('players');
    // Convert array to object keyed by player_id
    return allPlayers.reduce((obj, player) => {
        obj[player.player_id] = player;
        return obj;
    }, {});
}


async function getLastFetchTime() {
    const db = await dbPromise;
    return db.get('meta', 'lastPlayerFetch');
}


async function setLastFetchTime(timestamp) {
    const db = await dbPromise;
    const tx = db.transaction('meta', 'readwrite');
    await tx.objectStore('meta').put(timestamp, 'lastPlayerFetch');
    await tx.done;
}


async function loadPlayerData() {
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

        // Convert data object to array
        const playersArray = Object.values(data).map(player => {
        if (!player.player_id) player.player_id = player.player_id || player.id || null; 
        return player;
        });

        // Save players and update fetch time
        await savePlayers(playersArray);
        await setLastFetchTime(now);

        return data; // you can also return playersArray if you prefer
    } catch (err) {
        console.error("Failed to fetch player data:", err);
        return await loadPlayersFromDB(); // fallback to stored data if fetch fails
    }
}


// Fantasy Football 
function getRosterPositions(leagueData) {
    const positionCounts = {};

    leagueData.roster_positions.forEach(pos => {
        positionCounts[pos] = (positionCounts[pos] || 0) + 1;
    });

    return positionCounts;
}


function determineLeagueType(leagueData) {
    const settings = leagueData.settings || {};

    if (settings.best_ball === 1) return "Best Ball";
    if (settings.taxi_slots > 0) return "Dynasty";

    return "Redraft";
}


function determineLeagueScoring(leagueData) {
    const recScoring = leagueData?.scoring_settings?.rec;

    if (recScoring === 0) return "Standard";
    if (recScoring === 0.5) return "Half-PPR";
    if (recScoring === 1) return "PPR";

    return "Custom Scoring";
}


function getTeamName(userData, leagueUsers) {
    const userElement = leagueUsers.find(user => user.user_id === userData.user_id);

    if (!userElement) return "Your team";

    return userElement?.metadata?.team_name || "Unnamed team";
}


// Data management    // should probably make this modular in future
// generic local storage helpers
function saveToLocalStorage(key, value) {
    try {
        if (!value) throw new Error("No data to save.");
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Failed to save data for ${key}:`, error);
    }
}


function loadFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`Failed to load data for ${key}:`, error);
        return null;
    }
}


function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Failed to remove ${key}:`, error);
    }
}


// save/load/clear all
function saveAllData() {
    Object.entries(localStorageRegistry).forEach(([key, { get }]) => {
        saveToLocalStorage(key, get());
    });
}


function loadAllData() {
    Object.entries(localStorageRegistry).forEach(([key, { set }]) => {
        const saved = loadFromLocalStorage(key);
        set(saved);
    });
}


function clearAllData() {
    clearAppState();

    const keys = Object.keys(localStorageRegistry);
    const labels = keys.map(key => localStorageRegistry[key].label || "some saved data");

    const itemsToClear = labels
        .join(", ")
        .replace(/, ([^,]*)$/, " and $1");

    const confirmed = confirm(`Are you sure you want to clear ${itemsToClear}?`);
    if (!confirmed) return;

    keys.forEach(removeFromLocalStorage);
    showToast(`${itemsToClear} have been cleared.`);
}


// app state reset helpers
function clearUser() {
    userData = {};
    userNameSpan.textContent = "";
}


function clearLeagues() {
    leagues = [];
    leagueData = {};
    
    leagueInfoContainer.innerHTML = "";
}


function clearMatchups() {
    leagueUsers = [];
    leagueRosters = [];
    leagueMatchups = [];

    userTeamContainer.innerHTML = "";
    opponentTeamContainer.innerHTML = "";
}

function clearNflState() {
    nflState = {};
}


function clearAppState() {
    clearUser();
    clearLeagues();
    clearNflState();
    clearMatchups();
}


// UI 
function renderLeagueInformation(leagueData, containerElement, leagueUsers, userData) {
    const positionCounts = getRosterPositions(leagueData);

    const displayOrder = [
        "QB",
        "RB",
        "WR",
        "TE",
        "FLEX",
        "REC_FLEX",
        "WRRB_FLEX",
        "SUPER_FLEX",
        "BN"
    ];

    const items = displayOrder
        .filter(pos => positionCounts[pos])
        .map(pos => {
            const label = pos
                .replace("WRRB_FLEX", "W/R")
                .replace("REC_FLEX", "W/T")
                .replace("SUPER_FLEX", "SuperFlex")
                .replace("FLEX", "Flex")
                .replace("BN", "Bench");
            return `<span>${label}: ${positionCounts[pos]}</span>`;  // adjust styling
        });

    const positionHTML = `<p><strong>Roster Positions:</strong> ${items.join(', ')}</p>`;

    containerElement.innerHTML = `
        <p><strong>League Name:</strong> ${leagueData.name}</p>
        <p><strong>League Type:</strong> ${leagueData.season} ${leagueData.total_rosters}-team ${determineLeagueType(leagueData)} ${determineLeagueScoring(leagueData)}</p>  
        ${positionHTML}
        <p><strong>Team Name:</strong> ${getTeamName(userData, leagueUsers)}</p>
    `;
}


function renderMatchup(userData, leagueUsers, leagueRosters, leagueMatchups, userTeamContainer, opponentTeamContainer) {
    const userTeamName = getTeamName(userData, leagueUsers);
    const userRoster = leagueRosters.find(r => r.owner_id === userData.user_id);
    if (!userRoster) {
        console.warn("User roster not found.");
        return;
    }

    const userMatchup = leagueMatchups.find(m => m.roster_id === userRoster.roster_id);
    if (!userMatchup) {
        console.warn("User matchup not found.");
        return;
    }

    console.log(`${userTeamName}'s Roster:`, userRoster);

    function getOpponentInfo(userMatchup, matchups, rosters, users) {
        const opponentMatchup = matchups.find(m => m.matchup_id === userMatchup.matchup_id && m.roster_id !== userMatchup.roster_id);
        if (!opponentMatchup) return null;

        const opponentRoster = rosters.find(r => r.roster_id === opponentMatchup.roster_id);
        if (!opponentRoster) return null;

        const opponentUser = users.find(u => u.user_id === opponentRoster.owner_id);
        return { matchup: opponentMatchup, roster: opponentRoster, user: opponentUser };
    }

    const opponentInfo = getOpponentInfo(userMatchup, leagueMatchups, leagueRosters, leagueUsers);
    if (!opponentInfo) {
        console.warn("Opponent info not found.");
        return;
    }

    const opponentTeamName = opponentInfo.user?.metadata?.team_name || "No team name found";
    console.log(`${opponentTeamName}'s Roster:`, opponentInfo.roster);

    const renderStartersList = (starters) => {
    return `<ul>
        ${starters.map(playerId => {
        const player = playerData[playerId];
        if (!player) return `<li>Unknown Player (${playerId})</li>`;
        return `<li>${player.full_name} ${player.position} ${player.team}</li>`;
        }).join('')}
    </ul>`;
    };

    // Render user team info
    userTeamContainer.innerHTML = `
        <h2 class="text-xl font-semibold">${userTeamName}</h2>
        <div class="flex flex-row gap-8 text-sm">
            <p>Record: ${userRoster.settings.wins}-${userRoster.settings.losses}</p>
            <p class="ml-auto">FTPS: ${userRoster.settings.fpts}</p>
        </div>
        <h3 class="text-lg font-semibold py-2">Starters</h3>
        ${renderStartersList(userMatchup.starters)}
    `;

    // Render opponent team info
    opponentTeamContainer.innerHTML = `
        <h2 class="text-xl font-semibold">${opponentTeamName}</h2>
        <div class="flex flex-row gap-8 text-sm">
            <p>Record: ${opponentInfo.roster.settings.wins}-${opponentInfo.roster.settings.losses}</p>
            <p class="ml-auto">FTPS: ${opponentInfo.roster.settings.fpts}</p>
        </div>
        <h3 class="text-lg font-semibold py-2">Starters</h3>
        ${renderStartersList(opponentInfo.matchup.starters)}
    `;
}


function showToast(message = "Saved successfully!") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("opacity-0");
  toast.classList.add("opacity-100");

  setTimeout(() => {
    toast.classList.remove("opacity-100");
    toast.classList.add("opacity-0");
  }, 2500);
}


// Event Listeners
document.addEventListener("DOMContentLoaded", async () => {
    const playerData = await loadPlayerData();
    window.playerData = playerData;
    
    loadAllData();

    if (userData?.display_name) {
        userNameSpan.textContent = userData.display_name;
    }

    if (leagues && leagues.length > 0) {
        leagueOptions.innerHTML = "";
        leagues.forEach(league => {
            const option = document.createElement("option");
            option.value = league.league_id;
            option.textContent = league.name;
            leagueOptions.appendChild(option);
        });
        leagueOptions.value = "";
    }

    if (leagueData && leagueUsers && userData?.user_id) {
        renderLeagueInformation(leagueData, leagueInfoContainer, leagueUsers, userData);
        renderMatchup(userData, leagueUsers, leagueRosters, leagueMatchups, userTeamContainer, opponentTeamContainer);
    }
});


getUserBtn.addEventListener("click", async () => {
    getUserBtn.disabled = true;
    const originalText = getUserBtn.textContent;
    getUserBtn.textContent = "Loading...";

    clearUser();

    const userName = prompt("Please enter your Sleeper username:");

    if (!userName?.trim()) {
        getUserBtn.disabled = false;
        getUserBtn.textContent = originalText;
        return;
    }

    try {
        userData = await fetchUserData(userName);
        console.log("Fetched Sleeper user:", userData);

        userNameSpan.textContent = userData.display_name;

        saveToLocalStorage(LS_USER_KEY, userData);
        showToast("User data saved!");

    } catch (error) {
        alert("Failed to fetch user data. Please check the username and try again.");
    } finally {
        getUserBtn.disabled = false;
        getUserBtn.textContent = originalText;
    }
});


getLeaguesBtn.addEventListener("click", async () => {
    getLeaguesBtn.disabled = true;
    const originalText = getLeaguesBtn.textContent;
    getLeaguesBtn.textContent = "Loading...";
    
    clearLeagues();
    
    try {
        leagues = await fetchAllLeagues(userData.user_id)
        
        console.log(`${userData.display_name} leagues:`, leagues);

        if (!userData?.user_id) {
            alert("No user found. Please fetch user data first.");
            return;
        }

        leagueOptions.innerHTML = "";
        leagues.forEach(league => {
            const option = document.createElement("option");
            option.value = league.league_id;
            option.textContent = league.name;
            leagueOptions.appendChild(option);
        });

        saveToLocalStorage("userLeagues", leagues);
        showToast("Leagues saved!");
        
    } catch (error) {
        alert("Failed to fetch user leagues.");
    } finally {
        getLeaguesBtn.disabled = false;
        getLeaguesBtn.textContent = originalText;
    }
});


selectedLeagueBtn.addEventListener("click", async () => {
    selectedLeagueBtn.disabled = true;
    const originalText = selectedLeagueBtn.textContent;
    selectedLeagueBtn.textContent = "Loading...";

    clearLeagues();
    clearNflState();
    clearMatchups();
    
    if (leagueOptions.value == "") {
        selectedLeagueBtn.disabled = false;
        selectedLeagueBtn.textContent = originalText;
        return;
    } 

    try {
        leagueData = await fetchLeagueData(leagueOptions.value);
        console.log(`${leagueData.name} info:`, leagueData);

        leagueUsers = await fetchLeagueUsers(leagueOptions.value);
        console.log(`${leagueData.name} users:`, leagueUsers);

        leagueRosters = await fetchLeagueRosters(leagueOptions.value);
        console.log(`${leagueData.name} rosters:`, leagueRosters);

        nflState = await getNflState();
        console.log(nflState);

        leagueMatchups = await fetchLeagueMatchups(leagueOptions.value, nflState.week);
        console.log(`${leagueData.name} matchups:`, leagueMatchups);

        renderLeagueInformation(leagueData, leagueInfoContainer, leagueUsers, userData);
        renderMatchup(userData, leagueUsers, leagueRosters, leagueMatchups, userTeamContainer, opponentTeamContainer);

        saveToLocalStorage(LS_LEAGUE_KEY, leagueData);
        saveToLocalStorage(LS_USERS_KEY, leagueUsers);
        saveToLocalStorage(LS_ROSTERS_KEY, leagueRosters);
        saveToLocalStorage(LS_MATCHUPS_KEY, leagueMatchups);
        showToast("League data saved!");

    } catch (error) {
        console.error("Error fetching league info:", error);
        alert("Failed to fetch league info.");
    } finally {
        selectedLeagueBtn.disabled = false;
        selectedLeagueBtn.textContent = originalText;
    }
});


clearBtn.addEventListener("click", clearAllData);
