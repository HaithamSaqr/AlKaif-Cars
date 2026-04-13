/* ===== Admin Panel JS - El-Kaif Cars Express ===== */
(function () {
  'use strict';

  /* --- Sidebar toggle (mobile) --- */
  const sidebar = document.querySelector('.admin-sidebar');
  const toggleBtn = document.querySelector('.sidebar-toggle');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', function () {
      sidebar.classList.toggle('open');
    });

    document.addEventListener('click', function (e) {
      if (
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !toggleBtn.contains(e.target)
      ) {
        sidebar.classList.remove('open');
      }
    });
  }

  /* --- Auto-dismiss flash messages after 5 seconds --- */
  var flashMessages = document.querySelectorAll('.flash-message');
  flashMessages.forEach(function (msg) {
    setTimeout(function () {
      msg.style.transition = 'opacity .4s ease';
      msg.style.opacity = '0';
      setTimeout(function () {
        if (msg.parentNode) msg.parentNode.removeChild(msg);
      }, 400);
    }, 5000);
  });

  /* --- Image preview on file input change --- */
  var fileInputs = document.querySelectorAll('input[type="file"][data-preview]');
  fileInputs.forEach(function (input) {
    input.addEventListener('change', function () {
      var previewContainer = document.getElementById(input.dataset.preview);
      if (!previewContainer) return;
      previewContainer.innerHTML = '';

      Array.from(input.files).forEach(function (file) {
        if (!file.type.startsWith('image/')) return;
        var reader = new FileReader();
        reader.onload = function (e) {
          var div = document.createElement('div');
          div.className = 'image-preview-item';
          div.innerHTML = '<img src="' + e.target.result + '" alt="preview">';
          previewContainer.appendChild(div);
        };
        reader.readAsDataURL(file);
      });
    });
  });

  /* --- Form submit loading state --- */
  var forms = document.querySelectorAll('form[data-loading]');
  forms.forEach(function (form) {
    form.addEventListener('submit', function () {
      var btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.classList.add('loading');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
      }
    });
  });

  /* --- Client-side table search/filter --- */
  var searchInputs = document.querySelectorAll('.table-search-input');
  searchInputs.forEach(function (input) {
    input.addEventListener('input', function () {
      var query = input.value.toLowerCase().trim();
      var tableId = input.dataset.table;
      var table = document.getElementById(tableId);
      if (!table) return;

      var rows = table.querySelectorAll('tbody tr');
      rows.forEach(function (row) {
        var text = row.textContent.toLowerCase();
        row.style.display = text.indexOf(query) !== -1 ? '' : 'none';
      });
    });
  });

  /* --- Upload area click to trigger file input --- */
  var uploadAreas = document.querySelectorAll('.upload-area[data-input]');
  uploadAreas.forEach(function (area) {
    area.addEventListener('click', function () {
      var input = document.getElementById(area.dataset.input);
      if (input) input.click();
    });
  });
})();
