const burgerIcon = document.getElementById("menu-btn");
const menu = document.getElementById("menu");
const closeBtn = document.getElementById("close-btn");

burgerIcon.addEventListener("click", () => {
  menu.classList.toggle("hidden");
  burgerIcon.classList.toggle("hidden");
});

closeBtn.addEventListener("click", () => {
  menu.classList.toggle("hidden");
  burgerIcon.classList.toggle("hidden");
});
