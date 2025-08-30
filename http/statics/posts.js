let currentUser;

checkLoginStatus().then(({ isLoggedIn, user }) => {
  if (!isLoggedIn) return;

  currentUser = user;

  const createPostBtn = document.getElementById("create-post-btn");
  createPostBtn.style.display = "block";

  createPostBtn.addEventListener("click", () => {
    const savePostBtn = document.getElementById("save-post-btn");
    const cancelPostBtn = document.getElementById("cancel-post-btn");
    const postFormSection = document.getElementById("post-form-section");
    const postForm = document.getElementById("post-form");

    savePostBtn.addEventListener("click", () => {
      console.log("save btn clicked");
    });

    postForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const postData = Object.fromEntries(new FormData(postForm));

      fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      })
        .then((res) => res.json())
        .then((data) => {
          const postsContainer = document.getElementById("posts-list");
          postsContainer.appendChild(createPost(data));
          postFormSection.style.display = "none";
        })
        .catch((error) => {
          console.error("Error creating post:", error);
        });
    });

    cancelPostBtn.addEventListener("click", () => {
      postFormSection.style.display = "none";
    });

    postFormSection.style.display = "block";
  });
});

fetch("/api/posts")
  .then((response) => response.json())
  .then((data) => {
    const postsContainer = document.getElementById("posts-list");
    data.forEach((post) => {
      postsContainer.appendChild(createPost(post));
    });
  });

function createPost(post) {
  const postElement = document.createElement("div");
  postElement.classList.add("post-card");
  postElement.innerHTML = `
        <div class="post-card-title">${post.title}</div>
        <div class="post-card-content">${post.content}</div>
        <div class="post-card-author">by ${post.author}</div>
      `;
  return postElement;
}
