/* ================================================================
   TiTaN — New Feature JavaScript
   Support Center, Notification Center, Smart Refresh
   ================================================================ */

(function() {
  'use strict';

  // ── Check if we're on the dashboard ──────────────────────────
  const isDashboard = document.getElementById('supportBtn') !== null;
  const isSubscription = document.getElementById('refreshBtn') !== null;

  // ── Support Center (Dashboard) ──────────────────────────────
  if (isDashboard) {
    const supportBtn = document.getElementById('supportBtn');
    const supportOverlay = document.createElement('div');
    supportOverlay.className = 'glass-panel-overlay';
    supportOverlay.setAttribute('role', 'dialog');
    supportOverlay.setAttribute('aria-label', 'پشتیبانی');
    supportOverlay.innerHTML =
      '<div class="glass-panel-backdrop"></div>' +
      '<div class="glass-panel">' +
        '<div class="glass-panel-header">' +
          '<div class="glass-panel-title" data-i18n="support_center_title">پشتیبانی</div>' +
          '<button class="glass-panel-close" aria-label="بستن" data-i18n-aria="close">' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="glass-panel-body">' +
          '<div class="support-item">' +
            '<div class="support-icon">' +
              '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92 11.08 18a1.94 1.94 0 0 1-2.78-.8 1.94 1.94 0 0 1 0-2.88 4.68 4.68 0 0 1 4.65-3.84c1.87-.3 3.39 1.37 2.71 3.2a4.67 4.67 0 0 1-3.8 2.71 4.67 4.67 0 0 1-3.2 0 4.66 4.66 0 0 1-2.72-3.2 4.65 4.65 0 0 1 3.84-4.65c.3-.91-1.12-1.48-2-1.48a4.66 4.66 0 0 1-3.21 2.72 4.66 4.66 0 0 1-2.72-2.72 4.66 4.66 0 0 1 2.72-3.21 4.66 4.66 0 0 1 3.21-2.72c.91-.3 1.48 1.12 1.48 2a4.66 4.66 0 0 1-4.66 4.66 4.66 4.66 0 0 1-4.66-4.66c0-1.12 1.48-1.48 2-1.48a4.67 4.67 0 0 1 3.2 2.71 4.65 4.65 0 0 1-3.84 4.65c-.3.91 1.12 1.48 2 1.48a4.66 4.66 0 0 1 3.21-2.72 4.66 4.66 0 0 1 2.72 2.72 4.66 4.66 0 0 1-2.72 3.21 4.67 4.67 0 0 1-3.2 0 4.66 4.66 0 0 1-3.8-2.71 4.7 4.7 0 0 1 .94-3.2z"/></svg>' +
            '</div>' +
            '<div class="support-content">' +
              '<div class="support-item-title" data-i18n="support_email">پشتیبانی ایمیل</div>' +
              '<div class="support-item-text" data-i18n="support_email_desc">팀이 respond 하는 데 최대 24시간이 소요될 수 있습니다</div>' +
              '<a href="mailto:support@titann.example" class="support-link" target="_blank" rel="noopener" data-i18n="support_email_link">support@titann.example</a>' +
            '</div>' +
          '</div>' +
          '<div class="support-item">' +
            '<div class="support-icon">' +
              '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2c6 0 8 4.5 8 11.8z"/><path d="M12 22c3.5-2.5 5-6.5 5-11.8A5 5 0 0 0 12 2c-3.5 2.5-5 6.5-5 11.8z"/></svg>' +
            '</div>' +
            '<div class="support-content">' +
              '<div class="support-item-title" data-i18n="support_status">وضعیت سرویس</div>' +
              '<div class="support-item-text" data-i18n="support_status_desc">시스템 상태를 실시간으로 확인하세요</div>' +
              '<a href="/status" class="support-link" target="_blank" rel="noopener" data-i18n="support_status_link">현황 보기</a>' +
            '</div>' +
          '</div>' +
          '<div class="support-item">' +
            '<div class="support-icon">' +
              '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' +
            '</div>' +
            '<div class="support-content">' +
              '<div class="support-item-title" data-i18n="support_docs">مستندات</div>' +
              '<div class="support-item-text" data-i18n="support_docs_desc">설치, 설정, 문제 해결에 대한 문서</div>' +
              '<a href="/docs" class="support-link" target="_blank" rel="noopener" data-i18n="support_docs_link">문서 보기</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(supportOverlay);

    // Support panel toggle
    supportBtn.addEventListener('click', function() {
      supportOverlay.classList.toggle('active');
      if (supportOverlay.classList.contains('active')) {
        // Focus on close button for accessibility
        setTimeout(function() {
          const closeBtn = supportOverlay.querySelector('.glass-panel-close');
          if (closeBtn) closeBtn.focus();
        }, 100);
      }
    });

    // Close on backdrop click
    supportOverlay.addEventListener('click', function(e) {
      if (e.target === supportOverlay || e.target.closest('.glass-panel-close')) {
        supportOverlay.classList.remove('active');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && supportOverlay.classList.contains('active')) {
        supportOverlay.classList.remove('active');
      }
    });
  }

  // ── Notification Center (Dashboard) ─────────────────────────
  if (isDashboard) {
    const notifBtn = document.getElementById('notifBtn');
    const notifBadge = document.getElementById('notifBadge');
    const notifOverlay = document.createElement('div');
    notifOverlay.className = 'glass-panel-overlay';
    notifOverlay.setAttribute('role', 'dialog');
    notifOverlay.setAttribute('aria-label', 'مرکز اعلان‌ها');
    notifOverlay.innerHTML =
      '<div class="glass-panel-backdrop"></div>' +
      '<div class="glass-panel">' +
        '<div class="glass-panel-header">' +
          '<div class="glass-panel-title" data-i18n="notification_center_title">مرکز اعلان‌ها</div>' +
          '<div style="display:flex;gap:8px">' +
            '<button class="glass-panel-close" aria-label="بستن" data-i18n-aria="close">' +
              '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="glass-panel-body" id="notifBody">' +
          '<div class="notification-empty">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68c-2.36.72-4 3.28-4 6.32v5l-2 2v1h16v-1l-2-2z"/></svg>' +
            '<div data-i18n="notification_no_items">اعلانی وجود ندارد</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(notifOverlay);

    // Notification button toggle
    notifBtn.addEventListener('click', function() {
      notifOverlay.classList.toggle('active');
      if (notifOverlay.classList.contains('active')) {
        setTimeout(function() {
          const closeBtn = notifOverlay.querySelector('.glass-panel-close');
          if (closeBtn) closeBtn.focus();
        }, 100);
      } else {
        updateNotifBadge();
      }
    });

    // Close on backdrop click
    notifOverlay.addEventListener('click', function(e) {
      if (e.target === notifOverlay || e.target.closest('.glass-panel-close')) {
        notifOverlay.classList.remove('active');
        updateNotifBadge();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && notifOverlay.classList.contains('active')) {
        notifOverlay.classList.remove('active');
        updateNotifBadge();
      }
    });
  }

  // ── Smart Refresh (Dashboard & Subscription) ────────────────
  function initSmartRefresh(btnId, iconId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const icon = document.getElementById(iconId);

    btn.addEventListener('click', async function() {
      // Add loading state
      btn.classList.add('loading');
      if (icon) icon.classList.add('loading');

      try {
        // Call API endpoints to refresh data
        const endpoints = [
          '/api/stats',
          '/api/events?limit=10',
          '/api/users',
          '/api/nodes'
        ];

        // Perform refresh requests
        const results = await Promise.allSettled(
          endpoints.map(endpoint =>
            fetch(endpoint, { credentials: 'include', cache: 'no-store' })
              .then(response => response.json())
              .catch(() => null)
          )
        );

        // Check if any requests succeeded
        const hasSuccess = results.some(r => r.status === 'fulfilled' && r.value !== null);

        // Remove loading state
        btn.classList.remove('loading');
        if (icon) icon.classList.remove('loading');

        if (hasSuccess) {
          // Success state
          btn.classList.add('success');
          if (icon) icon.classList.add('success');
          setTimeout(function() {
            btn.classList.remove('success');
            if (icon) icon.classList.remove('success');
          }, 2000);

          // Show browser notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(I18N ? I18N.t('smart_refresh_success') : 'اطلاعات بروزرسانی شد');
          }
        } else {
          // Error state
          btn.classList.add('error');
          if (icon) icon.classList.add('error');
          setTimeout(function() {
            btn.classList.remove('error');
            if (icon) icon.classList.remove('error');
          }, 2000);
        }
      } catch (error) {
        // Remove loading state on error
        btn.classList.remove('loading');
        if (icon) icon.classList.remove('loading');
        btn.classList.add('error');
        if (icon) icon.classList.add('error');
        setTimeout(function() {
          btn.classList.remove('error');
          if (icon) icon.classList.remove('error');
        }, 2000);
      }
    });
  }

  if (isDashboard) {
    initSmartRefresh('refreshBtn', 'refreshIcon');
  }
  if (isSubscription) {
    initSmartRefresh('refreshBtn', 'refreshIcon');
  }

  // ── Notification Badge Management ───────────────────────────
  function updateNotifBadge() {
    if (!isDashboard || !notifBadge) return;

    // In production, this would fetch from API
    // For now, show/hide based on whether there are notifications
    const hasNotifications = false; // Will be replaced with actual API call
    if (hasNotifications) {
      notifBadge.style.display = 'block';
      notifBadge.textContent = '1'; // Simplified - would show actual count
    } else {
      notifBadge.style.display = 'none';
    }
  }

  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    // Don't auto-request - user will see prompt when needed
  }

})();
