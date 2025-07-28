// import { fetchUser, fetchAllLeagues, fetchSingleLeague, fetchAllDrafts, fetchSingleDraft, fetchRosters, fetchPlayers } from "js/sleeperApi.js";

let userData = {};
let leagues = [];
let leagueData = {};

const getUserBtn = document.getElementById("get-user-button");


const userNameSpan = document.getElementById("user-name-span");
const userIdSpan = document.getElementById("user-id-span");

const saveBtn = document.getElementById("save-button");
const clearBtn = document.getElementById("clear-button");


// Functions
async function fetchUserData(userName) {
    if (typeof userName !== "string") {
        throw new Error("Invalid username input.");
    }

    const url = `https://api.sleeper.app/v1/user/${userName.toLowerCase()}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`User not found (${res.status})`);

    return res.json();
}

function clearUser() {
    userNameSpan.textContent = "";
    userIdSpan.textContent = "";
}

// Event Listeners
getUserBtn.addEventListener("click", async () => {
    clearUser();

    const userName = prompt("Please enter your Sleeper username:");

    if (!userName?.trim()) return;

    try {
        const user = await fetchUserData(userName);
        console.log("Fetched Sleeper user:", user);

        userNameSpan.textContent = user.display_name;
        userIdSpan.textContent = user.user_id;
    } catch (error) {
        alert("Failed to fetch user data. Plese check the username and try again.");
    }
});


clearBtn.addEventListener("click", () => {
    clearUser();
})
