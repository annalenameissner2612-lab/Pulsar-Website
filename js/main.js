/* =========================================================
   PULSAR – main.js
   alles an Interaktionen, was man sich auch hätte aufteilen können,
   aber jetzt ist es halt hier drin
========================================================= */

(function () {
  "use strict";

  /* =========================================================
     HELPERS
     keine Raketenwissenschaft, nur querySelector in kurz
  ========================================================= */
  const $ = (sel, parent = document) => parent.querySelector(sel);
  const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

  /* =========================================================
     BASIS ELEMENTE
     Sachen die auf mehreren Seiten gebraucht werden
  ========================================================= */
  const header = $(".site-header");
  const mainNav = $(".main-nav");
  const navToggle = $(".nav-toggle");
  const navList = $("[data-nav]");



  /* =========================================================
     1) HEADER-HÖHE DYNAMISCH IN CSS-VARIABLE SCHREIBEN
     weil sticky header + anchor links sonst wieder alles versetzen
  ========================================================= */
  function setHeaderHeightVar() {
    if (!header) return;

    const h = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty("--header-h", `${Math.round(h)}px`);
  }

  window.addEventListener("resize", setHeaderHeightVar);
  window.addEventListener("load", setHeaderHeightVar);
  setHeaderHeightVar();



  /* =========================================================
     2) MOBILE NAV TOGGLE
     klassisches burger-menü auf / zu
  ========================================================= */
  function closeMobileMenu() {
    if (!mainNav || !navToggle) return;

    mainNav.dataset.open = "false";
    navToggle.setAttribute("aria-expanded", "false");
  }

  function toggleMobileMenu() {
    if (!mainNav || !navToggle) return;

    const isOpen = mainNav.dataset.open === "true";
    mainNav.dataset.open = isOpen ? "false" : "true";
    navToggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
  }

  if (navToggle) {
    mainNav.dataset.open = "false";
    navToggle.addEventListener("click", toggleMobileMenu);
  }

  // wenn man irgendwo daneben hinklickt, menü wieder zu
  // weil offene mobile navs, die ewig rumhängen, einfach nerven
  document.addEventListener("click", (e) => {
    if (!mainNav) return;

    const isOpen = mainNav.dataset.open === "true";
    if (!isOpen) return;

    const clickedInside = mainNav.contains(e.target);
    if (!clickedInside) closeMobileMenu();
  });



  /* =========================================================
     3) SMOOTH SCROLL MIT HEADER OFFSET
     damit der sticky header nicht jedes ziel halb auffrisst
  ========================================================= */
  function scrollToHash(hash) {
    const target = document.querySelector(hash);
    if (!target) return;

    const headerH = header ? header.getBoundingClientRect().height : 0;
    const y = target.getBoundingClientRect().top + window.pageYOffset - headerH - 12;

    window.scrollTo({ top: y, behavior: "smooth" });
  }

  // alle internen hash-links abfangen
  // sonst springt der browser stumpf irgendwohin und ignoriert unseren offset
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const hash = a.getAttribute("href");
    if (!hash || hash === "#") return;

    closeMobileMenu();

    e.preventDefault();
    history.pushState(null, "", hash);
    scrollToHash(hash);
  });



  /* =========================================================
     4) REVEAL ON SCROLL
     eigentlich Standardkram, aber ohne observer wirkt die Seite halt tot
  ========================================================= */
  const revealEls = $$(".reveal");

  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 }
    );

    revealEls.forEach((el) => io.observe(el));
  } else {
    // fallback falls browser wieder meint speziell zu sein
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }



  /* =========================================================
     5) RESULTS – MENÜKARTEN SCHALTEN ARTIKEL UM
     hover zeigt an, klick lockt fest
  ========================================================= */
  const resultCards = Array.from(document.querySelectorAll(".results-card"));
  const resultArticles = Array.from(document.querySelectorAll(".result-article"));
  const resultsStage = document.querySelector(".results-stage");
  const resultsCardsRow = document.querySelector(".results-cards");

  let lockedResult = null;

  function getArticleByName(name) {
    return resultArticles.find((article) => article.dataset.article === name);
  }

  function setVisibleArticle(name) {
    const target = getArticleByName(name);
    if (!target) return;

    resultArticles.forEach((article) => {
      article.classList.toggle("is-visible", article === target);
    });

    // linkes großes bild mitwechseln
    // weil sonst rechts was anderes steht als links und dann ist das ganze system sinnlos
    const mediaImage = document.getElementById("results-media-image");
    if (!mediaImage) return;

    const images = {
      publisher: { src: "assets/img/Pulsarbrand.png", class: "img-publisher" },
      book: { src: "assets/img/bookcover.png", class: "img-book" },
      website: { src: "assets/img/Code.png", class: "img-website" }
    };

    if (images[name]) {
      mediaImage.src = images[name].src;
      mediaImage.classList.remove("img-publisher", "img-book", "img-website");
      mediaImage.classList.add(images[name].class);
    }
  }

  function setActiveCard(name) {
    resultCards.forEach((card) => {
      card.classList.toggle("is-active", card.dataset.result === name);
    });
  }

  function scrollToResultsArticle() {
    if (!resultsStage) return;

    const stageTop = resultsStage.getBoundingClientRect().top + window.scrollY;
    const offset = 120;

    window.scrollTo({
      top: stageTop - offset,
      behavior: "smooth",
    });
  }

  resultCards.forEach((card) => {
    const name = card.dataset.result;

    // hover nur solange nichts festgelockt ist
    card.addEventListener("mouseenter", () => {
      if (lockedResult) return;
      if (!getArticleByName(name)) return;

      setVisibleArticle(name);
      setActiveCard(name);
    });

    // klick = festsetzen oder wieder lösen
    card.addEventListener("click", () => {
      if (!getArticleByName(name)) return;

      if (lockedResult === name) {
        lockedResult = null;
        scrollToResultsArticle();
        return;
      }

      lockedResult = name;
      setVisibleArticle(name);
      setActiveCard(name);
      scrollToResultsArticle();
    });
  });

  // wenn maus die ganze kartenreihe verlässt:
  // entweder zurück zum gelockten artikel oder auf publisher als default
  if (resultsCardsRow) {
    resultsCardsRow.addEventListener("mouseleave", () => {
      if (lockedResult) {
        setVisibleArticle(lockedResult);
        setActiveCard(lockedResult);
      } else {
        setVisibleArticle("publisher");
        setActiveCard("publisher");
      }
    });
  }

  // initial halt publisher, irgendwas muss ja zuerst sichtbar sein
  setVisibleArticle("publisher");
  setActiveCard("publisher");



  /* =========================================================
     6) POSTER FAN
     die dämliche fächerlogik für die poster
  ========================================================= */
  const posterFanItems = Array.from(document.querySelectorAll(".poster-fan__item"));
  const posterInfoPanels = Array.from(document.querySelectorAll(".poster-info__panel"));
  const posterPointsPanels = Array.from(document.querySelectorAll(".poster-points__panel"));
  const posterFan = document.querySelector(".poster-fan");

  let lockedPoster = null;
  let activePoster = "poster2";

  function setPosterState(name) {
    if (activePoster === name) return;
    activePoster = name;

    const layoutMap = {
      poster1: {
        center: "poster1",
        left: "poster2",
        right: "poster3",
      },
      poster2: {
        center: "poster2",
        left: "poster1",
        right: "poster3",
      },
      poster3: {
        center: "poster3",
        left: "poster2",
        right: "poster1",
      },
    };

    const layout = layoutMap[name];
    if (!layout) return;

    posterFanItems.forEach((item) => {
      const itemName = item.dataset.poster;

      item.classList.remove(
        "is-left",
        "is-center",
        "is-right",
        "is-active",
        "poster-fan__item--left",
        "poster-fan__item--center",
        "poster-fan__item--right"
      );

      if (itemName === layout.center) {
        item.classList.add("poster-fan__item--center", "is-center", "is-active");
      } else if (itemName === layout.left) {
        item.classList.add("poster-fan__item--left", "is-left");
      } else if (itemName === layout.right) {
        item.classList.add("poster-fan__item--right", "is-right");
      }
    });

    // rechte infobox passend mitwechseln
    posterInfoPanels.forEach((panel) => {
      panel.classList.toggle("is-visible", panel.dataset.posterPanel === name);
    });

    // untere punkte passend mitwechseln
    posterPointsPanels.forEach((panel) => {
      panel.classList.toggle("is-visible", panel.dataset.posterPoints === name);
    });
  }

  posterFanItems.forEach((item) => {
    const name = item.dataset.poster;

    item.addEventListener("click", () => {
      if (lockedPoster === name) {
        lockedPoster = null;
        return;
      }

      lockedPoster = name;
      setPosterState(name);
    });
  });

  if (posterFan) {
    posterFan.addEventListener("mouseleave", () => {
      if (lockedPoster) {
        setPosterState(lockedPoster);
      } else {
        setPosterState("poster2");
      }
    });
  }

  // standardmäßig poster 2 in die mitte
  if (posterFanItems.length) {
    activePoster = "";
    setPosterState("poster2");
  }



  /* =========================================================
     7) PSYCHO – DESIGN CARDS
     hover zeigt auf, klick lockt fest
  ========================================================= */
  const psychoDesignCards = Array.from(document.querySelectorAll(".psycho-design-card"));

  let lockedDesignCard = null;

  function openDesignCard(name) {
    psychoDesignCards.forEach((card) => {
      card.classList.toggle("is-open", card.dataset.designCard === name);
    });
  }

  function setActiveDesignCard(name) {
    psychoDesignCards.forEach((card) => {
      card.classList.toggle("is-active", card.dataset.designCard === name);
    });
  }

  function clearOpenDesignCards() {
    psychoDesignCards.forEach((card) => card.classList.remove("is-open"));
  }

  psychoDesignCards.forEach((card) => {
    const name = card.dataset.designCard;
    const trigger = card.querySelector(".psycho-design-card__trigger");

    if (!trigger) return;

    trigger.addEventListener("mouseenter", () => {
      if (lockedDesignCard) return;
      openDesignCard(name);
    });

    trigger.addEventListener("click", () => {
      if (lockedDesignCard === name) {
        lockedDesignCard = null;
        clearOpenDesignCards();
        setActiveDesignCard("");
        return;
      }

      lockedDesignCard = name;
      clearOpenDesignCards();
      setActiveDesignCard(name);
    });
  });

  const psychoDesignCardsRow = document.querySelector(".psycho-design__cards");

  if (psychoDesignCardsRow) {
    psychoDesignCardsRow.addEventListener("mouseleave", () => {
      if (lockedDesignCard) {
        clearOpenDesignCards();
        setActiveDesignCard(lockedDesignCard);
      } else {
        clearOpenDesignCards();
        setActiveDesignCard("");
      }
    });
  }



  /* =========================================================
     8) PSYCHO – SUBJECT NAVIGATION
     obere menükarten schalten die content-sets um
  ========================================================= */
  const psychoSubjectCards = Array.from(document.querySelectorAll(".psycho-subject-card"));
  const psychoContentSets = Array.from(document.querySelectorAll(".psycho-content-set"));

  function setActivePsychoSubject(name) {
    psychoSubjectCards.forEach((card) => {
      card.classList.toggle("is-active", card.dataset.subject === name);
    });

    psychoContentSets.forEach((set) => {
      set.classList.toggle("is-active", set.dataset.subjectContent === name);
    });
  }

  psychoSubjectCards.forEach((card) => {
    const name = card.dataset.subject;
    const trigger = card.querySelector("[data-subject-trigger]");
    const moreLink = card.querySelector("[data-subject-more]");

    if (trigger) {
      trigger.addEventListener("click", (e) => {
        // falls auf "view more" geklickt wurde, nicht doppelt triggern
        if (e.target.closest("[data-subject-more]")) return;
        setActivePsychoSubject(name);
      });
    }

    if (moreLink) {
      moreLink.addEventListener("click", (e) => {
        e.preventDefault();

        setActivePsychoSubject(name);

        const targetId = moreLink.getAttribute("href");
        if (!targetId) return;

        // mini delay, damit das content-set erst sichtbar ist bevor gescrollt wird
        requestAnimationFrame(() => {
          scrollToHash(targetId);
        });
      });
    }
  });

  // startzustand = erstes thema sichtbar
  setActivePsychoSubject("ad-psychology");



  /* =========================================================
     9) PERCEPTION SCROLL STACK
     aktuell stillgelegt, weil man auch nicht jeden gimmick retten muss
  ========================================================= */
  // const scrollDeck = document.querySelector("[data-perception-scroll]");
  // const scrollCards = scrollDeck
  //   ? Array.from(scrollDeck.querySelectorAll("[data-stack-card]"))
  //   : [];

  // if (scrollDeck && scrollCards.length) {
  //   function updateScrollStack() {
  //     const rect = scrollDeck.getBoundingClientRect();
  //     const viewportHeight = window.innerHeight;

  //     const progress = Math.min(
  //       Math.max((viewportHeight - rect.top) / (viewportHeight + rect.height), 0),
  //       1
  //     );

  //     let index = Math.floor(progress * scrollCards.length);

  //     if (index >= scrollCards.length) {
  //       index = scrollCards.length - 1;
  //     }

  //     scrollCards.forEach((card, i) => {
  //       card.classList.toggle("is-active", i === index);
  //     });
  //   }

  //   window.addEventListener("scroll", updateScrollStack);
  //   updateScrollStack();
  // }



  /* =========================================================
     10) COLOR CULTURE STAGE
     die kultur-slides mit prev/next, weil statische boxen wohl zu einfach gewesen wären
  ========================================================= */
  const cultureStage = document.querySelector(".psycho-color-culture");
  const culturePrev = document.querySelector("[data-culture-prev]");
  const cultureNext = document.querySelector("[data-culture-next]");
  const cultureImage = document.querySelector("[data-culture-image]");
  const cultureTitle = document.querySelector("[data-culture-title]");
  const cultureLeft = document.querySelector("[data-culture-left]");
  const cultureRight = document.querySelector("[data-culture-right]");

  if (
    cultureStage &&
    culturePrev &&
    cultureNext &&
    cultureImage &&
    cultureTitle &&
    cultureLeft &&
    cultureRight
  ) {
    const cultureSlides = [
      {
        key: "ostasien",
        title: "OSTASIEN",
        image: "assets/img/ostasien.png",
        left: [
          { icon: "assets/img/elemente/red.svg", text: "Glück, Wohlstand, Erfolg" },
          { icon: "assets/img/elemente/yel.svg", text: "Reichtum, Status" },
          { icon: "assets/img/elemente/white.svg", text: "Tod, Trauer" },
          { icon: "assets/img/elemente/black.svg", text: "Erfahrung, Autorität" },
          { icon: "assets/img/elemente/blue.svg", text: "Heilung, Ruhe" }
        ],
        rightRows: [
          { icon: "assets/img/elemente/nowhite.svg", text: "für emotionale Produkte" },
          { icon: "assets/img/elemente/nogreen.svg", text: "in bestimmten Kontexten" }
        ],
        note: "Symbolik oft wichtiger als Funktion"
      },

      {
        key: "suedasien",
        title: "SÜDASIEN",
        image: "assets/img/südasien.png",
        left: [
          { icon: "assets/img/elemente/red.svg", text: "Hochzeit, Reinheit, Fruchtbarkeit" },
          { icon: "assets/img/elemente/yel.svg", text: "Wissen, Heiligkeit" },
          { icon: "assets/img/elemente/green.svg", text: "Leben, Hoffnung" },
          { icon: "assets/img/elemente/orange.svg", text: "Opfer, Spiritualität" },
          { icon: "assets/img/elemente/black.svg", text: "Unglück, Abwehr" }
        ],
        rightRows: [
          { icon: "assets/img/elemente/noblack.svg", text: "kaum positiv einsetzbar" }
        ],
        note: "Farben oft sehr emotional & religiös<br> Zu minimalistische Designs wirken kalt"
      },

      {
        key: "naher-osten",
        title: "NAHER OSTEN",
        image: "assets/img/naherosten.png",
        left: [
          { icon: "assets/img/elemente/green.svg", text: "Heiligkeit, Islam, Leben" },
          { icon: "assets/img/elemente/blue.svg", text: "Schutz, Spiritualität" },
          { icon: "assets/img/elemente/yel.svg", text: "Reichtum, Macht" },
          { icon: "assets/img/elemente/white.svg", text: "Reinheit, Glaube" },
          { icon: "assets/img/elemente/black.svg", text: "Würde, Trauer" }
        ],
        rightRows: [
          { icon: "assets/img/elemente/nogreen.svg", text: "Respektlose Nutzung vermeiden" },
          { icon: "assets/img/elemente/nosex.svg", text: "Sexuelle Farbkonnotationen" }
        ],
        note: "Luxus = Ornament + Farbe,<br> kein Minimalismus"
      },

      {
        key: "afrika",
        title: "AFRIKA",
        image: "assets/img/afrika.png",
        left: [
          { icon: "assets/img/elemente/red.svg", text: "Leben, Tod, Stärke" },
          { icon: "assets/img/elemente/yel.svg", text: "Reichtum, Energie" },
          { icon: "assets/img/elemente/green.svg", text: "Wachstum, Gemeinschaft" },
          { icon: "assets/img/elemente/white.svg", text: "Spiritualität" },
          { icon: "assets/img/elemente/black.svg", text: "Reife, Männlichkeit" }
        ],
        rightRows: [],
        note: "Bedeutung stark regional unterschiedlich Muster & Farbvielfalt wichtiger als Minimalismus<br> Zu „westliches“ Design wirkt fremd"
      },

      {
        key: "lateinamerika",
        title: "LATEINAMERIKA",
        image: "assets/img/latein.png",
        left: [
          { icon: "assets/img/elemente/red.svg", text: "Leidenschaft, Religion" },
          { icon: "assets/img/elemente/yel.svg", text: "Sonne, Tod (Mexiko)" },
          { icon: "assets/img/elemente/green.svg", text: "Freiheit, Natur" },
          { icon: "assets/img/elemente/blue.svg", text: "Vertrauen" },
          { icon: "assets/img/elemente/lila.svg", text: "Trauer (Brasilien)" }
        ],
        rightRows: [],
        note: " Farben emotionaler als im Westen Religiöse Symbolik sehr präsent Trauerfarben je nach Land unterschiedlich"
      }
    ];

    let currentCultureIndex = 0;

    function buildCultureLeft(rows) {
      return rows
        .map(
          (row) => `
            <div class="psycho-color-culture__color-row">
              <img src="${row.icon}" alt="" aria-hidden="true" class="psycho-color-culture__color-icon">
              <span class="psycho-color-culture__color-text">${row.text}</span>
            </div>
          `
        )
        .join("");
    }

    function buildCultureRight(rows, note) {
      const listHtml = rows
        .map(
          (row) => `
            <div class="psycho-color-culture__right-row">
              <img src="${row.icon}" alt="" aria-hidden="true" class="psycho-color-culture__right-icon">
              <span class="psycho-color-culture__right-text">${row.text}</span>
            </div>
          `
        )
        .join("");

      return `
        <div class="psycho-color-culture__right-content">
          <div class="psycho-color-culture__right-list">
            ${listHtml}
          </div>

          <div class="psycho-color-culture__note">
            <img src="assets/img/elemente/rightdown.svg" alt="" aria-hidden="true" class="psycho-color-culture__note-icon">
            <p class="psycho-color-culture__note-text">${note}</p>
          </div>
        </div>
      `;
    }

    function updateCultureStage() {
      const slide = cultureSlides[currentCultureIndex];
      if (!slide) return;

      cultureTitle.textContent = slide.title;
      cultureImage.style.backgroundImage = `url("${slide.image}")`;

      cultureLeft.innerHTML = buildCultureLeft(slide.left);
      cultureRight.innerHTML = buildCultureRight(slide.rightRows, slide.note);

      // prev-button erst anzeigen wenn man nicht mehr ganz vorne ist
      culturePrev.classList.toggle("is-hidden", currentCultureIndex === 0);
    }

    cultureNext.addEventListener("click", () => {
      if (currentCultureIndex === cultureSlides.length - 1) {
        currentCultureIndex = 0; // letzter step springt wieder auf den anfang
      } else {
        currentCultureIndex += 1;
      }

      updateCultureStage();
    });

    culturePrev.addEventListener("click", () => {
      if (currentCultureIndex === 0) return;

      currentCultureIndex -= 1;
      updateCultureStage();
    });

    updateCultureStage();
  }



  /* =========================================================
     11) CHECKOUT – KOMPLETTER ABLAUF
     daten, zahlung, review, fake bestätigung, das ganze paket
  ========================================================= */
  const checkoutRoot = document.querySelector(".checkout");

  if (checkoutRoot)
  {
    const stepPanels = Array.from(checkoutRoot.querySelectorAll(".checkout-step-panel"));
    const stepIndicators = Array.from(checkoutRoot.querySelectorAll("[data-step-indicator]"));

    const nextButtons = Array.from(checkoutRoot.querySelectorAll("[data-checkout-next]"));
    const backButtons = Array.from(checkoutRoot.querySelectorAll("[data-checkout-back]"));

    const stepOneFields = Array.from(
      checkoutRoot.querySelectorAll('[data-checkout-step="1"] .checkout-field__input')
    );

    const paymentRadios = Array.from(
      checkoutRoot.querySelectorAll('input[name="payment-method"]')
    );

    // kreditkartenfelder
    const creditFieldsWrap = checkoutRoot.querySelector("[data-credit-fields]");
    const creditInputs = creditFieldsWrap
      ? Array.from(creditFieldsWrap.querySelectorAll(".checkout-field__input"))
      : [];

    // rechnungsfelder
    const invoiceFieldsWrap = checkoutRoot.querySelector("[data-invoice-fields]");
    const invoiceInputs = invoiceFieldsWrap
      ? Array.from(invoiceFieldsWrap.querySelectorAll(".checkout-field__input"))
      : [];

    // review-ausgabe in schritt 3
    const reviewName = checkoutRoot.querySelector("[data-review-name]");
    const reviewEmail = checkoutRoot.querySelector("[data-review-email]");
    const reviewAddress = checkoutRoot.querySelector("[data-review-address]");
    const reviewPayment = checkoutRoot.querySelector("[data-review-payment]");

    let currentStep = 1;

    function showStep(stepNumber)
    {
      currentStep = stepNumber;

      stepPanels.forEach((panel) =>
      {
        const panelStep = Number(panel.getAttribute("data-checkout-step"));
        panel.classList.toggle("is-active", panelStep === stepNumber);
      });

      stepIndicators.forEach((indicator) =>
      {
        const indicatorStep = Number(indicator.getAttribute("data-step-indicator"));
        indicator.classList.toggle("is-active", indicatorStep === stepNumber);
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // markiert leere felder rot
    // also die ganze nummer mit .is-error
    function validateFields(fields)
    {
      let isValid = true;

      fields.forEach((field) =>
      {
        const value = field.value.trim();

        if (!value)
        {
          field.classList.add("is-error");
          isValid = false;
        }
        else
        {
          field.classList.remove("is-error");
        }
      });

      return isValid;
    }

    function getSelectedPaymentMethod()
    {
      const selected = paymentRadios.find((radio) => radio.checked);
      return selected ? selected.value : "";
    }

    function getPaymentLabel(value)
    {
      if (value === "paypal") return "PayPal";
      if (value === "credit") return "Kreditkarte";
      if (value === "invoice") return "Rechnung";
      return "";
    }

    // validierung step 1
    function validateStepOne()
    {
      const valid = validateFields(stepOneFields);

      if (!valid)
      {
        alert("Bitte fülle alle Felder aus.");
      }

      return valid;
    }

    // validierung step 2
    function validateStepTwo()
    {
      const selectedPayment = getSelectedPaymentMethod();

      if (!selectedPayment)
      {
        alert("Bitte wähle eine Zahlungsart aus.");
        return false;
      }

      if (selectedPayment === "credit")
      {
        const validCredit = validateFields(creditInputs);

        invoiceInputs.forEach((field) => field.classList.remove("is-error"));

        if (!validCredit)
        {
          alert("Bitte fülle die Kreditkartendaten aus.");
          return false;
        }
      }
      else if (selectedPayment === "invoice")
      {
        const validInvoice = validateFields(invoiceInputs);

        creditInputs.forEach((field) => field.classList.remove("is-error"));

        if (!validInvoice)
        {
          alert("Bitte fülle die Rechnungsdaten aus.");
          return false;
        }
      }
      else
      {
        creditInputs.forEach((field) => field.classList.remove("is-error"));
        invoiceInputs.forEach((field) => field.classList.remove("is-error"));
      }

      return true;
    }

    // daten aus formular in review-boxen schreiben
    function fillReviewData()
    {
      const firstName = checkoutRoot.querySelector("#first-name")?.value.trim() || "";
      const lastName = checkoutRoot.querySelector("#last-name")?.value.trim() || "";
      const email = checkoutRoot.querySelector("#email")?.value.trim() || "";
      const street = checkoutRoot.querySelector("#street")?.value.trim() || "";
      const zip = checkoutRoot.querySelector("#zip")?.value.trim() || "";
      const city = checkoutRoot.querySelector("#city")?.value.trim() || "";
      const country = checkoutRoot.querySelector("#country")?.value.trim() || "";
      const payment = getPaymentLabel(getSelectedPaymentMethod());

      if (reviewName) reviewName.textContent = `${firstName} ${lastName}`.trim();
      if (reviewEmail) reviewEmail.textContent = email;
      if (reviewAddress) reviewAddress.textContent = `${street}, ${zip} ${city}, ${country}`;
      if (reviewPayment) reviewPayment.textContent = payment;
    }

    // zeigt je nach zahlungsart die passenden felder an
    function updatePaymentFieldsVisibility()
    {
      const selectedPayment = getSelectedPaymentMethod();

      if (creditFieldsWrap)
      {
        creditFieldsWrap.hidden = selectedPayment !== "credit";
      }

      if (invoiceFieldsWrap)
      {
        invoiceFieldsWrap.hidden = selectedPayment !== "invoice";
      }
    }

    // weiter-buttons durch die steps
    nextButtons.forEach((button) =>
    {
      button.addEventListener("click", () =>
      {
        // =====================================================
        // WICHTIG:
        // wenn die roten fehlerfelder + alerts wieder aktiv sein sollen,
        // diese beiden blöcke hier UNTEN wieder entkommentieren
        // und die direkten showStep()-blöcke darunter NICHT benutzen
        // =====================================================

        // if (currentStep === 1)
        // {
        //   if (!validateStepOne()) return;
        //   showStep(2);
        //   return;
        // }

        // if (currentStep === 2)
        // {
        //   if (!validateStepTwo()) return;
        //   fillReviewData();
        //   showStep(3);
        //   return;
        // }

        // aktuelle vereinfachte version ohne step-1 / step-2 pflichtvalidierung
        if (currentStep === 1)
        {
          showStep(2);
          return;
        }

        if (currentStep === 2)
        {
          fillReviewData();
          showStep(3);
          return;
        }

        // step 3 = bestellen
        // paypal geht erst auf paypal-demo
        // andere zahlungsarten kriegen den loader und dann step 4
        if (currentStep === 3)
        {
          const selectedPayment = getSelectedPaymentMethod();

          if (!selectedPayment)
          {
            alert("Bitte wähle eine Zahlungsart aus.");
            return;
          }

          if (selectedPayment === "paypal")
          {
            window.location.href = "paypal.html";
            return;
          }

          const loader = document.querySelector("[data-loader]");

          if (loader)
          {
            loader.classList.add("is-active");
          }

          setTimeout(() =>
          {
            if (loader)
            {
              loader.classList.remove("is-active");
            }

            showStep(4);

          }, 1800);

          return;
        }
      });
    });

    // zurück-buttons
    backButtons.forEach((button) =>
    {
      button.addEventListener("click", () =>
      {
        if (currentStep === 2)
        {
          showStep(1);
          return;
        }

        if (currentStep === 3)
        {
          showStep(2);
          return;
        }

        if (currentStep === 4)
        {
          showStep(3);
        }
      });
    });

    // wenn man wieder tippt, rote fehlerklasse entfernen
    [...stepOneFields, ...creditInputs, ...invoiceInputs].forEach((field) =>
    {
      field.addEventListener("input", () =>
      {
        if (field.value.trim())
        {
          field.classList.remove("is-error");
        }
      });

      field.addEventListener("change", () =>
      {
        if (field.value.trim())
        {
          field.classList.remove("is-error");
        }
      });
    });

    // bei wechsel der zahlungsart passende felder zeigen/verstecken
    paymentRadios.forEach((radio) =>
    {
      radio.addEventListener("change", () =>
      {
        updatePaymentFieldsVisibility();
      });
    });

    updatePaymentFieldsVisibility();
    showStep(1);

    // rücksprung aus paypal-demo
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("paypal") === "cancel")
    {
      fillReviewData();
      showStep(3);
    }

    if (urlParams.get("paypal") === "success")
    {
      fillReviewData();
      showStep(4);
    }
  }



  /* =========================================================
     12) SHOP – SAMPLE MODAL
     kleines popup für leseprobe
  ========================================================= */
  const sampleModal = document.querySelector("[data-sample-modal]");
  const sampleOpenButton = document.querySelector("[data-sample-open]");
  const sampleCloseButtons = document.querySelectorAll("[data-sample-close]");

  if (sampleModal && sampleOpenButton)
  {
    function openSampleModal()
    {
      sampleModal.hidden = false;
      document.body.classList.add("sample-modal-open");
    }

    function closeSampleModal()
    {
      sampleModal.hidden = true;
      document.body.classList.remove("sample-modal-open");
    }

    sampleOpenButton.addEventListener("click", openSampleModal);

    sampleCloseButtons.forEach((button) =>
    {
      button.addEventListener("click", closeSampleModal);
    });

    // escape schließt modal, so wie sich das gehört
    document.addEventListener("keydown", (event) =>
    {
      if (event.key === "Escape" && !sampleModal.hidden)
      {
        closeSampleModal();
      }
    });
  }



  /* =========================================================
     13) ALT / STILLGELEGT / TESTKRAM
     bleibt kommentiert drin, weil man es später evtl. nochmal braucht
  ========================================================= */
  // // Disable checkout validation globally
  // window.validateStepOne = () => true;
  // window.validateStepTwo = () => true;

  // const disableValidation = true;

  // if (disableValidation) {
  //   document.querySelectorAll("form").forEach(form => {
  //     form.setAttribute("novalidate", "novalidate");
  //   });
  // }



  /* =========================================================
     14) PAYPAL DEMO
     fake-bezahlen button + loader + rücksprung in checkout
  ========================================================= */
  const paypalDemoSubmit = document.querySelector("[data-paypal-demo-submit]");

  if (paypalDemoSubmit)
  {
    paypalDemoSubmit.addEventListener("click", () =>
    {
      const loader = document.querySelector("[data-loader]");

      if (loader)
      {
        loader.classList.add("is-active");
      }

      setTimeout(() =>
      {
        window.location.href = "checkout.html?paypal=success";
      }, 1800);
    });
  }



  /* =========================================================
     15) COOKIE BANNER
     nerviges popup, aber gehört halt dazu
  ========================================================= */
  const cookieBanner = document.querySelector("[data-cookie-banner]");
  const cookieAcceptButton = document.querySelector("[data-cookie-accept]");
  const cookieDeclineButton = document.querySelector("[data-cookie-decline]");

  if (cookieBanner)
  {
    const cookieChoice = localStorage.getItem("pulsar-cookie-choice");

    if (!cookieChoice)
    {
      cookieBanner.hidden = false;
    }

    function closeCookieBanner(choice)
    {
      localStorage.setItem("pulsar-cookie-choice", choice);
      cookieBanner.hidden = true;
    }

    if (cookieAcceptButton)
    {
      cookieAcceptButton.addEventListener("click", () =>
      {
        closeCookieBanner("accepted");
      });
    }

    if (cookieDeclineButton)
    {
      cookieDeclineButton.addEventListener("click", () =>
      {
        closeCookieBanner("necessary");
      });
    }
  }



  /* =========================================================
     16) BEHINDI   TOGGLE
     speichert status in localStorage, damit das ding nicht bei jedem reload resetet
  ========================================================= */
  const a11yToggle = document.querySelector(".a11y-toggle");

  if (a11yToggle) {
    a11yToggle.addEventListener("click", () => {
      a11yToggle.classList.toggle("active");

      const isActive = a11yToggle.classList.contains("active");

      // status merken
      localStorage.setItem("pulsar-a11y", isActive);

      // klasse auf body setzen / entfernen
      document.body.classList.toggle("a11y-mode", isActive);
    });

    // gespeicherten status beim laden wieder anwenden
    const saved = localStorage.getItem("pulsar-a11y") === "true";
    if (saved) {
      a11yToggle.classList.add("active");
      document.body.classList.add("a11y-mode");
    }
  }

})();