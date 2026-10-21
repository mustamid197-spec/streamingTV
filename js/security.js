/**
 * KusoTV Security Module
 * Anti Right-Click, Anti Inspect Element, Anti Keyboard Shortcuts, Selection & Drag Protection
 */
(function () {
    'use strict';

    // 1. Disable Right-Click Context Menu
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        return false;
    }, true);

    // 2. Disable Text / Image Selection (except input & textarea)
    document.addEventListener('selectstart', function (e) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
            return true;
        }
        e.preventDefault();
        return false;
    }, true);

    // 3. Disable Dragging of Images and Links
    document.addEventListener('dragstart', function (e) {
        e.preventDefault();
        return false;
    }, true);

    // 4. Block Developer Tools & Source Inspection Shortcuts
    window.addEventListener('keydown', function (e) {
        // F12
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        const isCtrlOrCmd = e.ctrlKey || e.metaKey;
        const key = (e.key || '').toUpperCase();
        const code = e.keyCode || e.which;

        // Ctrl + Shift + [I, J, C, K, E, S] (Inspect, Console, Inspector, Firefox dev tools)
        if (isCtrlOrCmd && e.shiftKey) {
            if (key === 'I' || key === 'J' || key === 'C' || key === 'K' || key === 'E' || key === 'S' ||
                code === 73 || code === 74 || code === 67 || code === 75 || code === 69 || code === 83) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }

        // Ctrl + [U, S, P] (View Source, Save Page, Print)
        if (isCtrlOrCmd && !e.shiftKey) {
            if (key === 'U' || key === 'S' || key === 'P' ||
                code === 85 || code === 83 || code === 80) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }
    }, true);

    // 5. Periodic Console Cleaner to deter inspection log reading
    setInterval(function () {
        try {
            console.clear();
        } catch (_) {}
    }, 2000);

})();
