
/* =========================================
   GURI VISUALS
   Booking Portal — JavaScript
   Theme: Espresso Editorial
========================================= */

/* YOUR SETTINGS */

const WHATSAPP_NUMBER = "916239750615";
const ADMIN_PASSWORD = "Gurivisuals@2008";

/* STORAGE */

const STORAGE_KEY = "guriVisualsBookings";

let bookings = [];

try {
  bookings = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
} catch (error) {
  bookings = [];
}

/* HELPERS */

function saveBookings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function getValue(form, name) {
  return form.querySelector(`[name="${name}"]`)?.value?.trim() || "";
}

function formatDate(date) {
  if (!date) return "Not selected";

  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

/* BOOKING FORM */

const bookingForm = document.getElementById("bookingForm");

if (bookingForm) {
  bookingForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = getValue(this, "name");
    const phone = getValue(this, "phone");
    const service = getValue(this, "service");
    const date = getValue(this, "date");
    const time = getValue(this, "time");
    const location = getValue(this, "location");
    const budget = getValue(this, "budget");
    const details = getValue(this, "details");

    if (!name || !phone || !service) {
      alert("Please fill in all required fields.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length < 10 || cleanPhone.length > 13) {
      alert("Please enter a valid WhatsApp number.");
      return;
    }

    const booking = {
      id: Date.now(),
      name,
      phone,
      service,
      date,
      time,
      location,
      budget,
      details,
      status: "Pending",
      createdAt: new Date().toLocaleString("en-IN")
    };

    bookings.push(booking);
    saveBookings();

    const message = `
Hello GURI VISUALS!

I want to book a shoot.

Name: ${name}
WhatsApp: ${phone}
Service: ${service}
Date: ${formatDate(date)}
Time: ${time || "Not specified"}
Location: ${location || "Not specified"}
Budget: ${budget || "Not specified"}

Shoot Details:
${details || "No additional details"}

Please contact me regarding availability and final pricing.
    `.trim();

    const whatsappURL =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    alert("Your booking request has been saved! WhatsApp will open next.");

    window.open(whatsappURL, "_blank");

    this.reset();
  });
}

/* SERVICE CARD BUTTONS */

document.querySelectorAll(".choose-service").forEach(button => {
  button.addEventListener("click", function () {
    const card = this.closest(".service-card");
    const serviceName = card?.querySelector("h3")?.textContent?.trim();

    const serviceSelect = document.querySelector(
      '#bookingForm select[name="service"]'
    );

    if (serviceSelect && serviceName) {
      const matchingOption = [...serviceSelect.options].find(option =>
        option.textContent.toLowerCase().includes(serviceName.toLowerCase())
      );

      if (matchingOption) {
        serviceSelect.value = matchingOption.value;
      }
    }

    document.getElementById("booking")?.scrollIntoView({
      behavior: "smooth"
    });
  });
});

/* ADMIN MODAL */

const adminModal = document.getElementById("adminModal");
const adminLogin = document.getElementById("adminLogin");
const adminDashboard = document.getElementById("adminDashboard");

function openAdmin() {
  if (adminModal) {
    adminModal.classList.add("show");
  }
}

function closeAdmin() {
  if (adminModal) {
    adminModal.classList.remove("show");
  }
}

document.querySelectorAll(".admin-link").forEach(button => {
  button.addEventListener("click", openAdmin);
});

document.querySelectorAll(".modal-close").forEach(button => {
  button.addEventListener("click", closeAdmin);
});

if (adminModal) {
  adminModal.addEventListener("click", function (event) {
    if (event.target === adminModal) {
      closeAdmin();
    }
  });
}

/* ADMIN LOGIN */

const loginForm = document.getElementById("adminLoginForm");

if (loginForm) {
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const passwordInput = this.querySelector('input[type="password"]');
    const enteredPassword = passwordInput?.value || "";

    if (enteredPassword === ADMIN_PASSWORD) {
      if (adminLogin) adminLogin.style.display = "none";
      if (adminDashboard) adminDashboard.style.display = "block";

      passwordInput.value = "";
      renderDashboard();
    } else {
      alert("Incorrect password. Please try again.");
    }
  });
}

/* ADMIN LOGOUT */

const logoutButton = document.getElementById("adminLogout");

if (logoutButton) {
  logoutButton.addEventListener("click", function () {
    if (adminDashboard) adminDashboard.style.display = "none";
    if (adminLogin) adminLogin.style.display = "block";
  });
}

/* ADMIN DASHBOARD */

function renderDashboard() {
  const totalElement = document.getElementById("totalBookings");
  const pendingElement = document.getElementById("pendingBookings");
  const confirmedElement = document.getElementById("confirmedBookings");
  const listElement = document.getElementById("bookingList");

  const pending = bookings.filter(b => b.status === "Pending").length;
  const confirmed = bookings.filter(b => b.status === "Confirmed").length;

  if (totalElement) totalElement.textContent = bookings.length;
  if (pendingElement) pendingElement.textContent = pending;
  if (confirmedElement) confirmedElement.textContent = confirmed;

  if (!listElement) return;

  listElement.innerHTML = "";

  if (bookings.length === 0) {
    listElement.textContent = "No bookings received yet.";
    return;
  }

  [...bookings].reverse().forEach(booking => {
    const item = document.createElement("div");
    item.className = "booking-item";

    const heading = document.createElement("h4");
    heading.textContent = booking.name;
    item.appendChild(heading);

    const fields = [
      `Service: ${booking.service}`,
      `Phone: ${booking.phone}`,
      `Date: ${formatDate(booking.date)}`,
      `Time: ${booking.time || "Not specified"}`,
      `Location: ${booking.location || "Not specified"}`,
      `Budget: ${booking.budget || "Not specified"}`,
      `Details: ${booking.details || "None"}`,
      `Received: ${booking.createdAt}`,
      `Status: ${booking.status}`
    ];

    fields.forEach(field => {
      const p = document.createElement("p");
      p.textContent = field;
      item.appendChild(p);
    });

    const statusSelect = document.createElement("select");

    ["Pending", "Confirmed", "Completed", "Cancelled"].forEach(status => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;

      if (booking.status === status) {
        option.selected = true;
      }

      statusSelect.appendChild(option);
    });

    statusSelect.addEventListener("change", function () {
      updateBookingStatus(booking.id, this.value);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete Booking";

    deleteButton.addEventListener("click", function () {
      if (confirm("Are you sure you want to delete this booking?")) {
        deleteBooking(booking.id);
      }
    });

    item.appendChild(statusSelect);
    item.appendChild(deleteButton);
    listElement.appendChild(item);
  });
}

/* UPDATE BOOKING STATUS */

function updateBookingStatus(id, newStatus) {
  bookings = bookings.map(booking =>
    booking.id === id
      ? { ...booking, status: newStatus }
      : booking
  );

  saveBookings();
  renderDashboard();
}

/* DELETE BOOKING */

function deleteBooking(id) {
  bookings = bookings.filter(booking => booking.id !== id);

  saveBookings();
  renderDashboard();
}

/* NAVIGATION */

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", function (event) {
    const target = document.querySelector(this.getAttribute("href"));

    if (target) {
      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth"
      });
    }
  });
});

/* INITIALIZE */

console.log("GURI VISUALS website loaded successfully.");
console.log("WhatsApp booking number configured.");

