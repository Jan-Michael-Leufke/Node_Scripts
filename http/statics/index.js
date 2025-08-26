fetch("https://baconipsum.com/api/?type=all-meat&paras=2")
  .then((response) => response.json())
  .then((data) => {
    data.forEach((paragraph) => {
      const para = document.createElement("p");
      para.textContent = paragraph;
      document.body.appendChild(para);
    });
  })
  .catch((error) => {
    console.error("Error fetching lorem ipsum text:", error);
  });
