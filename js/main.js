// import { fetchUser, fetchAllLeagues, fetchSingleLeague, fetchAllDrafts, fetchSingleDraft, fetchRosters, fetchPlayers } from "js/sleeperApi.js";
// import {  } from "js/constants.js";

let userData = {};
let leagues = [];
let leagueData = {};

const getUserBtn = document.getElementById("get-user-button");
const getLeaguesBtn = document.getElementById("get-leagues-button");

const userNameSpan = document.getElementById("user-name-span");

const leagueOptions = document.getElementById("league-options");
const leagueInfo = document.getElementById("league-info");

const LS_USER_KEY = "sessionUserData";
const LS_LEAGUE_KEY = "sessionLeagueData";

const saveBtn = document.getElementById("save-button");
const clearBtn = document.getElementById("clear-button");
const selectedLeagueBtn = document.getElementById("selected-league-button");


// Functions
// Sleeper API calls
async function fetchUserData(userName) {
    if (typeof userName !== "string") {
        throw new Error("Invalid username input.");
    }

    const url = `https://api.sleeper.app/v1/user/${userName.toLowerCase()}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`User not found (${res.status})`);

    return res.json();
}

async function fetchAllLeagues(userId, season = getNflSeasonYear()) {
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

// Fantasy Football 
function getNflSeasonYear() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    return month < 4 ? year - 1 : year;
}

function getRosterPositions(leagueData) {
    const positionCounts = {};

    leagueData.roster_positions.forEach(pos => {
        positionCounts[pos] = (positionCounts[pos] || 0) + 1;
    });

    return positionCounts;
}

// Data management
function clearLocalStorage() {
    //clears all saved data
}

function clearUser() {
    userData = {};
    
    userNameSpan.textContent = "";
}

function clearLeagues() {
    leagues = [];
    leagueData = {};

    leagueInfo.innerHTML = "";
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

// UI 
function renderLeagueInfo(leagueData, containerElement) {
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
        <p>${leagueData.sport.toUpperCase()} ${leagueData.season} Season</p>
        <p><strong>League size:</strong> ${leagueData.total_rosters} teams</p>
        ${positionHTML}
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
document.addEventListener("DOMContentLoaded", () => {

    const savedUser = loadUserData();
    if (savedUser) {
        userData = savedUser;

        userNameSpan.textContent = userData.display_name;
    }

    const savedLeague = loadLeagueData();
    if (savedLeague) {
        leagueData = savedLeague;

        renderLeagueInfo(leagueData, leagueInfo);
    }
});


getUserBtn.addEventListener("click", async () => {
    clearUser();

    const userName = prompt("Please enter your Sleeper username:");

    if (!userName?.trim()) return;

    try {
        userData = await fetchUserData(userName);
        console.log("Fetched Sleeper user:", userData);

        userNameSpan.textContent = userData.display_name;

        saveUserData();
        showToast("User data saved!");

    } catch (error) {
        alert("Failed to fetch user data. Please check the username and try again.");
    }
});


getLeaguesBtn.addEventListener("click", async () => {
    clearLeagues();
    
    try {
        leagues = await fetchAllLeagues(userData.user_id)
        console.log(`${userData.display_name} leagues:`, leagues);
        
        leagues.forEach(league => {
            const option = document.createElement("option");
            option.value = league.league_id;
            option.textContent = league.name;
            leagueOptions.appendChild(option);
        });
        
    } catch (error) {
        alert("Failed to fetch user leagues.");
    }
});


selectedLeagueBtn.addEventListener("click", async () => {
    if (leagueOptions.value == "") return;

    try {
        leagueData = await fetchLeagueData(leagueOptions.value);
        console.log(`${leagueData.name} info:`, leagueData);

        renderLeagueInfo(leagueData, leagueInfo);

        saveLeagueData();
        showToast("League data saved!");

    } catch (error) {
        console.error("Error fetching league info:", error);
        alert("Failed to fecth league info.");
    }
});


clearBtn.addEventListener("click", () => {
    // add a confirmation alert/window
    
    //clearLocalStorage();
    clearUser();
    clearLeagues();
})
