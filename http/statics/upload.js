checkLoginStatus();

const uploadStatus = document.getElementById("upload-status");
const statusMessage = document.getElementById("status-message");

document
  .getElementById("upload-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const fileInput = document.getElementById("file-input");
    const file = fileInput.files[0];
    if (!file) return;

    fetch("/upload", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/octet-stream",
        filename: file.name,
      },
      body: file,
    })
      .then((response) => {
        if (response.ok) {
          response.json().then((message) => {
            console.log(message);
            setUploadingStatus(message);
            setTimeout(() => {
              resetUploadStatus();
            }, 3000);
          });
        } else {
          console.error("Error uploading file");
          setUploadingStatus("Error uploading file", "red");
          setTimeout(() => {
            resetUploadStatus();
          }, 3000);
        }
      })
      .catch((error) => {
        console.error("Error uploading file:", error);
        setUploadingStatus("Error uploading file", "red");
        setTimeout(() => {
          resetUploadStatus();
        }, 3000);
      });
  });

function setUploadingStatus(message, color) {
  statusMessage.textContent = message;
  statusMessage.style.color = color || "lightgreen";
  statusMessage.classList.add("visible");
}

function resetUploadStatus() {
  statusMessage.textContent = "";
  statusMessage.classList.remove("visible");
}
