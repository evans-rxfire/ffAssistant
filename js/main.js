// import { fetchUser, fetchAllLeagues, fetchSingleLeague, fetchAllDrafts, fetchSingleDraft, fetchRosters, fetchPlayers } from "js/sleeperApi.js";
// import {  } from "js/constants.js";

let NflState = {};
let userData = {};
let leagues = [];
let leagueData = {};
let leagueUsers = {};

const getUserBtn = document.getElementById("get-user-button");
const getLeaguesBtn = document.getElementById("get-leagues-button");

const userNameSpan = document.getElementById("user-name-span");

const leagueOptions = document.getElementById("league-options");
const leagueInfoContainer = document.getElementById("league-info-container");

const LS_USER_KEY = "sessionUserData";
const LS_LEAGUE_KEY = "sessionLeagueData";
const ALL_LOCAL_STORAGE_KEYS = [LS_USER_KEY, LS_LEAGUE_KEY];

const saveBtn = document.getElementById("save-button");
const clearBtn = document.getElementById("clear-button");
const selectedLeagueBtn = document.getElementById("selected-league-button");


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
function clearLocalStorageKeys(keys) {
    keys = Array.isArray(keys) ? keys : [keys];

    const existingKeys = keys.filter(key => localStorage.getItem(key) !== null);

    if (existingKeys.length === 0) {
        showToast("No saved data to remove.");
        return;
    }

    const labels = {
        [LS_USER_KEY]: "your profile",
        [LS_LEAGUE_KEY]: "league settings",
        // Add future keys here
    };

    const itemsToClear = keys
        .map(key => labels[key] || "some saved data")
        .join(", ")
        .replace(/, ([^,]*)$/, " and $1");

    const confirmed = confirm(`Are you sure you want to clear ${itemsToClear}?`);
    if (!confirmed) return;

    keys.forEach(key => localStorage.removeItem(key));

    showToast(`${itemsToClear} have been cleared.`);
}

function clearUser() {
    userData = {};
    
    userNameSpan.textContent = "";
}

function clearLeagues() {
    leagues = [];
    leagueData = {};

    leagueInfoContainer.innerHTML = "";
}

function saveUserData() {
    try {
        if (!userData) throw new Error("No user data to save.");

        localStorage.setItem(LS_USER_KEY, JSON.stringify(userData));
    } catch (error) {
        console.error("Failed to save user data:", error);
    }
}

function saveLeagueData() {
    try {
        if (!leagueData) throw new Error("No league data to save.");
        
        localStorage.setItem(LS_LEAGUE_KEY, JSON.stringify(leagueData));
    } catch (error) {
        console.error("Failed to save league data:", error);
    }
}

function saveLeagueUsers() {
    if (leagueUsers) {
        localStorage.setItem("leagueUsers", JSON.stringify(leagueUsers));
    }
}

function loadUserData() {
    try {
        const saved = localStorage.getItem(LS_USER_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.error("Failed to load user data:", error);
        return null;
    }
}

function loadLeagueData() {
    try {
        const saved = localStorage.getItem(LS_LEAGUE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.error("Failed to load league data:", error);
        return null;
    }
}

function loadLeagueUsers() {
    const data = localStorage.getItem("leagueUsers");
    return data ? JSON.parse(data) : null;
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
    const savedUser = loadUserData();
    if (savedUser) {
        userData = savedUser;
        userNameSpan.textContent = userData.display_name;
    }

    const savedLeague = loadLeagueData();
    const savedUsers = loadLeagueUsers();

    if (savedLeague && savedUsers && userData?.user_id) {
        leagueData = savedLeague;
        leagueUsers = savedUsers;

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

        saveUserData();
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

        saveLeagueUsers();

        renderLeagueInformation(leagueData, leagueInfoContainer, leagueUsers, userData);

        saveLeagueData();
        showToast("League data saved!");

    } catch (error) {
        console.error("Error fetching league info:", error);
        alert("Failed to fetch league info.");
    } finally {
        selectedLeagueBtn.disabled = false;
        selectedLeagueBtn.textContent = originalText;
    }
});


clearBtn.addEventListener("click", () => {
    clearUser();
    clearLeagues();
    clearLocalStorageKeys([LS_USER_KEY, LS_LEAGUE_KEY]);
})
