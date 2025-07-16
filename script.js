// Signup
if (document.getElementById("signupForm")) {
  signupForm.onsubmit = function (e) {
    e.preventDefault();
    localStorage.setItem(
      "user_" + signupUsername.value,
      signupPassword.value
    );
    alert("Signup successful!");
    window.location.href = "index.html";
  };
}

// Login
if (document.getElementById("loginForm")) {
  loginForm.onsubmit = function (e) {
    e.preventDefault();
    const saved = localStorage.getItem("user_" + loginUsername.value);
    if (saved === loginPassword.value) {
      localStorage.setItem("loggedInUser", loginUsername.value);
      window.location.href = "dashboard.html";
    } else {
      alert("Login failed!");
    }
  };
}

// Search
// Search by Ingredients + Recipe Name (Combined Logic)
// Search by Ingredients AND/OR Recipe Name (Stricter Matching)
if (document.getElementById("searchForm")) {
  searchForm.onsubmit = async function (e) {
    e.preventDefault();

    const ing = ingredientInput.value
      .toLowerCase()
      .split(",")
      .map(x => x.trim())
      .filter(x => x !== "");
    const name = nameInput.value.toLowerCase().trim();

    const res = await fetch("recipes.json");
    const recipes = await res.json();

    const filtered = recipes.filter(r => {
      const nameMatch = name !== "" && r.name.toLowerCase().includes(name);
      const ingMatch = ing.length > 0 && ing.every(inputIng =>
        r.ingredients.some(recipeIng =>
          recipeIng.toLowerCase().includes(inputIng)
        )
      );

      // Case 1: Name is given → return if it matches name
      // Case 2: Ingredients are given → return if all match
      // Case 3: Both are given → return if either matches
      return nameMatch || ingMatch;
    });

    localStorage.setItem("results", JSON.stringify(filtered));
    window.location.href = "results.html";
  };
}



// Show Results
if (location.pathname.includes("results.html")) {
  const recipes = JSON.parse(localStorage.getItem("results") || "[]");
  const fav = JSON.parse(localStorage.getItem("favorites") || "[]");
  const container = document.getElementById("recipeList");
  container.innerHTML = recipes.map(r => `
    <div class="recipe-box">
      <h3>${r.name}</h3>
      <img src="images/${r.image}" alt="${r.name}">
      <br>
      <a href="recipe.html?id=${r.id}">View</a>
      <button onclick="toggleFavorite(${r.id})">
        ${fav.includes(r.id) ? '💔 Remove' : '❤️ Add'}
      </button>
    </div>
  `).join("");
}


// Show Recipe Details
if (location.pathname.includes("recipe.html")) {
  const id = parseInt(new URLSearchParams(location.search).get("id"));
  fetch("recipes.json")
    .then(res => res.json())
    .then(data => {
      const recipe = data.find(r => r.id === id);
      if (recipe) {
        document.getElementById("recipeContainer").innerHTML = `
          <h2>${recipe.name}</h2>
          <img src="images/${recipe.image}" alt="${recipe.name}">
          <p><strong>Ingredients:</strong> ${recipe.ingredients.join(", ")}</p>
          <p><strong>Process:</strong> ${recipe.process}</p>
          <p><a href="${recipe.youtube}" target="_blank"></a></p>
          <p><a href="${recipe.order}" target="_blank"></a></p>`;
      }
    });
}
//add to favorates
function toggleFavorite(id) {
  let fav = JSON.parse(localStorage.getItem("favorites") || "[]");
  const index = fav.indexOf(id);
  if (index === -1) {
    fav.push(id);
    alert("Added to favorites!");
  } else {
    fav.splice(index, 1);
    alert("Removed from favorites!");
  }
  localStorage.setItem("favorites", JSON.stringify(fav));
  location.reload(); // Refresh page to update buttons
}


// Show Favorites
if (location.pathname.includes("favorites.html")) {
  fetch("recipes.json")
    .then(res => res.json())
    .then(data => {
      const fav = JSON.parse(localStorage.getItem("favorites") || "[]");
      const recipes = data.filter(r => fav.includes(r.id));
      const container = document.getElementById("favoritesList");
      container.innerHTML = recipes.map(r => `
        <div class="recipe-box">
          <h3>${r.name}</h3>
          <img src="images/${r.image}" alt="${r.name}">
          <a href="recipe.html?id=${r.id}">View</a>
          <button onclick="toggleFavorite(${r.id})">💔 Remove</button>
        </div>
      `).join("");
    });
}
function downloadPDF() {
  const recipeHTML = document.getElementById("recipeContainer").innerText;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text(recipeHTML, 10, 10);
  doc.save("Recipedia_Recipe.pdf");
}
// SHARE RECIPE AS PDF
async function shareRecipeAsPDF() {
  const { jsPDF } = window.jspdf;

  const container = document.getElementById("recipeContainer");
  if (!container) {
    alert("Recipe content not found.");
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

  const blob = pdf.output("blob");
  const file = new File([blob], "Recipedia_Recipe.pdf", {
    type: "application/pdf",
  });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: "Recipedia Recipe",
        text: "Check out this delicious recipe!",
        files: [file],
      });
    } catch (err) {
      alert("Sharing failed: " + err.message);
    }
  } else {
    alert("Sharing not supported on this device. Downloading instead.");
    pdf.save("Recipedia_Recipe.pdf");
  }
}
