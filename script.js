// script.js - updated to use backend API for auth & favourites

//const API_BASE = 'http://localhost:5000'; // change to your deployed backend URL in production
const API_BASE = 'https://recipedia-sfkt.onrender.com';

/* ---------------- SIGNUP ---------------- */
if (document.getElementById('signupForm')) {
  signupForm.onsubmit = async function (e) {
    e.preventDefault();
    const username = signupUsername.value.trim();
    const password = signupPassword.value;

    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      alert('Signup successful!');
      window.location.href = 'dashboard.html';
    } catch (err) {
      alert('Signup error: ' + err.message);
    }
  };
}

/* ---------------- LOGIN ---------------- */
if (document.getElementById('loginForm')) {
  loginForm.onsubmit = async function (e) {
    e.preventDefault();
    const username = loginUsername.value.trim();
    const password = loginPassword.value;

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      alert('Login successful');
      window.location.href = 'dashboard.html';
    } catch (err) {
      alert('Login failed: ' + err.message);
    }
  };
}

/* ---------------- LOGOUT helper ---------------- */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  window.location.href = 'index.html';
}

/* ---------------- SEARCH (same code as yours) ---------------- */
if (document.getElementById('searchForm')) {
  searchForm.onsubmit = async function (e) {
    e.preventDefault();

    const ing = ingredientInput.value
      .toLowerCase()
      .split(',')
      .map(x => x.trim())
      .filter(x => x !== '');
    const name = nameInput.value.toLowerCase().trim();

    const res = await fetch('recipes.json');
    const recipes = await res.json();

    const filtered = recipes.filter(r => {
      const nameMatch = name !== '' && r.name.toLowerCase().includes(name);
      const ingMatch = ing.length > 0 && ing.every(inputIng =>
        r.ingredients.some(recipeIng =>
          recipeIng.toLowerCase().includes(inputIng)
        )
      );
      return nameMatch || ingMatch;
    });

    localStorage.setItem('results', JSON.stringify(filtered));
    window.location.href = 'results.html';
  };
}

/* ----------------- Results listing ----------------- */
if (location.pathname.includes('results.html')) {
  const recipes = JSON.parse(localStorage.getItem('results') || '[]');
  loadFavoritesAndRender(recipes, 'recipeList');
}

/* ----------------- Recipe details ----------------- */
if (location.pathname.includes('recipe.html')) {
  const id = parseInt(new URLSearchParams(location.search).get('id'));
  fetch('recipes.json')
    .then(res => res.json())
    .then(data => {
      const recipe = data.find(r => r.id === id);
      if (recipe) {
        document.getElementById('recipeContainer').innerHTML = `
          <h2>${recipe.name}</h2>
          <img src="images/${recipe.image}" alt="${recipe.name}">
          <p><strong>Ingredients:</strong> ${recipe.ingredients.join(", ")}</p>
          <p><strong>Process:</strong> ${recipe.process}</p>
          
        `;
        // set favorite button state
        loadFavoritesAndRender([recipe], 'recipeContainer', true, id);
      }
    });
}

/* ----------------- Favorites page ----------------- */
if (location.pathname.includes('favorites.html')) {
  // fetch recipes.json then fetch user favourites from API (if logged in)
  fetch('recipes.json')
    .then(res => res.json())
    .then(async data => {
      let favIds = JSON.parse(localStorage.getItem('favorites') || '[]');
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const r = await fetch(`${API_BASE}/favourites`, {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const j = await r.json();
          if (r.ok && Array.isArray(j.favourites)) favIds = j.favourites;
        } catch (err) {
          console.warn('Failed to load server favourites, using local cache', err);
        }
      }
      const recipes = data.filter(r => favIds.includes(r.id));
      const container = document.getElementById('favoritesList');
      container.innerHTML = recipes.map(r => `
        <div class="recipe-box">
          <h3>${r.name}</h3>
          <img src="images/${r.image}" alt="${r.name}">
          <a href="recipe.html?id=${r.id}">View</a>
          <button onclick="toggleFavorite(${r.id})">💔 Remove</button>
        </div>
      `).join('');
    });
}

/* ----------------- Favorite helpers ----------------- */
async function toggleFavorite(id) {
  const token = localStorage.getItem('token');
  if (token) {
    // check if already favourite on server
    try {
      const res = await fetch(`${API_BASE}/favourites`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const json = await res.json();
      let favs = Array.isArray(json.favourites) ? json.favourites : [];
      if (favs.includes(id)) {
        await fetch(`${API_BASE}/favourites/remove`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ recipeId: id })
        });
        alert('Removed from favorites');
      } else {
        await fetch(`${API_BASE}/favourites/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ recipeId: id })
        });
        alert('Added to favorites');
      }
      location.reload();
      return;
    } catch (err) {
      console.error('Fav API error', err);
      alert('Server error while updating favourite');
      return;
    }
  }

  // fallback to localStorage (offline or not logged in)
  let fav = JSON.parse(localStorage.getItem('favorites') || '[]');
  const index = fav.indexOf(id);
  if (index === -1) {
    fav.push(id);
    alert('Added to favorites (local only)');
  } else {
    fav.splice(index, 1);
    alert('Removed from favorites (local only)');
  }
  localStorage.setItem('favorites', JSON.stringify(fav));
  location.reload();
}

/* Load favorites and render recipe lists, with optional single recipe button */
async function loadFavoritesAndRender(recipes, containerId, single=false, singleRecipeId=null) {
  const container = document.getElementById(containerId);
  let favIds = JSON.parse(localStorage.getItem('favorites') || '[]');
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const r = await fetch(`${API_BASE}/favourites`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const j = await r.json();
      if (r.ok && Array.isArray(j.favourites)) favIds = j.favourites;
    } catch (err) {
      console.warn('Fav API failed, using local cache', err);
    }
  }

  if (single && containerId === 'recipeContainer') {
    const btn = document.getElementById('favBtn');
    if (!btn) return;
    const isFav = favIds.includes(singleRecipeId);
    btn.innerText = isFav ? '💔 Remove from favorites' : '❤️ Add to favorites';
    btn.onclick = () => toggleFavorite(singleRecipeId);
    return;
  }

  container.innerHTML = recipes.map(r => `
    <div class="recipe-box">
      <h3>${r.name}</h3>
      <img src="images/${r.image}" alt="${r.name}">
      <br>
      <a href="recipe.html?id=${r.id}">View</a>
      <button onclick="toggleFavorite(${r.id})">
        ${favIds.includes(r.id) ? '💔 Remove' : '❤️ Add'}
      </button>
    </div>
  `).join('');
}

/* ---------------- PDF / Share helpers (unchanged) ---------------- */
function downloadPDF() {
  const container = document.getElementById('recipeContainer');
  if (!container) {
    alert("Recipe content not found.");
    return;
  }

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({
    unit: "pt",
    format: "a4"
  });

  const text = container.innerText;

  // Auto-wrap text to fit within PDF width
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40; 
  const maxWidth = pageWidth - margin * 2;

  const lines = doc.splitTextToSize(text, maxWidth);

  let y = 40;
  const lineHeight = 16;

  lines.forEach(line => {
    if (y + lineHeight > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 40;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  });

  doc.save("Recipedia_Recipe.pdf");
}

async function shareRecipeAsPDF() {
  const { jsPDF } = window.jspdf;

  const container = document.getElementById('recipeContainer');
  if (!container) {
    alert('Recipe content not found.');
    return;
  }

  const text = container.innerText; // get plain text from recipe
  const pdf = new jsPDF();
  pdf.setFontSize(12);
  const lineHeight = 7;
  const lines = pdf.splitTextToSize(text, 180);

  lines.forEach((line, i) => {
    pdf.text(line, 10, 10 + i * lineHeight);
  });

  const blob = pdf.output('blob');
  const file = new File([blob], 'Recipedia_Recipe.pdf', {
    type: 'application/pdf',
  });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: 'Recipedia Recipe',
        text: 'Check out this delicious recipe!',
        files: [file],
      });
    } catch (err) {
      alert('Sharing failed: ' + err.message);
    }
  } else {
    alert('Sharing not supported on this device. Downloading instead.');
    pdf.save('Recipedia_Recipe.pdf');
  }
}
function updateAuthUI() {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userDisplay = document.getElementById("userDisplay");

  if (!loginBtn || !logoutBtn || !userDisplay) return;

  if (token && username) {
    // user is logged in
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    userDisplay.style.display = "inline-block";
    userDisplay.textContent = `Welcome, ${username}`;
  } else {
    // user is logged out
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    userDisplay.style.display = "none";
  }
}

// Run this when page loads
document.addEventListener("DOMContentLoaded", updateAuthUI);
/* ---------------- NOTES FEATURE ---------------- */

// Save a note
async function saveNote() {
    const token = localStorage.getItem("token");
    if (!token) return alert("Login required");

    const title = document.getElementById("noteTitle").value;
    const content = document.getElementById("noteContent").value;

    if (!title || !content) return alert("Fill all fields");

    const res = await fetch(`${API_BASE}/notes/add`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ title, content })
    });

    const data = await res.json();
    alert(data.message);
    loadNotes();
}

// Load all notes
async function loadNotes() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(`${API_BASE}/notes/all`, {
        headers: { "Authorization": "Bearer " + token }
    });

    const notes = await res.json();
    const list = document.getElementById("notesList");

    list.innerHTML = notes.map(n => `
        <div class="recipe-box">
            <h4>${n.title}</h4>
            <p>${n.content}</p>
            <button onclick="deleteNote('${n._id}')">Delete</button>
        </div>
    `).join("");
}

// Delete note
async function deleteNote(id) {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/notes/delete/${id}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
    });

    const data = await res.json();
    alert(data.message);
    loadNotes();
}

// Auto-load notes on page open
if (location.pathname.includes("notes.html")) {
    document.addEventListener("DOMContentLoaded", loadNotes);
}
