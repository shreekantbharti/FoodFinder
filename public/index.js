const foodItems = {
  Veg: {
    Snacks: [
      "Momos",
      "Rolls",
      "Chowmein",
      "Samosa",
      "Panipuri",
      "Sweets",
      "Drinks",
    ],
    Meals: ["Litti Chokha", "Chola Bhatura", "Dosa", "Idli"],
  },
  "Non-Veg": {
    Snacks: ["Rolls", "Momos", "Lollipop", "Sandwich", "Burger"],
    Meals: ["Biryani", "Pulawo", "Chicken Curry", "Fish Curry", "Egg Curry"],
  },
};

const foodImages = {
  Momos: "./assets/momos.jpeg",
  Rolls: "./assets/rolls.jpeg",
  Chowmein: "./assets/chowmein.jpeg",
  Samosa: "./assets/samosa.jpeg",
  Panipuri: "./assets/panipuri.jpeg",
  Sweets: "./assets/sweets.jpeg",
  Drinks: "./assets/drinks.jpeg",
  "Litti Chokha": "./assets/litti.jpeg",
  "Chola Bhatura": "./assets/chola.jpeg",
  Dosa: "./assets/dosa.jpeg",
  Idli: "./assets/idli.jpeg",
  Lollipop: "./assets/lollipop.jpeg",
  Sandwich: "./assets/sandwich.jpeg",
  Burger: "./assets/burger.jpeg",
  Biryani: "./assets/cbiryani.jpeg",
  Pulawo: "./assets/pulaow.jpeg",
  "Chicken Curry": "./assets/curry.jpeg",
  "Fish Curry": "./assets/fcurry.jpeg",
  "Egg Curry": "./assets/ecurry.jpeg",
};

let selectedFood = "";
let selectedType = "";
let selectedCategory = "";

const vegTypeSelect = document.getElementById("vegType");
const categorySelect = document.getElementById("category");
const foodVisualCards = document.getElementById("foodVisualCards");
const foodVisualWrapper = document.getElementById("foodVisualWrapper");
const defaultView = document.getElementById("defaultView");
const resultSection = document.getElementById("results");
const resultList = document.getElementById("resultList");
const vendorCount = document.getElementById("vendorCount");
const featuredSection = document.getElementById("featuredSection");

// window.onload = () => {
//   const name = localStorage.getItem('userName');
//   const role = localStorage.getItem('role');
//   const token = localStorage.getItem('token');
//   if (token && name && role === 'customer') {
//     document.getElementById('user-name').textContent = name;
//   } else {
//     window.location.href = 'landingPage.html';
//   }
// };

async function logout() {
  const token = localStorage.getItem("token");
  try {
    await fetch("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    console.error("Logout request failed:", err);
  }
  // localStorage.removeItem('token');
  // localStorage.removeItem('userName');
  // localStorage.removeItem('role');
  window.location.href = "landingPage.html";
}

vegTypeSelect.addEventListener("change", () => {
  selectedType = vegTypeSelect.value;
  categorySelect.innerHTML = '<option value="">Select Category</option>';
  foodVisualCards.innerHTML = "";
  foodVisualWrapper.classList.add("hidden");

  if (foodItems[selectedType]) {
    categorySelect.disabled = false;
    Object.keys(foodItems[selectedType]).forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categorySelect.appendChild(opt);
    });
  } else {
    categorySelect.disabled = true;
  }
});

categorySelect.addEventListener("change", () => {
  selectedCategory = categorySelect.value;
  renderFoodVisuals();
  if (selectedCategory) {
    featuredSection.style.display = "none";
  } else {
    featuredSection.style.display = "block";
  }
});

function renderFoodVisuals() {
  foodVisualCards.innerHTML = "";
  foodVisualWrapper.classList.remove("hidden");

  if (
    selectedType &&
    selectedCategory &&
    foodItems[selectedType][selectedCategory]
  ) {
    foodItems[selectedType][selectedCategory].forEach((food) => {
      const div = document.createElement("div");
      div.className =
        "cursor-pointer transition transform hover:scale-105 border rounded-xl shadow-sm overflow-hidden";
      div.innerHTML = `
        <img src="${
          foodImages[food] || "images/placeholder.jpg"
        }" alt="${food}" class="w-full h-24 object-cover" />
        <p class="text-sm font-medium py-1 bg-orange-100 text-center">${food}</p>
      `;
      div.onclick = () => {
        selectedFood = food;
        document
          .querySelectorAll("#foodVisualCards div")
          .forEach((card) =>
            card.classList.remove("ring-2", "ring-orange-500")
          );
        div.classList.add("ring-2", "ring-orange-500");
      };
      foodVisualCards.appendChild(div);
    });
  }
}

async function searchSuppliers() {
  const city = document.getElementById("city").value.trim();

  // More flexible validation - allow search with just city and type
  if (!city) {
    alert("⚠️ Please enter a city to search.");
    return;
  }

  if (!selectedType) {
    alert("⚠️ Please select food type (Veg/Non-Veg).");
    return;
  }

  // Show user what's missing in a helpful way
  const missingFields = [];
  if (!selectedCategory) missingFields.push("Category (Snacks/Meals)");
  if (!selectedFood) missingFields.push("Specific Food Item");

  if (missingFields.length > 0) {
    const proceed = confirm(
      `⚠️ Missing: ${missingFields.join(
        ", "
      )}.\n\nDo you want to search for all ${selectedType} vendors in ${city}?`
    );
    if (!proceed) return;
  }

  try {
    const searchData = {
      city,
      foodType: selectedType,
    };

    // Only add optional fields if they're selected
    if (selectedCategory) searchData.foodCategory = selectedCategory;
    if (selectedFood) searchData.foodItem = selectedFood;

    const res = await fetch("http://localhost:3000/api/vendor/nearby-vendors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(searchData),
    });

    const data = await res.json();
    resultList.innerHTML = "";
    vendorCount.textContent = `${data.vendors.length} vendor${
      data.vendors.length !== 1 ? "s" : ""
    } found`;

    if (data.vendors.length > 0) {
      data.vendors.forEach((v) => {
        resultList.innerHTML += `
          <li class="bg-white rounded-xl shadow p-4 hover:shadow-lg transition">
            <img src="${
              v.image || "images/placeholder.jpg"
            }" class="w-full h-32 object-cover rounded mb-2" alt="${v.name}" />
            <h4 class="text-lg font-bold text-orange-700">${v.name}</h4>
            <p class="text-sm text-gray-600 mb-1">📍 ${v.city}</p>
            <p class="text-sm mb-1">🍴 Food: <strong>${v.foodItem}</strong></p>
            <p class="text-sm mb-1">🧂 Distance: ${v.distance}</p>
            <a href="tel:${
              v.phoneNumber
            }" class="mt-2 inline-block bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm">
              📞 Call Vendor
            </a>
          </li>
        `;
      });
    } else {
      resultList.innerHTML = `<p class="text-gray-500">No vendors found for "${selectedFood}" in "${city}".</p>`;
    }

    defaultView.classList.add("hidden");
    foodVisualWrapper.classList.add("hidden");
    resultSection.classList.remove("hidden");
    resultSection.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    alert("Search request failed. Is the server running?");
    console.error(err);
  }
}

async function quickSearch() {
  const city = document.getElementById("city").value.trim();

  if (!city) {
    alert("⚠️ Please enter a city to search.");
    return;
  }

  if (!selectedType) {
    alert("⚠️ Please select food type (Veg/Non-Veg).");
    return;
  }

  try {
    const searchData = {
      city,
      foodType: selectedType,
    };

    const res = await fetch("http://localhost:3000/api/vendor/nearby-vendors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(searchData),
    });

    const data = await res.json();

    // Show results using existing elements
    resultList.innerHTML = "";
    vendorCount.textContent = `${data.vendors?.length || 0} vendor${
      (data.vendors?.length || 0) !== 1 ? "s" : ""
    } found`;

    if (data.vendors && data.vendors.length > 0) {
      data.vendors.forEach((v) => {
        resultList.innerHTML += `
          <li class="bg-white rounded-xl shadow p-4 hover:shadow-lg transition vendor-card">
            <img src="${
              v.image || "images/placeholder.jpg"
            }" class="w-full h-32 object-cover rounded mb-2" alt="${v.name}" />
            <h4 class="text-lg font-bold text-orange-700">${
              v.name || v.stallName
            }</h4>
            <p class="text-sm text-gray-600 mb-1">📍 ${v.city}</p>
            <p class="text-sm mb-1">🍴 Food Type: <strong>${
              v.foodType
            }</strong></p>
            ${
              v.distance
                ? `<p class="text-sm mb-1">📏 Distance: ${v.distance}</p>`
                : ""
            }
            ${
              v.duration
                ? `<p class="text-sm mb-1">⏱️ Duration: ${v.duration}</p>`
                : ""
            }
            <a href="tel:${
              v.phoneNumber
            }" class="mt-2 inline-block bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm">
              📞 Call Vendor
            </a>
          </li>
        `;
      });
    } else {
      resultList.innerHTML = `
        <li class="col-span-full text-center py-8 text-gray-500">
          <p class="text-lg">😔 No vendors found</p>
          <p class="text-sm">Try adjusting your search criteria</p>
        </li>
      `;
    }

    defaultView.classList.add("hidden");
    foodVisualWrapper.classList.add("hidden");
    results.classList.remove("hidden");
    results.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    console.error("Search error:", err);
    alert("❌ Search failed. Please try again.");
  }
}

async function findNearbyVendors() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await fetch(
          "http://localhost:3000/api/vendor/nearby-vendors",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ latitude, longitude, maxDistance: 5000 }),
          }
        );

        const data = await res.json();
        if (res.ok) {
          const vendorList = document.getElementById("vendorList");
          vendorList.innerHTML = data.vendors
            .map(
              (vendor) => `
          <div class="bg-white rounded-xl shadow p-4">
            <h4 class="text-lg font-bold text-orange-700">${vendor.name}</h4>
            <p class="text-sm text-gray-600">${vendor.distance} away (${vendor.duration})</p>
          </div>
        `
            )
            .join("");
        } else {
          alert(data.message || "Failed to find nearby vendors");
        }
      } catch (err) {
        alert("Request failed. Is the server running?");
        console.error(err);
      }
    },
    () => {
      alert("Unable to retrieve your location");
    }
  );
}

function getLocation() {
  const status = document.getElementById("locationStatus");
  if (navigator.geolocation) {
    status.textContent = "Detecting location...";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        status.textContent = `Location set to Pune (Lat ${pos.coords.latitude.toFixed(
          2
        )}, Lon ${pos.coords.longitude.toFixed(2)})`;
        document.getElementById("city").value = "Pune"; // TODO: Use reverse geocoding
      },
      () => {
        status.textContent = "Location access denied.";
      }
    );
  } else {
    status.textContent = "Geolocation not supported.";
  }
}

function resetFields() {
  document.getElementById("city").value = "";
  vegTypeSelect.value = "";
  categorySelect.innerHTML = '<option value="">Select Category</option>';
  categorySelect.disabled = true;
  foodVisualWrapper.classList.add("hidden");
  foodVisualCards.innerHTML = "";
  selectedFood = "";
  selectedType = "";
  selectedCategory = "";
  resultSection.classList.add("hidden");
  defaultView.classList.remove("hidden");
  vendorCount.textContent = "";
  document.getElementById("vendorList").innerHTML = "";
}
