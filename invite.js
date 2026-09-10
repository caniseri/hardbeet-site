/* No account, invitation, or clipboard data is stored or sent by this page. */
const HardBeetInvitation = (() => {
  const options = [
    ["nl", "Nederlands"], ["en", "English"], ["fil", "Filipino"], ["fr", "Français"],
    ["de", "Deutsch"], ["hi", "हिन्दी"], ["id", "Bahasa Indonesia"], ["ko", "한국어"],
    ["zh-Hans", "简体中文"], ["es", "Español"], ["th", "ไทย"], ["tr", "Türkçe"],
    ["ur", "اردو"], ["vi", "Tiếng Việt"]
  ];
  function resolveLanguage(tags) {
    for (const tag of tags) {
      const normalized = String(tag).toLowerCase().replace(/_/g, "-");
      if (/^zh($|-hans($|-)|-(cn|sg)($|-))/.test(normalized)) return "zh-Hans";
      const base = normalized.split("-")[0];
      if (base === "tl") return "fil";
      if (options.some(([code]) => code === base)) return base;
    }
    return "en";
  }
  function readToken(search) {
    const raw = (new URLSearchParams(search).get("token") || "").trim().toUpperCase();
    return /^[A-Z0-9]{6,10}$/.test(raw) ? raw : null;
  }
  function mount(doc, browser, copy) {
    const token = readToken(browser.location.search);
    let language = resolveLanguage(browser.navigator.languages || [browser.navigator.language || "en"]);
    try {
      const stored = browser.localStorage.getItem("hardbeet-invitation-language");
      if (options.some(([code]) => code === stored)) language = stored;
    } catch { /* Storage is optional. */ }
    const select = doc.getElementById("language");
    for (const [value, label] of options) {
      const option = doc.createElement("option");
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    }
    const open = doc.getElementById("open");
    const copyButton = doc.getElementById("copy");
    const status = doc.getElementById("status");
    function render() {
      const text = copy[language];
      doc.documentElement.lang = language;
      doc.documentElement.dir = language === "ur" ? "rtl" : "ltr";
      doc.title = `${text.title} | HardBeet`;
      select.value = language;
      for (const document of ["privacy", "terms", "delete-account"]) {
        const link = doc.getElementById(`legal-${document}`);
        if (link) link.href = language === "en" ? `./${document}.html` : `./legal/${language}/${document}.html`;
      }
      for (const element of doc.querySelectorAll("[data-copy]")) element.textContent = text[element.dataset.copy];
      doc.getElementById("code").textContent = token || "------";
      copyButton.disabled = !token;
      if (token) {
        open.href = `hardbeet://invite?token=${encodeURIComponent(token)}`;
        open.removeAttribute("aria-disabled");
        open.tabIndex = 0;
      } else {
        open.removeAttribute("href");
        open.setAttribute("aria-disabled", "true");
        open.tabIndex = -1;
      }
      status.textContent = token ? "" : text.invalid;
    }
    select.addEventListener("change", () => {
      language = select.value;
      try { browser.localStorage.setItem("hardbeet-invitation-language", language); } catch { /* Optional. */ }
      render();
    });
    copyButton.addEventListener("click", async () => {
      if (!token) return;
      try {
        await browser.navigator.clipboard.writeText(token);
        status.textContent = copy[language].copied;
      } catch {
        status.textContent = copy[language].copyFailed;
      }
    });
    render();
  }
  return { options, resolveLanguage, readToken, mount };
})();
if (typeof module !== "undefined") module.exports = HardBeetInvitation;
if (typeof document !== "undefined") HardBeetInvitation.mount(document, window, HardBeetInviteCopy);
