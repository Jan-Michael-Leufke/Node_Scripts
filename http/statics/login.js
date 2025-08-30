document.getElementById("login-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData);

  fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(data),
  })
    .then(async (response) => {
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Login failed");
      }
      return result;
    })
    .then(() => {
      console.log("login success");
      checkLoginStatus();
      window.location.href = "/posts";
    })
    .catch((error) => {
      const loginErrorDiv = document.getElementById("login-error");
      loginErrorDiv.textContent = error.message;
      loginErrorDiv.style.display = "block";
      setTimeout(() => {
        loginErrorDiv.style.display = "none";
      }, 3000);
    });
});
