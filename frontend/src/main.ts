const usernameModal = document.getElementById(
  "username-modal",
) as HTMLDivElement;
const usernameField = document.getElementById("username") as HTMLInputElement;
const usernameButton = document.getElementById(
  "submit-username",
) as HTMLButtonElement;

const homepage = document.getElementById("homepage") as HTMLDivElement;

if (localStorage.getItem("username")) {
  usernameModal.hidden = true;
  homepage.hidden = false;
} else {
  usernameModal.hidden = false;

  usernameButton.addEventListener("click", () => {
    const username = usernameField.value;
    if (username && username.length >= 3 && username.length <= 16) {
      localStorage.setItem("username", JSON.stringify(username));
      usernameField.value = "";
      usernameModal.hidden = true;
      homepage.hidden = false;
    }
  });
}
