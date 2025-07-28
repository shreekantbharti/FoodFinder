const formBox = document.getElementById("formBox");
let signupMode = false; // Tracks sign-in (false) or sign-up (true)
let signupStep = 1; // Tracks signup step (1: initial signup, 2: vendor details)

function toggleForm() {
  signupMode = !signupMode;
  signupStep = 1;
  renderForm();
  const errorMessageDiv = document.getElementById("errorMessage");
  if (errorMessageDiv) {
    errorMessageDiv.innerHTML = "";
  }
}

function renderForm() {
  if (signupMode && signupStep === 1) {
    formBox.innerHTML = `
      <div id="errorMessage" class="text-red-500 mb-4"></div>
      <h3>Sign Up</h3>
      <input type="text" id="signupName" placeholder="Your Name" required />
      <input type="email" id="signupEmail" placeholder="Email" required />
      <input type="password" placeholder="Password" id="signupPassword" required />
      <select id="role">
        <option value="" disabled selected>Select Role</option>
        <option value="user">Customer</option>
        <option value="vendor">Vendor</option>
      </select>
      <button onclick="handleInitialSubmit()">Next</button>
      <div class="toggle" onclick="toggleForm()">Already have an account? Sign In</div>
    `;
  } else if (signupMode && signupStep === 2) {
    formBox.innerHTML = `
      <div id="errorMessage" class="text-red-500 mb-4"></div>
      <h3>Vendor Details</h3>
      <input type="text" placeholder="Business/Stall Name" id="businessName" required />
      <input type="text" placeholder="Food Type (e.g., Italian, Chinese)" id="foodType" />
      <input type="text" placeholder="City" id="city" />
      <input type="tel" placeholder="Phone Number" id="phoneNumber" />
      <div class="mb-4">
        <button type="button" onclick="getCurrentLocation()" class="bg-blue-500 text-white px-4 py-2 rounded">
          📍 Get Current Location
        </button>
        <div id="locationStatus" class="text-sm mt-2"></div>
      </div>
      <button onclick="handleVendorSubmit()">Complete Registration</button>
      <div class="toggle" onclick="toggleForm()">Back to Sign In</div>
    `;
  } else {
    formBox.innerHTML = `
      <div id="errorMessage" class="text-red-500 mb-4"></div>
      <h3>Sign In</h3>
      <input type="email" placeholder="Email" id="loginEmail" required pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}" />
      <input type="password" placeholder="Password" id="loginPassword" required />
      <button onclick="handleLogin()">Log In</button>
      <div class="toggle" onclick="toggleForm()">New user? Sign Up</div>
    `;
  }
}

async function handleInitialSubmit() {
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  const role = document.getElementById("role").value;

  if (!name || !email || !password || !role) {
    const errorMessageDiv = document.getElementById("errorMessage");
    errorMessageDiv.textContent = "Please fill in all fields.";
    return;
  }

  try {
    // First try to register
    const response = await axios.post("api/auth/register", {
      name,
      email,
      password,
      role,
    });
    if (role === "vendor") {
      signupStep = 2;
      renderForm();
    } else {
      // For "user" role (customers)
      window.location.href = "index.html";
    }
  } catch (err) {
    const errorMessageDiv = document.getElementById("errorMessage");

    if (err.response && err.response.status === 409) {
      // Email already exists, try to login instead
      try {
        const loginResponse = await axios.post("api/auth/login", {
          email,
          password,
        });

        if (role === "vendor") {
          // If user wants to be a vendor, upgrade their role
          try {
            await axios.put("api/auth/upgrade-to-vendor");
            signupStep = 2;
            renderForm();
          } catch (upgradeErr) {
            errorMessageDiv.innerHTML = `Failed to upgrade to vendor: ${
              upgradeErr.response?.data?.message || upgradeErr.message
            }`;
          }
        } else {
          window.location.href = "index.html";
        }
      } catch (loginErr) {
        errorMessageDiv.innerHTML = `
          This email is already registered with a different password. Please 
          <a href="#" onclick="toggleForm()" class="text-blue-500 underline">log in</a> 
          or use a different email.
        `;
      }
    } else {
      let message = "Signup failed. Please try again.";
      if (err.response) {
        message = `Signup failed: ${err.response.status} ${err.response.statusText}.`;
        if (err.response.data && err.response.data.message) {
          message += ` ${err.response.data.message}`;
        }
      } else {
        message = `Signup request failed. Is your server running? Error: ${err.message}`;
      }
      errorMessageDiv.textContent = message;
    }
    console.error(err);
  }
}

async function handleVendorSubmit() {
  const businessName = document.getElementById("businessName").value;
  const foodType = document.getElementById("foodType").value;
  const city = document.getElementById("city").value;
  const phoneNumber = document.getElementById("phoneNumber").value;

  if (!businessName) {
    const errorMessageDiv = document.getElementById("errorMessage");
    errorMessageDiv.textContent = "Business name is required.";
    return;
  }

  try {
    const vendorData = {
      businessName,
      stallName: businessName,
      foodType,
      city,
      phoneNumber,
    };

    // Include location if available
    if (currentLatitude && currentLongitude) {
      vendorData.latitude = currentLatitude;
      vendorData.longitude = currentLongitude;
    }

    await axios.put("api/auth/vendor", vendorData);
    alert("Vendor registration completed successfully!");
    window.location.href = "VendorDashboard.html";
  } catch (err) {
    const errorMessageDiv = document.getElementById("errorMessage");
    if (err.response) {
      errorMessageDiv.textContent = `Failed to submit vendor details: ${err.response.status} ${err.response.statusText}.`;
      if (err.response.data && err.response.data.message) {
        errorMessageDiv.textContent += ` ${err.response.data.message}`;
      }
    } else {
      errorMessageDiv.textContent = `Submission failed. Is your server running? Error: ${err.message}`;
    }
    console.error(err);
  }
}

async function handleLogin() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    await axios.post("http://localhost:3000/api/auth/login", {
      email,
      password,
    });
    alert("Login successful!");
    window.location.href = "index.html";
  } catch (err) {
    const message = err.response
      ? `Login failed: ${err.response.status} ${
          err.response.statusText
        }. Response: ${err.response.data?.message || "No response body"}`
      : `Login request failed. Is your server running? Error: ${err.message}`;
    alert(message);
    console.error("Login error:", err);
  }
}

// Initialize form
renderForm();

// Location variables
let currentLatitude = null;
let currentLongitude = null;

// Get current location function
function getCurrentLocation() {
  const statusDiv = document.getElementById("locationStatus");

  if (!navigator.geolocation) {
    statusDiv.innerHTML =
      '<span class="text-red-500">Geolocation is not supported by this browser.</span>';
    return;
  }

  statusDiv.innerHTML =
    '<span class="text-blue-500">Getting your location...</span>';

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      currentLatitude = position.coords.latitude;
      currentLongitude = position.coords.longitude;

      try {
        // Get location details from coordinates
        const response = await axios.get(
          `api/auth/location/${currentLatitude}/${currentLongitude}`
        );

        if (response.data.success) {
          const address = response.data.location.formatted_address;
          statusDiv.innerHTML = `<span class="text-green-500">📍 Location: ${address}</span>`;

          // Auto-fill city if available
          const cityInput = document.getElementById("city");
          if (cityInput && response.data.location.components) {
            const cityComponent = response.data.location.components.find(
              (comp) =>
                comp.types.includes("locality") ||
                comp.types.includes("administrative_area_level_2")
            );
            if (cityComponent) {
              cityInput.value = cityComponent.long_name;
            }
          }
        }
      } catch (error) {
        console.error("Location lookup error:", error);
        statusDiv.innerHTML = `<span class="text-green-500">📍 Location captured (${currentLatitude.toFixed(
          4
        )}, ${currentLongitude.toFixed(4)})</span>`;
      }
    },
    (error) => {
      console.error("Geolocation error:", error);
      let message = "Unable to get location: ";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message += "Permission denied";
          break;
        case error.POSITION_UNAVAILABLE:
          message += "Position unavailable";
          break;
        case error.TIMEOUT:
          message += "Request timeout";
          break;
        default:
          message += "Unknown error";
          break;
      }
      statusDiv.innerHTML = `<span class="text-red-500">${message}</span>`;
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    }
  );
}
