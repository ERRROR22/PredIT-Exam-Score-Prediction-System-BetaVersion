/* ── PredIT main.js ── */

(function () {
  "use strict";

  // ── State ──────────────────────────────────────────────────────────────────
  let currentStep = 1;
  const TOTAL_STEPS = 4;

  // Fields required per step (pill-based — sliders always have values)
  const requiredPills = {
    1: ["gender", "school_type", "distance_from_home", "family_income"],
    2: ["extracurricular_activities", "internet_access"],
    3: ["learning_disabilities", "motivation_level", "peer_influence"],
    4: ["parental_involvement", "parental_education_level", "teacher_quality", "access_to_resources"],
  };

  // ── DOM refs ───────────────────────────────────────────────────────────────
  const progressBar = document.getElementById("progress-bar");
  const stepNum     = document.getElementById("step-num");
  const backBtn     = document.getElementById("back-btn");
  const nextBtn     = document.getElementById("next-btn");
  const submitBtn   = document.getElementById("submit-btn");
  const modalOverlay = document.getElementById("modal-overlay");
  const modalClose  = document.getElementById("modal-close");
  const retryBtn    = document.getElementById("retry-btn");

  // ── Slider init ────────────────────────────────────────────────────────────
  function initSlider(id, badgeId, suffix) {
    const slider = document.getElementById(id);
    const badge  = document.getElementById(badgeId);
    if (!slider || !badge) return;

    function update() {
      const val = slider.value;
      badge.textContent = suffix ? val + suffix : val;
      const pct = ((val - slider.min) / (slider.max - slider.min)) * 100;
      slider.style.backgroundSize = pct + "% 100%";
    }
    slider.addEventListener("input", update);
    update();
  }

  initSlider("hours_studied",      "hours-val",    "");
  initSlider("attendance",         "attendance-val", "%");
  initSlider("sleep_hours",        "sleep-val",    "");
  initSlider("tutoring_sessions",  "tutoring-val", "");
  initSlider("previous_scores",    "prev-val",     "");
  initSlider("physical_activity",  "physical-val", "");

  // ── Pill selection ─────────────────────────────────────────────────────────
  document.querySelectorAll(".pills").forEach(function (group) {
    group.addEventListener("click", function (e) {
      const pill = e.target.closest(".pill");
      if (!pill) return;
      group.querySelectorAll(".pill").forEach(function (p) { p.classList.remove("selected"); });
      pill.classList.add("selected");
      group.classList.remove("error");
    });
  });

  // ── Get pill value ─────────────────────────────────────────────────────────
  function getPillValue(field) {
    const group = document.querySelector(".pills[data-field='" + field + "']");
    if (!group) return null;
    const sel = group.querySelector(".pill.selected");
    return sel ? sel.dataset.val : null;
  }

  // ── Validate current step ──────────────────────────────────────────────────
  function validateStep(step) {
    const fields = requiredPills[step] || [];
    let valid = true;
    fields.forEach(function (field) {
      if (!getPillValue(field)) {
        const group = document.querySelector(".pills[data-field='" + field + "']");
        if (group) {
          group.classList.add("error");
          group.classList.remove("shake");
          void group.offsetWidth; // reflow
          group.classList.add("shake");
        }
        valid = false;
      }
    });
    return valid;
  }

  // ── Update UI for step ─────────────────────────────────────────────────────
  function goToStep(step) {
    // Hide current
    document.getElementById("step-" + currentStep).classList.remove("active");
    document.getElementById("dot-" + currentStep).classList.remove("active");
    document.getElementById("dot-" + currentStep).classList.add("done");

    currentStep = step;

    // Show new
    document.getElementById("step-" + currentStep).classList.add("active");
    document.getElementById("dot-" + currentStep).classList.remove("done");
    document.getElementById("dot-" + currentStep).classList.add("active");

    // Step counter
    stepNum.textContent = currentStep;

    // Progress bar
    progressBar.style.width = (currentStep / TOTAL_STEPS * 100) + "%";

    // Back button
    backBtn.style.visibility = currentStep === 1 ? "hidden" : "visible";

    // Next/Submit visibility
    if (currentStep === TOTAL_STEPS) {
      nextBtn.style.display = "none";
    } else {
      nextBtn.style.display = "inline-flex";
    }

    // Scroll to form
    document.getElementById("predictor").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ── Next ───────────────────────────────────────────────────────────────────
  nextBtn.addEventListener("click", function () {
    if (!validateStep(currentStep)) return;
    if (currentStep < TOTAL_STEPS) goToStep(currentStep + 1);
  });

  // ── Back ───────────────────────────────────────────────────────────────────
  backBtn.addEventListener("click", function () {
    if (currentStep > 1) {
      document.getElementById("step-" + currentStep).classList.remove("active");
      document.getElementById("dot-" + currentStep).classList.remove("active");

      currentStep--;

      document.getElementById("step-" + currentStep).classList.add("active");
      document.getElementById("dot-" + currentStep).classList.remove("done");
      document.getElementById("dot-" + currentStep).classList.add("active");

      stepNum.textContent = currentStep;
      progressBar.style.width = (currentStep / TOTAL_STEPS * 100) + "%";
      backBtn.style.visibility = currentStep === 1 ? "hidden" : "visible";
      nextBtn.style.display = "inline-flex";
    }
  });

  // ── Collect all data ───────────────────────────────────────────────────────
  function collectData() {
    return {
      gender:                   getPillValue("gender"),
      school_type:              getPillValue("school_type"),
      distance_from_home:       getPillValue("distance_from_home"),
      family_income:            getPillValue("family_income"),
      hours_studied:            parseFloat(document.getElementById("hours_studied").value),
      attendance:               parseFloat(document.getElementById("attendance").value),
      sleep_hours:              parseFloat(document.getElementById("sleep_hours").value),
      tutoring_sessions:        parseFloat(document.getElementById("tutoring_sessions").value),
      extracurricular_activities: getPillValue("extracurricular_activities"),
      internet_access:          getPillValue("internet_access"),
      previous_scores:          parseFloat(document.getElementById("previous_scores").value),
      physical_activity:        parseFloat(document.getElementById("physical_activity").value),
      learning_disabilities:    getPillValue("learning_disabilities"),
      motivation_level:         getPillValue("motivation_level"),
      peer_influence:           getPillValue("peer_influence"),
      parental_involvement:     getPillValue("parental_involvement"),
      parental_education_level: getPillValue("parental_education_level"),
      teacher_quality:          getPillValue("teacher_quality"),
      access_to_resources:      getPillValue("access_to_resources"),
    };
  }

  // ── Submit / Predict ───────────────────────────────────────────────────────
  submitBtn.addEventListener("click", function () {
    if (!validateStep(4)) return;

    const payload = collectData();
    setLoading(true);

    fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        setLoading(false);
        if (data.success) {
          showResult(data.score);
        } else {
          alert("Prediction failed: " + data.error);
        }
      })
      .catch(function (err) {
        setLoading(false);
        alert("Network error: " + err.message);
      });
  });

  function setLoading(on) {
    submitBtn.disabled = on;
    document.getElementById("btn-text").style.display   = on ? "none" : "inline";
    document.getElementById("btn-arrow").style.display  = on ? "none" : "inline";
    document.getElementById("btn-spinner").style.display = on ? "inline-block" : "none";
  }

  // ── Show result modal ──────────────────────────────────────────────────────
  function showResult(score) {
    // Animate score counter
    const scoreEl = document.getElementById("score-number");
    const fillEl  = document.getElementById("score-fill");
    let current = 0;
    const target = Math.round(score);
    const step   = Math.max(1, Math.floor(target / 40));

    const counter = setInterval(function () {
      current = Math.min(current + step, target);
      scoreEl.textContent = current;
      if (current >= target) clearInterval(counter);
    }, 25);

    // Progress fill
    setTimeout(function () {
      fillEl.style.width = score + "%";
    }, 100);

    // Grade label
    const gradeEl = document.getElementById("score-grade");
    const msgEl   = document.getElementById("modal-msg");
    let grade, msg;

    if (score >= 90) {
      grade = "Outstanding — A+";
      msg   = "Exceptional result! Your strong study habits, high attendance, and supportive environment are paying off. <strong>Keep up this excellent momentum.</strong>";
    } else if (score >= 80) {
      grade = "Excellent — A";
      msg   = "Great performance! You're performing above average. <strong>A little more focus on weak areas</strong> could push you into outstanding territory.";
    } else if (score >= 70) {
      grade = "Good — B";
      msg   = "Solid result. You're on the right track. <strong>Consider increasing study hours or tutoring sessions</strong> to climb higher.";
    } else if (score >= 60) {
      grade = "Average — C";
      msg   = "There's clear room to grow. Try improving <strong>sleep consistency, attendance, and peer interactions</strong> to boost your score significantly.";
    } else {
      grade = "Needs Improvement — D";
      msg   = "Don't be discouraged — small changes make a big difference. Focus on <strong>regular study, better attendance, and seeking teacher support.</strong>";
    }

    gradeEl.textContent = grade;
    msgEl.innerHTML     = msg;

    // Open modal
    modalOverlay.classList.add("open");
  }

  // ── Close modal ────────────────────────────────────────────────────────────
  function closeModal() {
    modalOverlay.classList.remove("open");
  }

  modalClose.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) closeModal();
  });

  // ── Retry ─────────────────────────────────────────────────────────────────
  retryBtn.addEventListener("click", function () {
    closeModal();

    // Reset pills
    document.querySelectorAll(".pill").forEach(function (p) {
      p.classList.remove("selected");
    });

    // Reset sliders to defaults
    var defaults = {
      hours_studied: 5, attendance: 75, sleep_hours: 7,
      tutoring_sessions: 2, previous_scores: 70, physical_activity: 3
    };
    Object.entries(defaults).forEach(function([id, val]) {
      var el = document.getElementById(id);
      if (el) { el.value = val; el.dispatchEvent(new Event("input")); }
    });

    // Reset to step 1
    document.querySelectorAll(".f-section").forEach(function (s) { s.classList.remove("active"); });
    document.querySelectorAll(".dot").forEach(function (d) { d.classList.remove("active", "done"); });
    currentStep = 1;
    document.getElementById("step-1").classList.add("active");
    document.getElementById("dot-1").classList.add("active");
    stepNum.textContent = "1";
    progressBar.style.width = "25%";
    backBtn.style.visibility = "hidden";
    nextBtn.style.display = "inline-flex";
    document.getElementById("score-fill").style.width = "0%";

    // Scroll to form
    document.getElementById("predictor").scrollIntoView({ behavior: "smooth" });
  });

})();
