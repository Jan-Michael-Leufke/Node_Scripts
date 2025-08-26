fetch("/prefectures.json")
  .then((response) => response.json())
  .then((data) => {
    const list = document.getElementById("prefectures-list");
    data.prefectures.forEach((prefecture) => {
      const outerPrefDiv = document.createElement("div");

      const nameDiv = document.createElement("div");
      nameDiv.classList.add("prefecture-name");
      nameDiv.innerHTML = `<strong>${prefecture.name_en}</strong> (${prefecture.name_jp})`;
      outerPrefDiv.appendChild(nameDiv);

      const regionDiv = document.createElement("div");
      regionDiv.classList.add("prefecture-region");
      regionDiv.innerHTML = `Region: ${prefecture.region}`;
      outerPrefDiv.appendChild(regionDiv);

      const capitalDiv = document.createElement("div");
      capitalDiv.classList.add("prefecture-capital");
      capitalDiv.innerHTML = `Capital: ${prefecture.capital}`;
      outerPrefDiv.appendChild(capitalDiv);

      const populationDiv = document.createElement("div");
      populationDiv.classList.add("prefecture-population");
      populationDiv.innerHTML = `Population: ${prefecture.population_millions} million`;
      outerPrefDiv.appendChild(populationDiv);

      outerPrefDiv.classList.add("prefecture-card");
      list.appendChild(outerPrefDiv);
    });
  });
