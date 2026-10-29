/* Лендинг «Водоподготовка в Краснодаре» — тестовая версия.
   Формы ничего не отправляют: после проверки показывают, что ушло бы менеджеру. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var scrollBehavior = function () { return reduceMotion.matches ? 'auto' : 'smooth'; };

  /* ---------- Появление блоков при прокрутке ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Телефон: маска +7 и 10 цифр ---------- */
  function phoneDigits(value) {
    var v = value.trim();
    var d = v.indexOf('+7') === 0 ? v.slice(2).replace(/\D/g, '') : v.replace(/\D/g, '');
    if (d.length > 10 && /^[78]/.test(d)) d = d.slice(1);
    return d.slice(0, 10);
  }

  function formatPhone(d) {
    var s = '+7 (' + d.slice(0, 3);
    if (d.length >= 3) s += ')';
    if (d.length > 3) s += ' ' + d.slice(3, 6);
    if (d.length > 6) s += '-' + d.slice(6, 8);
    if (d.length > 8) s += '-' + d.slice(8, 10);
    return s;
  }

  document.querySelectorAll('[data-phone]').forEach(function (input) {
    input.addEventListener('focus', function () {
      if (!input.value) input.value = '+7 (';
    });
    input.addEventListener('blur', function () {
      if (!phoneDigits(input.value)) input.value = '';
    });
    input.addEventListener('input', function (e) {
      var deleting = e.inputType && e.inputType.indexOf('delete') === 0;
      var d = phoneDigits(input.value);
      // Стёрли скобку или дефис — убираем последнюю цифру, иначе маска вернёт символ обратно
      if (deleting && d === (input.dataset.digits || '') && d) d = d.slice(0, -1);
      input.dataset.digits = d;
      input.value = d ? formatPhone(d) : (deleting ? '' : '+7 (');
      clearError(input);
    });
  });

  /* ---------- Ошибки под полями ---------- */
  function errorBox(el) {
    var id = el.getAttribute('aria-describedby');
    return id ? document.getElementById(id) : null;
  }
  function setError(el, message) {
    el.setAttribute('aria-invalid', 'true');
    var box = errorBox(el);
    if (box) box.textContent = message;
  }
  function clearError(el) {
    el.removeAttribute('aria-invalid');
    var box = errorBox(el);
    if (box) box.textContent = '';
  }

  function validateContact(scope) {
    var phone = scope.querySelector('[data-phone]');
    var consent = scope.querySelector('[name="consent"]');
    var firstInvalid = null;
    var digits = phoneDigits(phone.value);
    if (!digits) {
      setError(phone, 'Введите номер телефона');
      firstInvalid = phone;
    } else if (digits.length < 10) {
      setError(phone, 'Введите номер полностью — 10 цифр после +7');
      firstInvalid = phone;
    } else {
      clearError(phone);
    }
    if (!consent.checked) {
      setError(consent, 'Отметьте согласие — без него мы не сможем связаться');
      firstInvalid = firstInvalid || consent;
    } else {
      clearError(consent);
    }
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  document.querySelectorAll('[name="consent"]').forEach(function (box) {
    box.addEventListener('change', function () { if (box.checked) clearError(box); });
  });

  /* ---------- Экран «Спасибо» с тем, что ушло бы менеджеру ---------- */
  function adLabels() {
    var params = new URLSearchParams(window.location.search);
    var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid'];
    var found = keys.filter(function (k) { return params.get(k); })
      .map(function (k) { return k + '=' + params.get(k); });
    return found.length ? found.join(', ') : 'нет — страницу открыли не из рекламы';
  }

  function renderThanks(container, rows, onRestart) {
    var now = new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    rows = rows.concat([['Время заявки', now], ['Метки рекламы', adLabels()]]);
    container.innerHTML =
      '<div class="thanks__icon"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg></div>' +
      '<h3 class="thanks__title" tabindex="-1">Спасибо, это тестовый режим: заявка никуда не ушла.</h3>' +
      '<p class="thanks__sub">Вот что получил бы менеджер:</p>' +
      '<dl class="summary"></dl>' +
      '<button class="btn btn--ghost" type="button">Заполнить заново</button>';
    var list = container.querySelector('.summary');
    rows.forEach(function (row) {
      var item = document.createElement('div');
      var dt = document.createElement('dt');
      var dd = document.createElement('dd');
      dt.textContent = row[0];
      dd.textContent = row[1];
      item.appendChild(dt);
      item.appendChild(dd);
      list.appendChild(item);
    });
    container.querySelector('button').addEventListener('click', onRestart);
    container.hidden = false;
    var title = container.querySelector('.thanks__title');
    title.focus({ preventScroll: true });
    if (container.getBoundingClientRect().top < 0) {
      container.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    }
  }

  function resetForm(form) {
    form.reset();
    form.querySelectorAll('[data-phone]').forEach(function (p) { p.dataset.digits = ''; clearError(p); });
    form.querySelectorAll('[name="consent"]').forEach(clearError);
  }

  /* ---------- Квиз ---------- */
  var quiz = document.querySelector('[data-quiz]');
  if (quiz) {
    var form = quiz.querySelector('[data-quiz-form]');
    var steps = Array.prototype.slice.call(form.querySelectorAll('[data-step]'));
    var questions = steps.length - 1;
    var label = quiz.querySelector('[data-quiz-label]');
    var bar = quiz.querySelector('[data-quiz-bar]');
    var progress = quiz.querySelector('[role="progressbar"]');
    var progressWrap = quiz.querySelector('[data-quiz-progress]');
    var thanks = quiz.querySelector('[data-thanks]');
    var current = 0;
    var pointerPick = false;

    var syncChecked = function (step) {
      step.querySelectorAll('.option').forEach(function (opt) {
        opt.classList.toggle('is-checked', opt.querySelector('input').checked);
      });
    };

    var stepError = function (step, message) {
      var box = step.querySelector('[data-step-error]');
      if (box) box.textContent = message || '';
    };

    var updateProgress = function () {
      label.textContent = current < questions ? 'Вопрос ' + (current + 1) + ' из ' + questions : 'Последний шаг';
      bar.style.width = ((current + 1) / steps.length * 100) + '%';
      progress.setAttribute('aria-valuenow', String(current + 1));
      progress.setAttribute('aria-valuetext', label.textContent);
    };

    var show = function (index, direction) {
      steps[current].hidden = true;
      current = index;
      var step = steps[current];
      step.hidden = false;
      step.classList.remove('is-entering', 'is-entering-back');
      void step.offsetWidth;
      step.classList.add(direction < 0 ? 'is-entering-back' : 'is-entering');
      updateProgress();
      step.querySelector('legend').focus({ preventScroll: true });
      if (quiz.getBoundingClientRect().top < 0) {
        quiz.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
      }
    };

    var answered = function (step) {
      return !!step.querySelector('.options input:checked');
    };

    var next = function () {
      var step = steps[current];
      if (!answered(step)) {
        stepError(step, step.getAttribute('data-required'));
        return;
      }
      stepError(step, '');
      if (current < steps.length - 1) show(current + 1, 1);
    };

    form.addEventListener('pointerdown', function (e) {
      pointerPick = !!e.target.closest('.option');
    });

    form.addEventListener('change', function (e) {
      var input = e.target;
      var step = input.closest('[data-step]');
      if (!input.closest('.option')) return;
      if (input.type === 'checkbox' && input.checked) {
        var exclusive = input.hasAttribute('data-exclusive');
        step.querySelectorAll('.options input').forEach(function (other) {
          if (other !== input && (exclusive || other.hasAttribute('data-exclusive'))) other.checked = false;
        });
      }
      syncChecked(step);
      stepError(step, '');
    });

    // Одиночный выбор мышью или пальцем — сразу следующий вопрос; с клавиатуры — по кнопке «Дальше»
    form.addEventListener('click', function (e) {
      var input = e.target;
      if (input.type !== 'radio' || !input.closest('.option')) return;
      if (!pointerPick) return;
      pointerPick = false;
      var from = current;
      window.setTimeout(function () { if (current === from) next(); }, reduceMotion.matches ? 0 : 260);
    });

    form.querySelectorAll('[data-next]').forEach(function (btn) { btn.addEventListener('click', next); });
    form.querySelectorAll('[data-back]').forEach(function (btn) {
      btn.addEventListener('click', function () { if (current > 0) show(current - 1, -1); });
    });

    var valueOf = function (name) {
      var picked = Array.prototype.slice.call(form.querySelectorAll('[name="' + name + '"]:checked'))
        .map(function (i) { return i.value; });
      return picked.join(', ');
    };

    var restart = function () {
      resetForm(form);
      steps.forEach(function (s) { syncChecked(s); stepError(s, ''); s.hidden = true; });
      thanks.hidden = true;
      thanks.innerHTML = '';
      form.hidden = false;
      progressWrap.hidden = false;
      current = 0;
      show(0, 1);
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateContact(steps[steps.length - 1])) return;
      var rows = [
        ['Форма', 'Квиз «Подбор системы»'],
        ['Что не так с водой', valueOf('problems')],
        ['Сколько человек в доме', valueOf('people')],
        ['Откуда вода', valueOf('source')],
        ['Анализ воды', valueOf('analysis')],
        ['Телефон', form.querySelector('[data-phone]').value],
        ['Способ связи', valueOf('contact')],
        ['Согласие на обработку данных', 'да']
      ];
      form.hidden = true;
      progressWrap.hidden = true;
      renderThanks(thanks, rows, restart);
    });

    updateProgress();
  }

  /* ---------- Короткая форма «Спросите инженера» ---------- */
  var askForm = document.querySelector('[data-ask-form]');
  if (askForm) {
    var askThanks = askForm.parentNode.querySelector('[data-thanks]');
    askForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateContact(askForm)) return;
      var rows = [
        ['Форма', '«Спросите инженера»'],
        ['Телефон', askForm.querySelector('[data-phone]').value],
        ['Способ связи', askForm.querySelector('[name="contact"]:checked').value],
        ['Согласие на обработку данных', 'да']
      ];
      askForm.hidden = true;
      renderThanks(askThanks, rows, function () {
        resetForm(askForm);
        askThanks.hidden = true;
        askThanks.innerHTML = '';
        askForm.hidden = false;
        askForm.querySelector('[data-phone]').focus();
      });
    });
  }

  /* ---------- Карусели: палец на телефоне, стрелки на компьютере ---------- */
  document.querySelectorAll('[data-carousel]').forEach(function (carousel) {
    var track = carousel.querySelector('.carousel__track');
    var prev = carousel.querySelector('[data-prev]');
    var nextBtn = carousel.querySelector('[data-next-slide]');
    var stepSize = function () {
      var item = track.querySelector('.carousel__item');
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      var perView = Math.max(1, Math.floor((track.clientWidth + gap) / (item.offsetWidth + gap)));
      return perView * (item.offsetWidth + gap);
    };
    var update = function () {
      prev.disabled = track.scrollLeft <= 4;
      nextBtn.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    };
    prev.addEventListener('click', function () { track.scrollBy({ left: -stepSize(), behavior: scrollBehavior() }); });
    nextBtn.addEventListener('click', function () { track.scrollBy({ left: stepSize(), behavior: scrollBehavior() }); });
    var ticking = false;
    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { update(); ticking = false; });
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ---------- Просмотр фото крупно ---------- */
  var lightbox = document.querySelector('[data-lightbox]');
  if (lightbox && typeof lightbox.showModal === 'function') {
    var lbImg = lightbox.querySelector('[data-lb-img]');
    var lbCounter = lightbox.querySelector('[data-lb-counter]');
    var lbStage = lightbox.querySelector('[data-lb-stage]');
    var items = [];
    var index = 0;
    var opener = null;

    var render = function () {
      var item = items[index];
      lbImg.classList.add('is-loading');
      lbImg.onload = function () { lbImg.classList.remove('is-loading'); };
      lbImg.src = item.src;
      lbImg.alt = item.alt;
      lbCounter.textContent = (index + 1) + ' / ' + items.length;
      [index - 1, index + 1].forEach(function (i) {
        if (items[i]) { var pre = new Image(); pre.src = items[i].src; }
      });
    };
    var go = function (delta) {
      index = (index + delta + items.length) % items.length;
      render();
    };

    document.querySelectorAll('[data-gallery]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var group = btn.getAttribute('data-gallery');
        var all = Array.prototype.slice.call(document.querySelectorAll('[data-gallery="' + group + '"]'));
        items = all.map(function (b) { return { src: b.getAttribute('data-full'), alt: b.querySelector('img').alt }; });
        index = all.indexOf(btn);
        opener = btn;
        render();
        document.documentElement.classList.add('no-scroll');
        lightbox.showModal();
      });
    });

    lightbox.querySelector('[data-lb-prev]').addEventListener('click', function () { go(-1); });
    lightbox.querySelector('[data-lb-next]').addEventListener('click', function () { go(1); });
    lightbox.querySelector('[data-lb-close]').addEventListener('click', function () { lightbox.close(); });
    lbStage.addEventListener('click', function (e) { if (e.target === lbStage) lightbox.close(); });
    lightbox.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    });
    lightbox.addEventListener('close', function () {
      document.documentElement.classList.remove('no-scroll');
      if (opener) opener.focus({ preventScroll: true });
    });

    var touchX = null;
    var touchY = null;
    lbStage.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { touchX = null; return; }
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
    }, { passive: true });
    lbStage.addEventListener('touchend', function (e) {
      if (touchX === null || (window.visualViewport && window.visualViewport.scale > 1.05)) return;
      var dx = e.changedTouches[0].clientX - touchX;
      var dy = e.changedTouches[0].clientY - touchY;
      touchX = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ---------- Липкая кнопка на телефоне ---------- */
  var sticky = document.querySelector('[data-sticky]');
  var heroCta = document.querySelector('[data-hero-cta]');
  if (sticky && heroCta && 'IntersectionObserver' in window) {
    var visible = new Map();
    var watched = [heroCta, document.getElementById('quiz'), document.getElementById('ask')];
    var setSticky = function () {
      var hide = watched.some(function (el) { return visible.get(el); });
      sticky.classList.toggle('is-visible', !hide);
      sticky.setAttribute('aria-hidden', hide ? 'true' : 'false');
      sticky.querySelectorAll('a').forEach(function (a) { a.tabIndex = hide ? -1 : 0; });
    };
    var stickyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible.set(entry.target, entry.isIntersecting); });
      setSticky();
    });
    watched.forEach(function (el) { if (el) stickyObserver.observe(el); });
  }
})();
