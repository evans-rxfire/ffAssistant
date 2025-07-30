// import { fetchUser, fetchAllLeagues, fetchSingleLeague, fetchAllDrafts, fetchSingleDraft, fetchRosters, fetchPlayers } from "js/sleeperApi.js";

let userData = {};
let leagues = [];
let leagueData = {};

const getUserBtn = document.getElementById("get-user-button");
const getLeaguesBtn = document.getElementById("get-leagues-button");

const userNameSpan = document.getElementById("user-name-span");
const userIdSpan = document.getElementById("user-id-span");

const leagueOptions = document.getElementById("league-options");
const leagueInfo = document.getElementById("league-info");

const saveBtn = document.getElementById("save-button");
const clearBtn = document.getElementById("clear-button");
const selectedLeagueBtn = document.getElementById("selected-league-button");


// Functions
function getNflSeasonYear() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    return month < 4 ? year - 1 : year;
}

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


// Data management functions
function clearUser() {
    userData = {};
    
    userNameSpan.textContent = "";
    userIdSpan.textContent = "";
}

function clearLeagues() {
    leagues = [];
    leagueData = {};

    leagueInfo.innerHTML = "";
}


// Event Listeners
getUserBtn.addEventListener("click", async () => {
    clearUser();

    const userName = prompt("Please enter your Sleeper username:");

    if (!userName?.trim()) return;

    try {
        userData = await fetchUserData(userName);
        console.log("Fetched Sleeper user:", userData);

        userNameSpan.textContent = userData.display_name;
        userIdSpan.textContent = userData.user_id;
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

        leagueInfo.innerHTML = `
            <p> League Name: ${leagueData.name}</p>
            <p> League ID: ${leagueData.league_id}</p>
            <p> ${leagueData.sport.toUpperCase()} ${leagueData.season} Season</p>
            <p> League size: ${leagueData.total_rosters} teams</p>
        `;

    } catch (error) {
        alert("Failed to fecth league info.");
    }
});


clearBtn.addEventListener("click", () => {
    clearUser();
})
