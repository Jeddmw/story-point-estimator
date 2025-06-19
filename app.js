import { db } from './firebase.js';

let userName = "";
let showVotes = false;
let myVote = null;
let votingEnabled = true;

function setVotingEnabled(enabled) {
  votingEnabled = enabled;
  document.querySelectorAll(".button-group button").forEach(btn =>
    btn.classList.toggle("disabled", !enabled)
  );
}

window.submitName = function () {
  const name = document.getElementById("usernameInput").value.trim();
  if (!name) return alert("Please enter your name.");

  userName = name;
  const userRef = db.ref("users/" + name);
  userRef.set({ voted: false });
  userRef.onDisconnect().remove();

  document.getElementById("nameModal").style.display = "none";
  showHostBadge();
};

window.submitVote = function (value) {
  if (!votingEnabled || !userName) return;

  myVote = value;
  document.querySelectorAll(".button-group button").forEach(btn =>
    btn.classList.toggle("selected", parseInt(btn.dataset.value) === value)
  );

  db.ref("votes/" + userName).set(value);
  db.ref("users/" + userName).set({ voted: true });
};

window.estimate = function () {
  db.ref("votes").once("value").then(snapshot => {
    const data = snapshot.val();
    if (!data) return;

    const avg = Object.values(data).reduce((a, b) => a + b, 0) / Object.keys(data).length;
    db.ref("results").set({ average: avg.toFixed(2), votes: data });
    db.ref("meta/votingEnabled").set(false);
    showVotes = true;
  });
};

window.reset = function () {
  db.ref("votes").remove();
  db.ref("results").remove();
  db.ref("meta/resetCounter").transaction(curr => (curr || 0) + 1);
  db.ref("meta/votingEnabled").set(true);

  unhighlightSelectedVote();
  document.getElementById("resultDisplay").textContent = "";
  showVotes = false;

  db.ref("users").once("value").then(snapshot => {
    const updates = {};
    snapshot.forEach(child => updates[child.key + "/voted"] = false);
    db.ref("users").update(updates);
  });
};

function unhighlightSelectedVote() {
  document.querySelectorAll(".button-group button").forEach(btn =>
    btn.classList.remove("selected")
  );
}

function renderUserList(users) {
  const ul = document.getElementById("userList");
  ul.innerHTML = "";

  db.ref("votes").once("value").then(snap => {
    const votes = snap.val() || {};
    for (const [name, data] of Object.entries(users)) {
      const voted = data.voted ? "✅" : "";
      const vote = showVotes && votes[name] !== undefined ? `→ ${votes[name]}` : "";
      const li = document.createElement("li");
      li.textContent = `${name} ${voted} ${vote}`;
      ul.appendChild(li);
    }
  });
}

function isHost() {
  return new URLSearchParams(window.location.search).get("host") === "true";
}

function showHostBadge() {
  const badge = document.getElementById("hostBadge");
  if (isHost()) {
    badge.innerHTML = `<strong>Host</strong><br/>You are logged in as: ${userName}`;
    document.getElementById("hostControls").style.display = "block";
  } else {
    badge.textContent = `You are logged in as: ${userName}`;
  }
}

db.ref("results").on("value", snapshot => {
  const data = snapshot.val();
  const display = document.getElementById("resultDisplay");
  if (!data) {
    display.textContent = "";
    showVotes = false;
    return;
  }
  display.textContent = `Average Estimate: ${data.average} (from ${Object.keys(data.votes).length} votes)`;
  showVotes = true;
});

db.ref("meta/resetCounter").on("value", () => {
  if (!userName) return;
  showVotes = false;
  setVotingEnabled(true);
  myVote = null;
  unhighlightSelectedVote();
  document.getElementById("resultDisplay").textContent = "";

  db.ref("votes/" + userName).remove();
  db.ref("users/" + userName).update({ voted: false }).then(() => {
    db.ref("users").once("value").then(snapshot => renderUserList(snapshot.val() || {}));
  });
});

db.ref("meta/votingEnabled").on("value", snapshot => {
  setVotingEnabled(snapshot.val() !== false);
});

window.addEventListener("DOMContentLoaded", () => {
  db.ref("users").on("value", snapshot => renderUserList(snapshot.val() || {}));
});
