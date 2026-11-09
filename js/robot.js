/**
 * 3D Spline Robot Interaction Controller
 * Full-viewport cursor tracking parallax, idle sway, and watermark suppression.
 */
(function initRobotInteraction() {
    var scene = document.getElementById('robot-scene');
    var glow  = document.getElementById('robot-glow');
    if (!scene) return;

    // Current & target transform values (normalized -1 to 1)
    var targetX = 0, targetY = 0;
    var currentX = 0, currentY = 0;
    var isMouseInViewport = false;
    var isVisible = false;
    var idleTime = 0;
    var idleAngle = 0;
    var lastMoveTime = Date.now();
    var isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    var animId = null;

    // Parallax config
    var MAX_TRANSLATE_X = 12;  // px
    var MAX_TRANSLATE_Y = 8;   // px
    var MAX_ROTATE_Y = 4;      // deg
    var MAX_ROTATE_X = 2;      // deg
    var LERP_SPEED = 0.06;     // smoothness (lower = smoother)
    var IDLE_AMPLITUDE = 0.15; // subtle idle sway
    var IDLE_SPEED = 0.0008;   // idle cycle speed

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    // Track mouse across entire viewport
    function onMouseMove(e) {
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      // Normalize to -1..1 (center = 0)
      targetX = (e.clientX / vw) * 2 - 1;
      targetY = (e.clientY / vh) * 2 - 1;
      isMouseInViewport = true;
      lastMoveTime = Date.now();
    }

    function onMouseLeave() {
      isMouseInViewport = false;
      targetX = 0;
      targetY = 0;
    }

    function animate() {
      var now = Date.now();
      var timeSinceMove = now - lastMoveTime;

      // On touch devices or when idle for > 3s, add subtle idle animation
      if (isTouchDevice || (!isMouseInViewport) || timeSinceMove > 3000) {
        idleAngle += IDLE_SPEED * 16; // ~16ms per frame
        var idleSway = Math.sin(idleAngle) * IDLE_AMPLITUDE;
        var idleBob  = Math.cos(idleAngle * 0.7) * IDLE_AMPLITUDE * 0.6;

        if (!isMouseInViewport || isTouchDevice) {
          targetX = idleSway;
          targetY = idleBob;
        } else {
          // Blend idle into cursor tracking when idle > 3s
          var blend = Math.min((timeSinceMove - 3000) / 2000, 0.3);
          targetX = targetX * (1 - blend) + idleSway * blend;
          targetY = targetY * (1 - blend) + idleBob * blend;
        }
      }

      // Smooth interpolation
      currentX = lerp(currentX, targetX, LERP_SPEED);
      currentY = lerp(currentY, targetY, LERP_SPEED);

      // Apply transform: translate + subtle rotation for depth
      var tx = currentX * MAX_TRANSLATE_X;
      var ty = currentY * MAX_TRANSLATE_Y;
      var ry = currentX * MAX_ROTATE_Y;   // yaw follows cursor X
      var rx = -currentY * MAX_ROTATE_X;  // pitch follows cursor Y (inverted)

      scene.style.transform =
        'translate3d(' + tx.toFixed(2) + 'px, ' + ty.toFixed(2) + 'px, 0) ' +
        'rotateY(' + ry.toFixed(2) + 'deg) ' +
        'rotateX(' + rx.toFixed(2) + 'deg)';

      // Shift the ambient glow slightly toward cursor
      if (glow) {
        glow.style.transform =
          'translate3d(' + (currentX * 8).toFixed(1) + '%, ' + (currentY * 5).toFixed(1) + '%, 0)';
      }

      animId = isVisible && !document.hidden ? requestAnimationFrame(animate) : null;
    }

    function startAnimation() {
      if (isVisible && !document.hidden && !animId) {
        animId = requestAnimationFrame(animate);
      }
    }

    function updateVisibility(entries) {
      isVisible = entries[0].isIntersecting;
      if (!isVisible && animId) {
        cancelAnimationFrame(animId);
        animId = null;
      } else {
        startAnimation();
      }
    }

    // Bind events
    if (!isTouchDevice) {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      document.addEventListener('mouseleave', onMouseLeave);
    }

    // Hide "Built with Spline" branding
    var viewer = document.getElementById('spline-robot');
    if (viewer) {
      function nukeSplineBranding() {
        var shadow = viewer.shadowRoot;
        if (!shadow) return;
        // Inject a style element to nuke all branding
        if (!shadow.querySelector('#hide-branding-style')) {
          var s = document.createElement('style');
          s.id = 'hide-branding-style';
          s.textContent = '#logo, a[href*="spline"], div[class*="logo"], div[class*="watermark"], div[class*="brand"] { display:none!important; opacity:0!important; pointer-events:none!important; height:0!important; overflow:hidden!important; }';
          shadow.appendChild(s);
        }
        // Also directly remove matching elements
        shadow.querySelectorAll('#logo, a[href*="spline"], img[alt*="spline" i], img[alt*="logo" i]').forEach(function(el) {
          el.style.display = 'none';
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          el.style.height = '0';
          el.style.overflow = 'hidden';
        });
      }
      function watchBranding() {
        nukeSplineBranding();
        var shadow = viewer.shadowRoot;
        if (shadow) {
          new MutationObserver(nukeSplineBranding).observe(shadow, { childList: true, subtree: true, attributes: true });
        }
      }
      viewer.addEventListener('load', function() {
        watchBranding();
        setTimeout(nukeSplineBranding, 300);
        setTimeout(nukeSplineBranding, 1000);
        setTimeout(nukeSplineBranding, 2500);
        setTimeout(nukeSplineBranding, 5000);
      });
      // Fallback: poll briefly in case load event already fired
      var pollCount = 0;
      var pollId = setInterval(function() {
        nukeSplineBranding();
        if (++pollCount > 20) clearInterval(pollId);
      }, 500);
    }

    var robotContainer = document.getElementById('robot-container');
    var viewer = document.getElementById('spline-robot');
    var splineLoadStarted = false;
    function loadSplineViewer() {
      if (splineLoadStarted || !viewer) return;
      splineLoadStarted = true;
      var script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js';
      script.onload = function() {
        var sceneUrl = viewer.getAttribute('data-scene-url');
        if (sceneUrl) viewer.setAttribute('url', sceneUrl);
      };
      script.onerror = function() {
        console.error('Unable to load the Spline viewer.');
      };
      document.head.appendChild(script);
    }

    if (robotContainer && viewer && 'IntersectionObserver' in window) {
      var splineObserver = new IntersectionObserver(function(entries) {
        if (entries.some(function(entry) { return entry.isIntersecting; })) {
          loadSplineViewer();
          splineObserver.disconnect();
        }
      });
      splineObserver.observe(robotContainer);
    } else {
      loadSplineViewer();
    }

    if ('IntersectionObserver' in window && robotContainer) {
      var visibilityObserver = new IntersectionObserver(updateVisibility);
      visibilityObserver.observe(robotContainer);
    } else {
      isVisible = true;
    }
    document.addEventListener('visibilitychange', startAnimation);
    startAnimation();

    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
      if (animId) cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', startAnimation);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
    });
  })();
