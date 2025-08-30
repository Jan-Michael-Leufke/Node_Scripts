function checkLoginStatus() {
  return fetch("api/auth/status")
    .then((response) => response.json())
    .then((data) => {
      updateUiBasedOnAuth(data.isLoggedIn);
      document.dispatchEvent(
        new CustomEvent("authStatusChange", {
          detail: { isLoggedIn: data.isLoggedIn, user: data.user || null },
        })
      );
      return { isLoggedIn: data.isLoggedIn, user: data.user || null };
    })
    .catch((error) => {
      console.error("Error fetching auth status:", error);
      document.dispatchEvent(
        new CustomEvent("authStatusChange", {
          detail: { isLoggedIn: false, user: null },
        })
      );
      return { isLoggedIn: false, user: null };
    });
}

function updateUiBasedOnAuth(isLoggedIn) {
  document.getElementById("login-link").style.display = isLoggedIn
    ? "none"
    : "";
  document.getElementById("logout-link").style.display = isLoggedIn
    ? ""
    : "none";
}
