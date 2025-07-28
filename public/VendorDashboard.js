// window.onload = () => {
//   // const name = localStorage.getItem('userName');
//   // const role = localStorage.getItem('role');
//   // const token = localStorage.getItem('token');
//   if (token && name && role === 'vendor') {
//     document.getElementById('user-name').textContent = name;
//   } else {
//     window.location.href = 'land.html';
//   }
// };

async function logout() {
  const token = localStorage.getItem('token');
  try {
    await fetch('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (err) {
    console.error('Logout request failed:', err);
  }
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  localStorage.removeItem('role');
  window.location.href = 'land.html';
}

async function submitStallDetails() {
  const stallName = document.getElementById('stallName').value;
  const foodType = document.getElementById('foodType').value;
  const city = document.getElementById('city').value;
  const locationInput = document.getElementById('location').value;
  const phoneNumber = document.getElementById('phoneNumber').value;

  if (!stallName || !foodType || !city || !locationInput || !phoneNumber) {
    alert('Please fill in all fields');
    return;
  }

  const [latitude, longitude] = locationInput.split(',').map(Number);
  if (isNaN(latitude) || isNaN(longitude)) {
    alert('Invalid location format. Use "latitude,longitude" (e.g., 12.34,56.78)');
    return;
  }

  // const location = { type: 'Point', coordinates: [longitude, latitude] };
  // const token = localStorage.getItem('token');

  try {
    const res = await fetch('http://localhost:3000/api/vendor/detailsOfStall', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ stallName, foodType, city, phoneNumber, location })
    });

    const data = await res.json();
    if (res.ok) {
      alert('Stall details saved successfully!');
    } else {
      alert(data.message || 'Failed to save stall details');
    }
  } catch (err) {
    alert('Request failed. Is the server running?');
    console.error(err);
  }
}

async function addMenuItem() {
  const name = document.getElementById('itemName').value;
  const price = document.getElementById('itemPrice').value;
  const description = document.getElementById('itemDescription').value;

  if (!name || !price || !description) {
    alert('Please fill in all menu fields');
    return;
  }

  // For now, add to local list (backend route needed)
  const menuList = document.getElementById('menuList');
  const li = document.createElement('li');
  li.textContent = `${name} - ₹${price} - ${description}`;
  menuList.appendChild(li);

  // Clear form
  document.getElementById('itemName').value = '';
  document.getElementById('itemPrice').value = '';
  document.getElementById('itemDescription').value = '';

  // TODO: Add backend call to /api/vendor/menu when implemented
  alert('Menu item added locally. Backend integration pending.');
}