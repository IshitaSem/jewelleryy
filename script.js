// SCROLL
function scrollToSection(selector) {
  const element = document.querySelector(selector);
  if (element) { element.scrollIntoView({ behavior: 'smooth' }); }
}

// POPUP FUNCTION
const popup = document.getElementById("popup");
const popupImg = document.getElementById("popup-img");
const popupName = document.getElementById("popup-name");
const popupPrice = document.getElementById("popup-price");

document.querySelectorAll(".open-popup").forEach(item => {
  item.addEventListener("click", () => {
    const imgSrc = item.querySelector("img").src;
    const name = item.querySelector("h3").innerText;
    const price = item.querySelector("p").innerText;

    popupImg.src = imgSrc;
    popupName.innerText = name;
    popupPrice.innerText = price;

    popup.style.display = "flex";
  });
});

function closePopup(){
  popup.style.display = "none";
}
