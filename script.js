const form = document.getElementById("generator-form");
const rolesInput = document.getElementById("unauthorized-roles");
const tabInput = document.getElementById("tab-name");
const authorizedInput = document.getElementById("authorized-role");
const emptyState = document.getElementById("empty-state");
const resultArea = document.getElementById("result-area");
const output = document.getElementById("generated-output");
const roleCount = document.getElementById("role-count");
const copyButton = document.getElementById("copy-button");
const copyFeedback = document.getElementById("copy-feedback");
const resetButton = document.getElementById("reset-button");

function formatRoleList(roles) {
  if (roles.length === 1) return roles[0];
  if (roles.length === 2) return `${roles[0]} and ${roles[1]}`;
  return `${roles.slice(0, -1).join(", ")}, and ${roles[roles.length - 1]}`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function buildReport(roles, tab, authorizedRole) {
  const safeRoles = roles.map(escapeHtml);
  const safeTab = escapeHtml(tab);
  const safeAuthorized = escapeHtml(authorizedRole);
  const roleList = formatRoleList(safeRoles);

  return [
    `Verified that the <strong>${roleList}</strong> roles do not have access to the <strong>${safeTab}</strong> tab.`,
    `To validate the access restrictions, we first submitted the <strong>${safeTab}</strong> tab using the <strong>${safeAuthorized}</strong> role, which has the required permission to submit the <strong>${safeTab}</strong> tab successfully.`,
    `We then attempted to submit the same POST request using <strong>${roleList}</strong>. All attempts were unsuccessful, confirming that these roles do not have the required permissions to submit the <strong>${safeTab}</strong> tab.`
  ];
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const roles = rolesInput.value
    .split(/\r?\n/)
    .map((role) => role.trim())
    .filter(Boolean);
  const tab = tabInput.value.trim();
  const authorizedRole = authorizedInput.value.trim();

  if (roles.length === 0 || !tab || !authorizedRole) {
    return;
  }

  const paragraphs = buildReport(roles, tab, authorizedRole);
  output.innerHTML = paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("");
  roleCount.textContent = `${roles.length} unauthorized role${roles.length === 1 ? "" : "s"}`;

  emptyState.hidden = true;
  resultArea.hidden = false;
  copyFeedback.textContent = "";
});

copyButton.addEventListener("click", async () => {
  const html = output.innerHTML;
  const plainText = output.innerText;

  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plainText], { type: "text/plain" })
      });
      await navigator.clipboard.write([item]);
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(plainText);
    } else {
      const range = document.createRange();
      range.selectNodeContents(output);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      const successful = document.execCommand("copy");
      selection.removeAllRanges();
      if (!successful) throw new Error("Copy command was not successful");
    }
    copyFeedback.textContent = "Report copied. You can now paste it into your document.";
  } catch (error) {
    copyFeedback.textContent = "Copy was blocked by the browser. Select the report text and copy it manually.";
  }
});

resetButton.addEventListener("click", () => {
  form.reset();
  output.innerHTML = "";
  resultArea.hidden = true;
  emptyState.hidden = false;
  copyFeedback.textContent = "";
  rolesInput.focus();
});
