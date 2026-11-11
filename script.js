
// ========================================
// GURI VISUALS — SUPABASE CONFIGURATION
// ========================================

const SUPABASE_URL = "https://fjiqogmrqtmlpiowbfmk.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_Vhoxj6fA7yTJ8AGxekk-mg_-J7nU0Ud";

const WHATSAPP_NUMBER = "916239750615";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// ========================================
// HELPER FUNCTIONS
// ========================================

const getElement = (id) => document.getElementById(id);

function showMessage(message) {
  alert(message);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function getFormValue(form, name) {
  return form.elements.namedItem(name)?.value?.trim() || "";
}

// ========================================
// BOOKING FORM — SAVE TO SUPABASE
// ========================================

const bookingForm = getElement("bookingForm");

if (bookingForm) {
  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = bookingForm.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
    }

    const booking = {
      customer_name: getFormValue(bookingForm, "name"),
      whatsapp: getFormValue(bookingForm, "phone"),
      service: getFormValue(bookingForm, "service"),
      booking_date: getFormValue(bookingForm, "date") || null,
      booking_time: getFormValue(bookingForm, "time"),
      location: getFormValue(bookingForm, "location"),
      budget: getFormValue(bookingForm, "budget"),
      details: getFormValue(bookingForm, "details"),
      status: "Pending"
    };

    try {
      if (
        !booking.customer_name ||
        !booking.whatsapp ||
        !booking.service
      ) {
        throw new Error("Please fill in all required fields.");
      }

      const { error } = await supabaseClient
        .from("bookings")
        .insert([booking]);

      if (error) throw error;

      const message = `
Hello GURI VISUALS!

New Booking Request

Name: ${booking.customer_name}
WhatsApp: ${booking.whatsapp}
Service: ${booking.service}
Date: ${booking.booking_date || "Not specified"}
Time: ${booking.booking_time || "Not specified"}
Location: ${booking.location || "Not specified"}
Budget: ${booking.budget || "Not specified"}

Details: ${booking.details || "No additional details"}

Booking Status: Pending
      `;

      bookingForm.reset();

      showMessage(
        "Booking submitted successfully! Opening WhatsApp..."
      );

      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
        "_blank"
      );

    } catch (error) {
      console.error("Booking error:", error);
      showMessage(
        "Booking could not be submitted: " + error.message
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Booking";
      }
    }
  });
}

// ========================================
// CHOOSE SERVICE BUTTONS
// ========================================

document.querySelectorAll(".choose-service").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".service-card");
    const serviceName = card?.querySelector("h3")?.textContent?.trim();

    const serviceInput = bookingForm?.elements.namedItem("service");

    if (serviceInput && serviceName) {
      serviceInput.value = serviceName;
      getElement("booking")?.scrollIntoView({
        behavior: "smooth"
      });
    }
  });
});

// ========================================
// ADMIN MODAL
// ========================================

const adminModal = getElement("adminModal");
const adminLogin = getElement("adminLogin");
const adminDashboard = getElement("adminDashboard");
const adminLoginForm = getElement("adminLoginForm");

document.querySelectorAll(".admin-link").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();

    if (adminModal) {
      adminModal.style.display = "flex";
    }
  });
});

document.querySelectorAll(".modal-close").forEach((button) => {
  button.addEventListener("click", () => {
    if (adminModal) adminModal.style.display = "none";
  });
});

// Add email field to the existing login form if missing.
if (adminLoginForm) {
  let emailInput = adminLoginForm.querySelector(
    'input[name="email"]'
  );

  if (!emailInput) {
    emailInput = document.createElement("input");
    emailInput.type = "email";
    emailInput.name = "email";
    emailInput.placeholder = "Admin email address";
    emailInput.required = true;
    emailInput.autocomplete = "username";

    adminLoginForm.prepend(emailInput);
  }

  const passwordInput = adminLoginForm.querySelector(
    'input[type="password"]'
  );

  if (passwordInput) {
    passwordInput.autocomplete = "current-password";
  }
}

// ========================================
// ADMIN LOGIN — SUPABASE AUTH
// ========================================

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = adminLoginForm.elements.namedItem("email")?.value.trim();
    const password = adminLoginForm.querySelector(
      'input[type="password"]'
    )?.value;

    if (!email || !password) {
      showMessage("Enter your admin email and password.");
      return;
    }

    const loginButton = adminLoginForm.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    if (loginButton) {
      loginButton.disabled = true;
    }

    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (adminLogin) adminLogin.style.display = "none";
      if (adminDashboard) adminDashboard.style.display = "block";

      await loadBookings();

    } catch (error) {
      console.error("Admin login error:", error);
      showMessage("Login failed: " + error.message);
    } finally {
      if (loginButton) {
        loginButton.disabled = false;
      }
    }
  });
}

// ========================================
// LOAD BOOKINGS FROM DATABASE
// ========================================

async function loadBookings() {
  const bookingList = getElement("bookingList");

  if (bookingList) {
    bookingList.innerHTML = "<p>Loading bookings...</p>";
  }

  try {
    const { data, error } = await supabaseClient
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const bookings = data || [];

    updateCounters(bookings);
    renderBookings(bookings);

  } catch (error) {
    console.error("Loading bookings error:", error);

    if (bookingList) {
      bookingList.innerHTML =
        `<p>Could not load bookings: ${escapeHTML(error.message)}</p>`;
    }
  }
}

// ========================================
// DASHBOARD COUNTERS
// ========================================

function updateCounters(bookings) {
  const total = bookings.length;

  const pending = bookings.filter(
    (booking) => booking.status === "Pending"
  ).length;

  const confirmed = bookings.filter(
    (booking) => booking.status === "Confirmed"
  ).length;

  if (getElement("totalBookings")) {
    getElement("totalBookings").textContent = total;
  }

  if (getElement("pendingBookings")) {
    getElement("pendingBookings").textContent = pending;
  }

  if (getElement("confirmedBookings")) {
    getElement("confirmedBookings").textContent = confirmed;
  }
}

// ========================================
// DISPLAY BOOKINGS
// ========================================

function renderBookings(bookings) {
  const bookingList = getElement("bookingList");

  if (!bookingList) return;

  if (!bookings.length) {
    bookingList.innerHTML = "<p>No bookings received yet.</p>";
    return;
  }

  bookingList.innerHTML = bookings.map((booking) => `
    <div class="booking-item" data-id="${Number(booking.id)}">

      <h3>${escapeHTML(booking.customer_name)}</h3>

      <p><strong>WhatsApp:</strong>
        ${escapeHTML(booking.whatsapp)}</p>

      <p><strong>Service:</strong>
        ${escapeHTML(booking.service)}</p>

      <p><strong>Date:</strong>
        ${escapeHTML(booking.booking_date || "Not specified")}</p>

      <p><strong>Time:</strong>
        ${escapeHTML(booking.booking_time || "Not specified")}</p>

      <p><strong>Location:</strong>
        ${escapeHTML(booking.location || "Not specified")}</p>

      <p><strong>Budget:</strong>
        ${escapeHTML(booking.budget || "Not specified")}</p>

      <p><strong>Details:</strong>
        ${escapeHTML(booking.details || "None")}</p>

      <p><strong>Status:</strong>
        ${escapeHTML(booking.status)}</p>

      <select class="booking-status">
        <option value="Pending"
          ${booking.status === "Pending" ? "selected" : ""}>
          Pending
        </option>

        <option value="Confirmed"
          ${booking.status === "Confirmed" ? "selected" : ""}>
          Confirmed
        </option>

        <option value="Completed"
          ${booking.status === "Completed" ? "selected" : ""}>
          Completed
        </option>

        <option value="Cancelled"
          ${booking.status === "Cancelled" ? "selected" : ""}>
          Cancelled
        </option>
      </select>

      <button type="button" class="update-booking">
        Update Status
      </button>

      <button type="button" class="delete-booking">
        Delete Booking
      </button>

    </div>
  `).join("");

  // Update status
  bookingList.querySelectorAll(".update-booking").forEach((button) => {
    button.addEventListener("click", async () => {
      const item = button.closest(".booking-item");
      const id = Number(item.dataset.id);
      const status = item.querySelector(".booking-status").value;

      const { error } = await supabaseClient
        .from("bookings")
        .update({ status })
        .eq("id", id);

      if (error) {
        showMessage("Status update failed: " + error.message);
        return;
      }

      showMessage("Booking status updated!");
      await loadBookings();
    });
  });

  // Delete booking
  bookingList.querySelectorAll(".delete-booking").forEach((button) => {
    button.addEventListener("click", async () => {
      const item = button.closest(".booking-item");
      const id = Number(item.dataset.id);

      if (!confirm("Are you sure you want to delete this booking?")) {
        return;
      }

      const { error } = await supabaseClient
        .from("bookings")
        .delete()
        .eq("id", id);

      if (error) {
        showMessage("Delete failed: " + error.message);
        return;
      }

      showMessage("Booking deleted successfully!");
      await loadBookings();
    });
  });
}

// ========================================
// ADMIN LOGOUT
// ========================================

const adminLogout = getElement("adminLogout");

if (adminLogout) {
  adminLogout.addEventListener("click", async () => {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      showMessage("Logout failed: " + error.message);
      return;
    }

    if (adminDashboard) adminDashboard.style.display = "none";
    if (adminLogin) adminLogin.style.display = "block";

    if (adminModal) adminModal.style.display = "none";

    adminLoginForm?.reset();

    showMessage("Admin logged out successfully.");
  });
}

// ========================================
// RESTORE ADMIN SESSION
// ========================================

async function checkAdminSession() {
  const { data } = await supabaseClient.auth.getSession();

  if (data.session) {
    if (adminLogin) adminLogin.style.display = "none";
    if (adminDashboard) adminDashboard.style.display = "block";

    if (adminModal) adminModal.style.display = "flex";

    await loadBookings();
  }
}

checkAdminSession();

console.log("GURI VISUALS — Supabase connected.");


