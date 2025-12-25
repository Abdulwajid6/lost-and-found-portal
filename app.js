const API_URL = "https://lost-and-found-backend-1-pmfp.onrender.com";

https://lost-and-found-backend-1-pmfp.onrender.com

// =========================
// AUTH / LOGIN (GOOGLE OAUTH)
// =========================
const loginScreen = document.getElementById("loginScreen");
const appContent = document.getElementById("appContent");
const loginBtn = document.getElementById("loginBtnBig");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");

let currentUser = null;

// Redirect to Flask Google OAuth
loginBtn.onclick = () => {
  window.location.href = `${API_URL}/login`;
};

// Logout (Flask session clear)
logoutBtn.onclick = async () => {
  await fetch(`${API_URL}/logout`, {
    credentials: "include"
  });
  currentUser = null;
  loginScreen.style.display = "flex";
  appContent.style.display = "none";
  userInfo.textContent = "";
};

// Get logged-in user from backend
async function getCurrentUser() {
  const res = await fetch(`${API_URL}/me`, {
    credentials: "include"
  });

  if (res.ok) {
    currentUser = await res.json();
    if (currentUser) {
      loginScreen.style.display = "none";
      appContent.style.display = "block";
      userInfo.textContent = currentUser.name + (currentUser.is_admin ? " (Admin)" : "");
      loadItems();
      return;
    }
  }

  loginScreen.style.display = "flex";
  appContent.style.display = "none";
}
getCurrentUser();


// =========================
// LOAD ITEMS
// =========================
async function loadItems() {
  const res = await fetch(`${API_URL}/items`, {
    credentials: "include"
  });
  const items = await res.json();

  lostList.innerHTML = "";
  foundList.innerHTML = "";
  reportedList.innerHTML = "";

  items.forEach(item => {
    const li = document.createElement("li");
    li.className = "item-card";

    let actions = "";

    // Report button (any logged-in user)
    if (!item.reported) {
      actions += `<button onclick="reportItem(${item.id})">Report</button>`;
    }

    // Delete button (ADMIN or REPORTER only)
    if (
      currentUser &&
      (currentUser.is_admin || item.reported_by === currentUser.email)
    ) {
      actions += `<button class="delete" onclick="deleteItem(${item.id})">Delete</button>`;
    }

    li.innerHTML = `
      <span class="badge ${item.status}">${item.status}</span>
      ${item.reported ? `<span class="badge reported">Reported</span>` : ""}
      <h3>${item.title}</h3>
      <p>${item.description || ""}</p>
      <p><strong>Location:</strong> ${item.location || ""}</p>
      <p><strong>Date:</strong> ${item.date || ""}</p>
      <div class="item-actions">${actions}</div>
    `;

    if (item.reported) {
      reportedList.appendChild(li);
    } else if (item.status === "lost") {
      lostList.appendChild(li);
    } else {
      foundList.appendChild(li);
    }
  });
}


// =========================
// ADD ITEM
// =========================
document.getElementById("itemForm").addEventListener("submit", async e => {
  e.preventDefault();

  if (!currentUser) {
    alert("Please login first.");
    return;
  }

  const item = {
    title: title.value,
    description: description.value,
    status: itemType.value,
    location: location.value,
    date: date.value
  };

  await fetch(`${API_URL}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(item)
  });

  e.target.reset();
  loadItems();
});


// =========================
// REPORT ITEM
// =========================
async function reportItem(id) {
  await fetch(`${API_URL}/items/${id}/report`, {
    method: "POST",
    credentials: "include"
  });

  loadItems();
}


// =========================
// DELETE ITEM (ADMIN / REPORTER ONLY)
// =========================
async function deleteItem(id) {
  if (!confirm("Delete this item?")) return;

  const res = await fetch(`${API_URL}/items/${id}`, {
    method: "DELETE",
    credentials: "include"
  });

  if (res.status === 403) {
    alert("You are not allowed to delete this item.");
  }

  loadItems();
}

