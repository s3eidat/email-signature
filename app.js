/* Email Signature — the signature is built locally from escaped values. The hosted logo URL is only ever
   written into the copied HTML; this page never puts it in an <img> it renders (and the CSP would block it). */
(function () {
  "use strict";
  var $ = S3.$, $$ = S3.$$, esc = S3.esc;
  var KEY = "sig.v1";
  var HTTPS = "https:" + "//";
  var TEXT = ["name", "title", "company", "phone", "email", "website", "address", "note", "linkedin", "x", "instagram", "facebook", "github", "youtube", "logoUrl"];
  var SOCIAL = [["linkedin", "LinkedIn"], ["x", "X"], ["instagram", "Instagram"], ["facebook", "Facebook"], ["github", "GitHub"], ["youtube", "YouTube"]];
  var FONTS = ["Arial, Helvetica, sans-serif", "Verdana, Geneva, sans-serif", "Tahoma, Geneva, sans-serif", "Georgia, 'Times New Roman', serif", "'Trebuchet MS', Helvetica, sans-serif"];
  var state = { tpl: "classic", localLogo: "", app: "gmail" };

  // ---------- safe values ----------
  function clean(s) { return String(s == null ? "" : s).replace(/[\u0000-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim(); }
  // Only http(s) links; anything else (javascript:, data:, vbscript:…) is dropped.
  function webUrl(u) {
    u = clean(u);
    if (!u) return "";
    if (/^\/\//.test(u)) u = "https:" + u;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = HTTPS + u;
    if (!/^https?:\/\/[^\s/?#]+\.[^\s/?#]+/i.test(u)) return "";
    return u;
  }
  function showUrl(u) { return u.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, ""); }
  function emailOk(e) { return /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(e); }
  function telHref(p) { var d = p.replace(/(?!^\+)[^\d]/g, ""); return d.replace(/\D/g, "").length >= 5 ? "tel:" + d : ""; }
  function color(c) { return /^#[0-9a-f]{6}$/i.test(c || "") ? c.toLowerCase() : "#0e9f9a"; }
  function inkOn(hex) { // readable text colour on an accent background
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function lin(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    var L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return L > 0.4 ? "#111111" : "#ffffff";
  }

  function read() {
    var d = {};
    TEXT.forEach(function (k) { d[k] = $("#" + k).value; });
    d.accent = $("#accent").value; d.font = $("#font").value; d.logoW = +$("#logoW").value; d.tpl = state.tpl;
    return d;
  }

  // ---------- builder ----------
  // mode "copy": logo = hosted URL (validated https). mode "preview": logo = the local file only.
  function build(d, mode) {
    var A = color(d.accent), F = FONTS.indexOf(d.font) >= 0 ? d.font : FONTS[0];
    var W = Math.max(40, Math.min(200, Math.round(+d.logoW || 80)));
    var name = esc(clean(d.name)), title = esc(clean(d.title)), company = esc(clean(d.company));
    var phone = clean(d.phone), email = clean(d.email), site = webUrl(d.website), addr = esc(clean(d.address)), note = esc(clean(d.note));
    var logo = "";
    if (mode === "copy") { var lu = webUrl(d.logoUrl); if (lu && /^https:/i.test(lu)) logo = lu; }
    else if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,/i.test(state.localLogo || "")) logo = state.localLogo;
    var img = logo ? '<img src="' + esc(logo) + '" width="' + W + '" alt="' + (company || name || "Logo") + '" style="display:block;border:0;width:' + W + 'px;max-width:' + W + 'px;height:auto">' : "";
    var link = 'style="color:' + A + ';text-decoration:none"';
    var muted = "color:#5f6670";

    var contacts = [];
    if (phone) { var th = telHref(phone); contacts.push(th ? '<a href="' + esc(th) + '" style="color:#333333;text-decoration:none">' + esc(phone) + "</a>" : esc(phone)); }
    if (email) contacts.push(emailOk(email) ? '<a href="mailto:' + esc(email) + '" ' + link + ">" + esc(email) + "</a>" : esc(email));
    if (site) contacts.push('<a href="' + esc(site) + '" ' + link + ">" + esc(showUrl(site)) + "</a>");
    var socials = SOCIAL.map(function (s) { var u = webUrl(d[s[0]]); return u ? '<a href="' + esc(u) + '" ' + link + ">" + s[1] + "</a>" : ""; }).filter(Boolean);
    var role = [title, company].filter(Boolean).join(" | ");
    var nameHtml = name ? '<span style="font-size:17px;font-weight:700;color:#111111">' + name + "</span>" : "";
    var socialHtml = socials.length ? socials.join(' <span style="color:#b5bac1">&middot;</span> ') : "";
    var base = "font-family:" + F + ";font-size:13px;line-height:1.5;color:#333333";
    var T = '<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;' + base + '">';
    var html;

    if (d.tpl === "modern") {
      var rows = [];
      if (img) rows.push('<tr><td style="padding:0 0 10px">' + img + "</td></tr>");
      if (name) rows.push('<tr><td style="font-size:19px;font-weight:700;color:' + A + '">' + name + "</td></tr>");
      if (role) rows.push('<tr><td style="' + muted + ';padding:0 0 8px">' + role + "</td></tr>");
      rows.push('<tr><td style="border-top:2px solid ' + A + ';padding:8px 0 0;font-size:0;line-height:0">&nbsp;</td></tr>');
      var lines = [];
      if (phone) lines.push('<b style="color:' + A + '">P</b>&nbsp; ' + contacts[0]);
      if (email) lines.push('<b style="color:' + A + '">E</b>&nbsp; ' + contacts[phone ? 1 : 0]);
      if (site) lines.push('<b style="color:' + A + '">W</b>&nbsp; ' + contacts[contacts.length - 1]);
      if (addr) lines.push('<b style="color:' + A + '">A</b>&nbsp; <span style="' + muted + '">' + addr + "</span>");
      lines.forEach(function (l) { rows.push("<tr><td>" + l + "</td></tr>"); });
      if (socialHtml) rows.push('<tr><td style="padding:8px 0 0">' + socialHtml + "</td></tr>");
      if (note) rows.push('<tr><td style="padding:8px 0 0;font-size:12px;' + muted + '">' + note + "</td></tr>");
      html = T + rows.join("") + "</table>";
    } else if (d.tpl === "compact") {
      var l1 = [nameHtml ? '<b style="color:#111111">' + name + "</b>" : "", role ? '<span style="' + muted + '">' + role + "</span>" : ""].filter(Boolean).join(' <span style="color:' + A + '">|</span> ');
      var l2 = contacts.concat(socials).join(' <span style="color:#b5bac1">&middot;</span> ');
      html = T + "<tr>" + (img ? '<td style="padding:0 10px 0 0;vertical-align:middle">' + img + "</td>" : "") +
        '<td style="vertical-align:middle">' + (l1 ? l1 + "<br>" : "") + l2 + (addr ? '<br><span style="font-size:12px;' + muted + '">' + addr + "</span>" : "") +
        (note ? '<br><span style="font-size:12px;' + muted + '">' + note + "</span>" : "") + "</td></tr></table>";
    } else if (d.tpl === "banner") {
      var ink = inkOn(A);
      var head = (name ? '<span style="font-size:18px;font-weight:700;color:' + ink + '">' + name + "</span>" : "") +
        (role ? (name ? "<br>" : "") + '<span style="color:' + ink + ';opacity:.85">' + role + "</span>" : "");
      html = T + "<tr>" + (img ? '<td rowspan="2" style="padding:0 14px 0 0;vertical-align:top">' + img + "</td>" : "") +
        '<td style="background:' + A + ";padding:10px 14px;border-radius:6px;color:" + ink + '">' + (head || "&nbsp;") + "</td></tr>" +
        '<tr><td style="padding:8px 2px 0">' + contacts.join(' <span style="color:#b5bac1">&middot;</span> ') +
        (addr ? '<br><span style="' + muted + '">' + addr + "</span>" : "") + (socialHtml ? "<br>" + socialHtml : "") +
        (note ? '<br><span style="font-size:12px;' + muted + '">' + note + "</span>" : "") + "</td></tr></table>";
    } else { // classic
      var parts = [];
      if (nameHtml) parts.push(nameHtml);
      if (role) parts.push('<span style="' + muted + '">' + role + "</span>");
      if (contacts.length) parts.push(contacts.join(' <span style="color:#b5bac1">&middot;</span> '));
      if (addr) parts.push('<span style="' + muted + '">' + addr + "</span>");
      if (socialHtml) parts.push(socialHtml);
      if (note) parts.push('<span style="font-size:12px;' + muted + '">' + note + "</span>");
      html = T + "<tr>" + (img ? '<td style="padding:0 14px 0 0;vertical-align:top">' + img + "</td>" : "") +
        '<td style="border-left:3px solid ' + A + ';padding:0 0 0 12px;vertical-align:top">' + parts.join("<br>") + "</td></tr></table>";
    }
    return html;
  }

  function plainText(d) {
    var lines = [clean(d.name), [clean(d.title), clean(d.company)].filter(Boolean).join(" | "), clean(d.phone), clean(d.email),
      webUrl(d.website) ? showUrl(webUrl(d.website)) : "", clean(d.address)];
    SOCIAL.forEach(function (s) { var u = webUrl(d[s[0]]); if (u) lines.push(s[1] + ": " + showUrl(u)); });
    lines.push(clean(d.note));
    return lines.filter(Boolean).join("\n");
  }

  // ---------- clipboard ----------
  function copyHtml(html, text) {
    if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write && window.isSecureContext) {
      return navigator.clipboard.write([new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" })
      })]).then(function () { S3.toast("Signature copied ✓ Paste it into your email app"); }, function () { viaEvent(html, text); });
    }
    viaEvent(html, text);
  }
  // Fallback that copies rich HTML without rendering it (so the hosted logo is never loaded here).
  function viaEvent(html, text) {
    function onCopy(e) { e.clipboardData.setData("text/html", html); e.clipboardData.setData("text/plain", text); e.preventDefault(); }
    document.addEventListener("copy", onCopy);
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.removeEventListener("copy", onCopy);
    if (ok) S3.toast("Signature copied ✓ Paste it into your email app"); else S3.toast("Copy failed. Use Copy HTML instead.", "error");
  }
  function htmlDoc(sig) {
    return "<!doctype html>\n<html><head><meta charset=\"utf-8\"><title>Email signature</title></head><body>\n" + sig + "\n</body></html>\n";
  }

  // ---------- render ----------
  var STEPS = {
    gmail: ["Click <b>Copy signature</b> above.", "In Gmail open <b>Settings</b> (gear) → <b>See all settings</b> → <b>General</b>.", "Under <b>Signature</b> click <b>Create new</b>, name it, then paste with <kbd>Ctrl</kbd>+<kbd>V</kbd> (<kbd>⌘</kbd>+<kbd>V</kbd> on Mac).", "Scroll to the bottom and click <b>Save changes</b>."],
    outlook: ["Click <b>Copy signature</b> above.", "New Outlook and Outlook on the web: <b>Settings</b> → <b>Account</b> → <b>Signatures</b> → <b>New signature</b>.", "Classic Outlook for Windows: <b>File</b> → <b>Options</b> → <b>Mail</b> → <b>Signatures…</b> → <b>New</b>.", "Paste into the editor, choose it as the default for new messages, and <b>Save</b>."],
    apple: ["Click <b>Copy signature</b> above.", "In Mail open <b>Mail</b> → <b>Settings</b> → <b>Signatures</b> and click <b>+</b>.", "Untick <b>Always match my default message font</b>, then paste into the right-hand box.", "Images only show if you used a hosted logo URL."],
    thunderbird: ["Click <b>Copy HTML</b> above.", "Open <b>Account Settings</b> and select your account.", "Tick <b>Use HTML</b> next to Signature text.", "Paste the HTML into the signature box and close the tab."]
  };
  function renderSteps() {
    var ol = $("#steps"); ol.textContent = "";
    STEPS[state.app].forEach(function (s) { ol.appendChild(S3.h("li", { html: s })); }); // fixed strings, no user input
  }

  function render() {
    var d = read();
    save(d);
    var empty = !TEXT.some(function (k) { return k !== "logoUrl" && clean(d[k]); });
    var pv = $("#preview");
    if (empty) pv.innerHTML = '<div class="es-empty">Your signature appears here as you type.</div>';
    else pv.innerHTML = build(d, "preview"); // every user value inside is escaped by build()
    var lu = clean(d.logoUrl), note = $("#logoNote");
    if (lu && !webUrl(lu)) { note.hidden = false; note.textContent = "The logo URL doesn't look like a web address, so it is left out."; }
    else if (lu && !/^https:/i.test(webUrl(lu))) { note.hidden = false; note.textContent = "Use an https:// logo address; many email apps block plain http images."; }
    else if (lu && !state.localLogo) { note.hidden = false; note.textContent = "Your hosted logo is included in the copied signature. Pick the same file under Logo to see it in this preview."; }
    else if (!lu && state.localLogo) { note.hidden = false; note.textContent = "The picked logo is only a preview. Add a hosted logo URL to include it in the copied signature."; }
    else note.hidden = true;
    $("#logoWv").textContent = d.logoW + " px";
  }

  var save = S3.debounce(function (d) { S3.store(KEY, d); }, 300);
  function seg(el, value, onPick) {
    $$("button", el).forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.v === value));
      b.addEventListener("click", function () {
        $$("button", el).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        onPick(b.dataset.v);
      });
    });
  }
  function fill(d) {
    TEXT.forEach(function (k) { $("#" + k).value = d[k] || ""; });
    $("#accent").value = color(d.accent);
    $("#font").value = FONTS.indexOf(d.font) >= 0 ? d.font : FONTS[0];
    $("#logoW").value = d.logoW || 80;
    state.tpl = ["classic", "modern", "compact", "banner"].indexOf(d.tpl) >= 0 ? d.tpl : "classic";
    $$("#tpl button").forEach(function (x) { x.setAttribute("aria-pressed", String(x.dataset.v === state.tpl)); });
  }

  $("#form").addEventListener("input", render);
  $("#accent").addEventListener("input", render);
  $("#font").addEventListener("change", render);
  seg($("#tpl"), state.tpl, function (v) { state.tpl = v; render(); });
  seg($("#app"), state.app, function (v) { state.app = v; renderSteps(); });
  $("#preview").addEventListener("click", function (e) { if (e.target.closest("a")) e.preventDefault(); });

  $("#pickLogo input").addEventListener("change", function (e) {
    var f = e.target.files[0]; e.target.value = "";
    if (!f) return;
    if (!/^image\//.test(f.type)) return S3.toast("Pick an image file", "error");
    if (f.size > 4 * 1024 * 1024) return S3.toast("That image is over 4 MB", "error");
    S3.readFile(f, "dataurl").then(function (url) { state.localLogo = url; $("#dropLogo").hidden = false; render(); });
  });
  $("#dropLogo").addEventListener("click", function () { state.localLogo = ""; $("#dropLogo").hidden = true; render(); });

  function need() { var d = read(); if (!clean(d.name) && !clean(d.email)) { S3.toast("Add at least your name or email", "error"); return null; } return d; }
  $("#copyRich").addEventListener("click", function () { var d = need(); if (!d) return; copyHtml(build(d, "copy"), plainText(d)); S3.done(); });
  $("#copyHtml").addEventListener("click", function () { var d = need(); if (!d) return; S3.copy(build(d, "copy"), "HTML copied"); S3.done(); });
  $("#saveHtml").addEventListener("click", function () { var d = need(); if (!d) return; S3.download(htmlDoc(build(d, "copy")), "email-signature.html", "text/html"); S3.done(); });
  $("#clear").addEventListener("click", function () { fill({ accent: $("#accent").value, tpl: state.tpl }); state.localLogo = ""; $("#dropLogo").hidden = true; render(); });

  var SAMPLE = { name: "Layla Haddad", title: "Product Designer", company: "Northwind Studio", phone: "+962 7 9000 0000", email: "layla@northwind.example",
    website: "northwind.example", address: "12 Rainbow St, Amman, Jordan", note: "", linkedin: "linkedin.com/in/laylahaddad", x: "", instagram: "instagram.com/northwind.studio",
    facebook: "", github: "github.com/laylahaddad", youtube: "", logoUrl: "", accent: "#0e9f9a", font: FONTS[0], logoW: 64 };
  $("#sample").addEventListener("click", function () { fill(Object.assign({}, SAMPLE, { tpl: state.tpl })); render(); });

  // A tiny generated logo (local canvas, no network) so the sample preview has an image.
  function demoLogo() {
    var c = document.createElement("canvas"); c.width = c.height = 128;
    var g = c.getContext("2d");
    g.fillStyle = "#0e9f9a"; g.beginPath(); g.arc(64, 64, 64, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#ffffff"; g.font = "bold 64px Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("N", 64, 68);
    return c.toDataURL("image/png");
  }

  fill(S3.store(KEY) || { tpl: "classic" });
  render(); renderSteps();

  window.S3_DEMO = function () {
    fill(Object.assign({}, SAMPLE, { tpl: "classic" }));
    state.localLogo = demoLogo(); $("#dropLogo").hidden = false; render();
  };

  // ---------- self-test: hostile values are escaped everywhere; the hosted logo never reaches the page ----------
  window.S3_SELFTEST = function () {
    var f = [];
    function ok(name, cond) { if (!cond) f.push(name); }
    var evil = {
      name: '<script>alert("x")</script> O\'Brien "Bob"', title: "<img src=x onerror=alert(1)>", company: "A&B <Co>",
      phone: '+1 "555" <b>', email: 'a"b@x.com"><script>', website: "javascript:alert(1)", address: "<svg onload=alert(1)>", note: "</td></table><script>",
      linkedin: 'linkedin.com/in/x" onmouseover="alert(1)', x: "data:text/html,<script>", instagram: "", facebook: "", github: "", youtube: "",
      logoUrl: "logo.example/l.png?a=\"><script>", accent: "red;background:url(x)", font: "x;}</style><script>", logoW: 80
    };
    var hosted = HTTPS + "logo.example/l.png";
    ["classic", "modern", "compact", "banner"].forEach(function (tpl) {
      var d = Object.assign({}, evil, { tpl: tpl });
      var copy = build(d, "copy"), prev = build(d, "preview");
      [copy, prev].forEach(function (h, i) {
        var where = tpl + (i ? " preview" : " copy");
        ok(where + ": no raw <script", !/<script/i.test(h));
        ok(where + ": no raw <img src=x", !/<img src=x/i.test(h));
        ok(where + ": no <svg", !/<svg/i.test(h));
        ok(where + ": no javascript:", !/javascript:/i.test(h));
        ok(where + ": no data:text", !/data:text/i.test(h));
        ok(where + ": quotes escaped", h.indexOf("O&#39;Brien &quot;Bob&quot;") >= 0);
        ok(where + ": name escaped", h.indexOf("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;") >= 0);
        ok(where + ": no injected attribute", !/" onmouseover=/i.test(h) && !/onerror=alert\(1\)>/i.test(h));
        ok(where + ": accent sanitised", h.indexOf("url(x)") < 0 && h.indexOf("#0e9f9a") >= 0);
        ok(where + ": font sanitised", h.indexOf("</style>") < 0);
        // Parse it the way an email app would (inert document: nothing is fetched) and check no element came from user input.
        var box = new DOMParser().parseFromString("<!doctype html><body>" + h, "text/html").body;
        ok(where + ": DOM has no script/svg", !box.querySelector("script,svg,iframe,object"));
        ok(where + ": every attribute is expected", Array.prototype.every.call(box.querySelectorAll("*"), function (el) {
          return Array.prototype.every.call(el.attributes, function (a) { return /^(style|href|src|width|alt|cellpadding|cellspacing|border|role|rowspan)$/.test(a.name); });
        }));
        ok(where + ": only safe hrefs", Array.prototype.every.call(box.querySelectorAll("a"), function (a) { return /^(https?:|mailto:|tel:)/.test(a.getAttribute("href")); }));
      });
      var good = Object.assign({}, evil, { tpl: tpl, logoUrl: hosted, name: "Ann" });
      var c2 = build(good, "copy"), p2 = build(good, "preview");
      ok(tpl + ": hosted logo in copy", c2.indexOf('src="' + hosted + '"') >= 0);
      ok(tpl + ": hosted logo never in preview", p2.indexOf(hosted) < 0 && p2.indexOf("logo.example") < 0);
    });
    ok("http logo rejected in copy", build({ name: "A", logoUrl: "http:" + "//logo.example/x.png", tpl: "classic" }, "copy").indexOf("<img") < 0);
    ok("webUrl", webUrl("example.com") === HTTPS + "example.com" && webUrl("javascript:alert(1)") === "" && webUrl("JaVaScRiPt:x") === "" && webUrl("ftp://x.y") === "");
    ok("tel", telHref("+962 (7) 9000-0000") === "tel:+962790000000");
    ok("ink", inkOn("#ffff00") === "#111111" && inkOn("#1a237e") === "#ffffff");
    // The live preview on the page renders the escaped text, never markup.
    var snap = read(), logo = state.localLogo;
    fill(Object.assign({}, evil, { tpl: "classic", logoUrl: hosted })); state.localLogo = ""; render();
    var pv = $("#preview");
    ok("page preview: text shown literally", pv.textContent.indexOf('<script>alert("x")</script>') >= 0);
    ok("page preview: no script element", !pv.querySelector("script,svg,iframe"));
    ok("page preview: no remote img", Array.prototype.every.call(document.images, function (im) { return im.src.indexOf(location.origin + "/") === 0 || /^(data|blob):/.test(im.src); }));
    fill(snap); state.localLogo = logo; render();
    return f.length ? f : true;
  };
})();
