// import { fetchUser, fetchAllLeagues, fetchSingleLeague, fetchAllDrafts, fetchSingleDraft, fetchRosters, fetchPlayers } from "js/sleeperApi.js";
// import {  } from "js/constants.js";

let NflState = {};
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

const LS_USER_KEY = "userData";
const LS_LEAGUE_KEY = "leagueData";
const LS_USERS_KEY = "leagueUsers";
const LS_ROSTERS_KEY = "leagueRosters";
const LS_MATCHUPS_KEY = "leagueMatchups";

const ALL_LOCAL_STORAGE_KEYS = [
    LS_USER_KEY,
    LS_LEAGUE_KEY,
    LS_USERS_KEY,
    LS_ROSTERS_KEY,
    LS_MATCHUPS_KEY
]; //for future use - adding more keys

const localStorageRegistry = {
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

const saveBtn = document.getElementById("save-button");
const clearBtn = document.getElementById("clear-button");
const selectedLeagueBtn = document.getElementById("selected-league-button");


const { openDB, deleteDB } = window.idb;

const dbPromise = openDB("player-db", 1, {
    upgrade(db) {
        if (!db.objectStoreNames.contains("playerData")) {
        db.createObjectStore("playerData", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta");
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

async function loadPlayerData() {
  const db = await dbPromise;

  const lastFetch = await db.get("meta", "lastPlayerFetch");
  const now = Date.now();

  // Only re-fetch if it's been more than 24 hours
  if (lastFetch && now - lastFetch < 24 * 60 * 60 * 1000) {
    console.log("Loaded player data from IndexedDB.");
    console.log("Last fetch was at:", new Date(lastFetch).toLocaleString());

    const allPlayers = await db.getAll("playerData");
    return allPlayers;
  }

  try {
    const res = await fetch("https://api.sleeper.app/v1/players/nfl");
    const data = await res.json();

    // Flatten and store player records
    const tx = db.transaction(["playerData", "meta"], "readwrite");
    const playerStore = tx.objectStore("playerData");
    const metaStore = tx.objectStore("meta");

    await playerStore.clear();

    const playerEntries = Object.values(data).map((p, i) => ({
        ...p,
        id: p.player_id || `no-id-${i}`
    }));

    for (const player of playerEntries) {
      await playerStore.put(player);
    }

    await metaStore.put(Date.now(), "lastPlayerFetch");
    await tx.done;

    console.log("Fetched and stored new player data.");
    console.log("Fetch timestamp:", new Date(now).toLocaleString());
    return playerEntries;

  } catch (err) {
    console.error("Failed to fetch player data:", err);
    return [];
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

function getTeamName(leagueUsers, userData) {
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

function clearAppState() {
    clearUser();
    clearLeagues();
    leagueUsers = [];
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
        <p><strong>Team Name:</strong> ${getTeamName(leagueUsers, userData)}</p>
    `;
}

function renderMatchupInformation(userData, leagueData, leagueRosters, leagueMatchups, containerElement) {

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

    if (leagueData && leagueUsers && userData?.user_id) {
        renderLeagueInformation(leagueData, leagueInfoContainer, leagueUsers, userData);
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

        saveToLocalStorage(LS_USERS_KEY, leagueUsers);

        renderLeagueInformation(leagueData, leagueInfoContainer, leagueUsers, userData);

        saveToLocalStorage(LS_LEAGUE_KEY, leagueData);
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
