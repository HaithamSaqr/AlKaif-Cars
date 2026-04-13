// ==========================================
// EL-KAIF CARS - Main JavaScript
// ==========================================

document.addEventListener('DOMContentLoaded', function () {

  // ---- 1. NAVBAR SCROLL EFFECT ----
  (function () {
    var navbar = document.querySelector('.navbar');
    if (!navbar) return;

    function handleScroll() {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  })();


  // ---- 2. MOBILE MENU TOGGLE ----
  (function () {
    var menuToggle = document.querySelector('.menu-toggle');
    var navLinks = document.querySelector('.nav-links');
    if (!menuToggle || !navLinks) return;

    menuToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      menuToggle.classList.toggle('active');
      navLinks.classList.toggle('mobile-open');
    });

    // Close menu when clicking a nav link
    navLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        menuToggle.classList.remove('active');
        navLinks.classList.remove('mobile-open');
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
        menuToggle.classList.remove('active');
        navLinks.classList.remove('mobile-open');
      }
    });
  })();


  // ---- 3. HERO SLIDER ----
  (function () {
    var slides = document.querySelectorAll('.hero-slide');
    var dots = document.querySelectorAll('.hero-dot');
    var prevArrow = document.querySelector('.hero-arrow.prev');
    var nextArrow = document.querySelector('.hero-arrow.next');
    var hero = document.querySelector('.hero');

    if (slides.length === 0) return;

    var currentSlide = 0;
    var slideCount = slides.length;
    var autoplayInterval = null;
    var autoplayDelay = 6000;

    function goToSlide(index) {
      // Wrap around
      if (index < 0) index = slideCount - 1;
      if (index >= slideCount) index = 0;

      slides.forEach(function (slide) { slide.classList.remove('active'); });
      dots.forEach(function (dot) { dot.classList.remove('active'); });

      slides[index].classList.add('active');
      if (dots[index]) dots[index].classList.add('active');

      currentSlide = index;
    }

    function nextSlide() {
      goToSlide(currentSlide + 1);
    }

    function prevSlideAction() {
      goToSlide(currentSlide - 1);
    }

    function startAutoplay() {
      stopAutoplay();
      autoplayInterval = setInterval(nextSlide, autoplayDelay);
    }

    function stopAutoplay() {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
      }
    }

    // Arrow navigation
    if (prevArrow) {
      prevArrow.addEventListener('click', function () {
        prevSlideAction();
        startAutoplay();
      });
    }

    if (nextArrow) {
      nextArrow.addEventListener('click', function () {
        nextSlide();
        startAutoplay();
      });
    }

    // Dot navigation
    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        goToSlide(index);
        startAutoplay();
      });
    });

    // Pause on hover, resume on mouseleave
    if (hero) {
      hero.addEventListener('mouseenter', stopAutoplay);
      hero.addEventListener('mouseleave', startAutoplay);
    }

    // Initialize
    goToSlide(0);
    startAutoplay();
  })();


  // ---- 4. SWIPER INITIALIZATION ----
  (function () {
    var swiperEl = document.querySelector('.mySwiper');
    if (!swiperEl || typeof Swiper === 'undefined') return;

    new Swiper('.mySwiper', {
      slidesPerView: 1,
      spaceBetween: 20,
      loop: true,
      autoplay: {
        delay: 4000,
        disableOnInteraction: false
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev'
      },
      breakpoints: {
        640: {
          slidesPerView: 2
        },
        768: {
          slidesPerView: 3
        },
        1024: {
          slidesPerView: 4
        }
      }
    });
  })();


  // ---- 5. PURCHASE TABS ----
  (function () {
    var tabs = document.querySelectorAll('.purchase-tab');
    var contents = document.querySelectorAll('.tab-content');

    if (tabs.length === 0 || contents.length === 0) return;

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var targetId = this.getAttribute('data-tab');

        // Remove active from all tabs and contents
        tabs.forEach(function (t) { t.classList.remove('active'); });
        contents.forEach(function (c) { c.classList.remove('active'); });

        // Add active to clicked tab and matching content
        this.classList.add('active');
        var targetContent = document.getElementById(targetId);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  })();


  // ---- 6. FILTER SIDEBAR TOGGLES ----
  (function () {
    var filterTitles = document.querySelectorAll('.filter-group-title');
    if (filterTitles.length === 0) return;

    filterTitles.forEach(function (title) {
      title.addEventListener('click', function () {
        this.classList.toggle('collapsed');
        var content = this.nextElementSibling;
        if (content && content.classList.contains('filter-group-content')) {
          if (this.classList.contains('collapsed')) {
            content.style.display = 'none';
          } else {
            content.style.display = '';
          }
        }
      });
    });
  })();


  // ---- 7. SHARE MODAL ----
  (function () {
    var overlay = document.querySelector('.share-modal-overlay');
    if (!overlay) return;

    var closeBtn = overlay.querySelector('.share-modal-close');
    var urlInput = overlay.querySelector('.share-url-input');
    var copyBtn = overlay.querySelector('.copy-url-btn');

    function openModal() {
      if (urlInput) {
        urlInput.value = window.location.href;
      }
      overlay.classList.add('show');
    }

    function closeModal() {
      overlay.classList.remove('show');
    }

    // Open on share button clicks (using event delegation on document)
    document.addEventListener('click', function (e) {
      var shareBtn = e.target.closest('.share-btn');
      var shareAction = e.target.closest('.car-card-action-btn[data-action="share"]');

      if (shareBtn || shareAction) {
        e.preventDefault();
        openModal();
      }
    });

    // Close on overlay click (outside modal)
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        closeModal();
      }
    });

    // Close on close button
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    // Copy URL to clipboard
    if (copyBtn && urlInput) {
      copyBtn.addEventListener('click', function () {
        urlInput.select();
        urlInput.setSelectionRange(0, 99999);

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(urlInput.value).then(function () {
            copyBtn.textContent = 'تم النسخ!';
            setTimeout(function () {
              copyBtn.textContent = 'نسخ';
            }, 2000);
          });
        } else {
          // Fallback
          document.execCommand('copy');
          copyBtn.textContent = 'تم النسخ!';
          setTimeout(function () {
            copyBtn.textContent = 'نسخ';
          }, 2000);
        }
      });
    }

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('show')) {
        closeModal();
      }
    });
  })();


  // ---- 8. SCROLL ANIMATIONS ----
  (function () {
    var animateElements = document.querySelectorAll('.animate-in');
    if (animateElements.length === 0) return;

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
      });

      animateElements.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      // Fallback: show all immediately
      animateElements.forEach(function (el) {
        el.classList.add('visible');
      });
    }
  })();


  // ---- 9. PRICE RANGE SLIDER ----
  (function () {
    var rangeSlider = document.querySelector('.range-slider');
    if (!rangeSlider) return;

    var priceDisplay = document.querySelector('.price-range-display span');

    function formatNumber(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function updatePriceDisplay() {
      if (priceDisplay) {
        priceDisplay.textContent = formatNumber(rangeSlider.value) + ' ريال';
      }
    }

    rangeSlider.addEventListener('input', updatePriceDisplay);
    updatePriceDisplay();
  })();


  // ---- 10. CAR DETAIL GALLERY ----
  (function () {
    var thumbs = document.querySelectorAll('.car-detail-thumb');
    var mainImage = document.querySelector('.car-detail-gallery img');

    if (thumbs.length === 0 || !mainImage) return;

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        var img = this.querySelector('img');
        if (!img) return;

        // Update main image
        mainImage.src = img.src;
        mainImage.alt = img.alt || '';

        // Update active state
        thumbs.forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');
      });
    });
  })();


  // ---- 11. FAVORITES (HEART) TOGGLE ----
  (function () {
    var badge = document.querySelector('.nav-icon-btn .badge');
    var favCount = 0;

    // Count any pre-existing liked items
    var preLiked = document.querySelectorAll('.car-card-action-btn.liked');
    favCount = preLiked.length;
    if (badge) {
      badge.textContent = favCount;
    }

    // Delegate click events for heart buttons
    document.addEventListener('click', function (e) {
      var heartBtn = e.target.closest('.car-card-action-btn[data-action="favorite"]');
      if (!heartBtn) return;

      e.preventDefault();
      heartBtn.classList.toggle('liked');

      if (heartBtn.classList.contains('liked')) {
        favCount++;
      } else {
        favCount = Math.max(0, favCount - 1);
      }

      if (badge) {
        badge.textContent = favCount;
      }
    });
  })();


  // ---- 12. SMOOTH SCROLL ----
  (function () {
    document.addEventListener('click', function (e) {
      var anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      var targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;

      var targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();

      var navbarHeight = 80;
      var targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    });
  })();


  // ---- 13. SEARCH FORM ----
  (function () {
    var searchBar = document.querySelector('.search-bar');
    if (!searchBar) return;

    var searchBtn = searchBar.querySelector('.search-btn');
    if (!searchBtn) return;

    searchBtn.addEventListener('click', function (e) {
      e.preventDefault();

      // Collect search values
      var selects = searchBar.querySelectorAll('select');
      var inputs = searchBar.querySelectorAll('input');
      var hasValue = false;

      selects.forEach(function (select) {
        if (select.value) hasValue = true;
      });
      inputs.forEach(function (input) {
        if (input.value.trim()) hasValue = true;
      });

      if (!hasValue) {
        alert('الرجاء اختيار معايير البحث');
        return;
      }

      // Build query params and redirect to cars page
      var params = new URLSearchParams();
      selects.forEach(function (select) {
        if (select.value && select.name) {
          params.set(select.name, select.value);
        }
      });
      inputs.forEach(function (input) {
        if (input.value.trim() && input.name) {
          params.set(input.name, input.value.trim());
        }
      });

      var queryString = params.toString();
      if (queryString) {
        window.location.href = 'cars.html?' + queryString;
      }
    });
  })();


  // ---- 14. FORM VALIDATION ----
  (function () {
    var forms = document.querySelectorAll('#individualsForm, #corporateForm, .contact-form-box form');
    if (forms.length === 0) return;

    function validateField(field) {
      var value = field.value.trim();
      var isRequired = field.hasAttribute('required');
      var type = field.getAttribute('type');
      var isValid = true;

      // Check required
      if (isRequired && !value) {
        isValid = false;
      }

      // Check email format
      if (type === 'email' && value) {
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          isValid = false;
        }
      }

      // Check select fields
      if (field.tagName === 'SELECT' && isRequired) {
        if (!value || field.selectedIndex === 0) {
          isValid = false;
        }
      }

      // Apply visual feedback
      if (!isValid) {
        field.style.borderColor = '#E31E24';
        field.style.boxShadow = '0 0 0 3px rgba(227, 30, 36, 0.15)';
      } else {
        field.style.borderColor = '';
        field.style.boxShadow = '';
      }

      return isValid;
    }

    // Clear error state on input
    document.addEventListener('input', function (e) {
      if (e.target.matches('input, select, textarea')) {
        e.target.style.borderColor = '';
        e.target.style.boxShadow = '';
      }
    });

    document.addEventListener('change', function (e) {
      if (e.target.matches('select')) {
        e.target.style.borderColor = '';
        e.target.style.boxShadow = '';
      }
    });

    forms.forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        var fields = form.querySelectorAll('input[required], select[required], textarea[required]');
        var allValid = true;
        var firstInvalid = null;

        fields.forEach(function (field) {
          if (!validateField(field)) {
            allValid = false;
            if (!firstInvalid) firstInvalid = field;
          }
        });

        if (!allValid) {
          if (firstInvalid) {
            firstInvalid.focus();
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }

        // Form is valid - show success
        var submitBtn = form.querySelector('.form-submit-btn');
        if (submitBtn) {
          var originalHTML = submitBtn.innerHTML;
          submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> تم الإرسال بنجاح';
          submitBtn.disabled = true;
          submitBtn.style.background = '#28a745';

          setTimeout(function () {
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            submitBtn.style.background = '';
            form.reset();
          }, 3000);
        }
      });
    });
  })();


  // ---- 15. LOAD MORE BUTTON ----
  (function () {
    var loadMoreBtn = document.querySelector('.load-more-btn');
    if (!loadMoreBtn) return;

    loadMoreBtn.addEventListener('click', function () {
      var originalHTML = this.innerHTML;

      // Show spinner
      this.innerHTML = '<div class="spinner" style="margin: 0 auto;"></div>';
      this.disabled = true;
      this.style.pointerEvents = 'none';

      var btn = this;

      setTimeout(function () {
        // Simulate loaded content - hide the button
        btn.innerHTML = originalHTML;
        btn.disabled = false;
        btn.style.pointerEvents = '';

        // Optionally hide the button after "loading"
        var loadMoreContainer = btn.closest('.load-more');
        if (loadMoreContainer) {
          loadMoreContainer.innerHTML = '<p style="color: var(--gray-mid); font-size: 14px;">تم عرض جميع السيارات</p>';
        }
      }, 1500);
    });
  })();


  // ---- 16. URL PARAMS ----
  (function () {
    var params = new URLSearchParams(window.location.search);
    var tabType = params.get('type');

    if (tabType === 'corporate') {
      var corporateTab = document.querySelector('.purchase-tab[data-tab="corporate"]');
      if (corporateTab) {
        corporateTab.click();
      }
    }
  })();

});
