
function init() {
    const squares = document.querySelectorAll('.square');
    const clones = {};
    const backButton = document.getElementById('backButton');

    const mainContent = document.getElementById('mainContent');
    const contentIdToSidebar = {};
    const contentIdToContentDiv = {};
    const contentIdToOverlayTitle = {};
    const contentIdToOverlayText = {};

    let lastContentIdChanged = null;
    let clone = null;
    let activeSquare = null;

    function getRect(el) {
        const rect = el.getBoundingClientRect();
        return {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
        };
    }

    function applyStyles(el, styles) {
        for (const key in styles) {
            el.style[key] = styles[key];
        }
    }

    squares.forEach(square => {
        const currentContentId = square.id.substring(0, square.id.length - "Grid".length);

        contentIdToSidebar[currentContentId] = document.getElementById(currentContentId + "Sidebar");
        contentIdToContentDiv[currentContentId] = document.getElementById(currentContentId + "Content");
        contentIdToOverlayTitle[currentContentId] = document.getElementById(currentContentId + "OverlayTitle");
        contentIdToOverlayText[currentContentId] = document.getElementById(currentContentId + "OverlayText");

        // Clone the square
        clone = square.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.margin = '0';
        clone.style.zIndex = '100';
        clone.style.transition = 'all 0.4s ease';
        clone.style.cursor = 'default';
        clone.style.userSelect = 'none';
        clone.style.willChange = 'transform';
        clone.id = currentContentId + 'Background'
        clone.classList.add('fade-text');

        // Hide clone text initially to avoid duplicate text
        clone.style.color = 'transparent';

        // Set clone initial size & position to match original square
        const rect = getRect(square);
        applyStyles(clone, {
            top: rect.top + 'px',
            left: rect.left + 'px',
            width: (rect.width / window.innerWidth) * 100 + "vw",
            height:(rect.height / window.innerHeight) * 100 + "vh",
        });

        clones[currentContentId] = clone;
        clone = null

        // Preloading images
        square.addEventListener("mouseover", () => {
            const img = new Image();
            img.src = '../images/' + currentContentId + '_high_res.jpg';
        });

        square.addEventListener('click', () => {
            // Prevent multiple clicks
            // TODO: Fix race condition
            if (clone) return;
            clone = clones[currentContentId];

            activeSquare = square;

            // Fade out original button text
            square.classList.add('fade-text');

            // Dim other squares
            squares.forEach(sq => {
                if (sq !== square) {
                    sq.classList.add('dimmed');
                }
            });

            // Reset clone initial size & position in case there was a window resize
            const rect = getRect(square);
            applyStyles(clone, {
                top: rect.top + 'px',
                left: rect.left + 'px',
                width: (rect.width / window.innerWidth) * 100 + "vw",
                height:(rect.height / window.innerHeight) * 100 + "vh",
            });

            // Force the animation loop once
            // >>>>>>>>
            // >>>>>>>>
            clone.getBoundingClientRect();
            requestAnimationFrame(() => {
                applyStyles(clone, {
                    top: '0',
                    left: '0',
                    width: '100vw',
                    height: '100vh',
                });
            });
            clone.getBoundingClientRect();
            applyStyles(clone, {
                top: rect.top + 'px',
                left: rect.left + 'px',
                width: (rect.width / window.innerWidth) * 100 + "vw",
                height:(rect.height / window.innerHeight) * 100 + "vh",
            });
            // <<<<<<<<<<<<
            // <<<<<<<<<<<<

            document.body.appendChild(clone);

            // Set content text but keep hidden for now
            contentIdToOverlayTitle[currentContentId].textContent = square.dataset.title;
            contentIdToOverlayText[currentContentId].textContent = square.dataset.text;
            contentIdToContentDiv[currentContentId].classList.remove('visible');
            backButton.classList.remove('visible');

            // Trigger reflow then expand clone to full screen
            clone.getBoundingClientRect();
            requestAnimationFrame(() => {
                applyStyles(clone, {
                    top: '0',
                    left: '0',
                    width: '100vw',
                    height: '100vh',
                });
            });

            setTimeout(() => {
                clone.style.color = '';
                contentIdToContentDiv[currentContentId].classList.add('visible');
                backButton.classList.add('visible');
            }, 100);

            if (contentIdToSidebar[currentContentId].classList.contains('collapsed')) {
                contentIdToSidebar[currentContentId].style.width = "35px";
                mainContent.style.marginLeft = '35px';
            }
            else{
                contentIdToSidebar[currentContentId].style.width = "200px";
                mainContent.style.marginLeft = '200px';
            }
            lastContentIdChanged = currentContentId
        });
    });

    backButton.addEventListener('click', () => {
        if (!clone) return;

        // Fade out content and back button first
        contentIdToContentDiv[lastContentIdChanged].classList.remove('visible');
        backButton.classList.remove('visible');

        // Listen only once for transition end on content opacity
        //content.addEventListener('transitionend', onFadeOutEnd, { once: true });
        setTimeout(() => {
            // Animate clone back to original position & size
            const rect = getRect(activeSquare);
            applyStyles(clone, {
                top: rect.top + 'px',
                left: rect.left + 'px',
                width: rect.width + 'px',
                height: rect.height + 'px',
            });

            // Fade original button text back in
            if (activeSquare) {
                activeSquare.classList.remove('fade-text');
            }

            clone.addEventListener('transitionend', function onCollapseTransitionEnd(e) {
                if (e.propertyName === 'width' || e.propertyName === 'height' || e.propertyName === 'transform') {
                    clone.removeEventListener('transitionend', onCollapseTransitionEnd);
                    clone.remove();
                    clone = null;
                    squares.forEach(sq => sq.classList.remove('dimmed'));
                    activeSquare = null;
                }
            });
            contentIdToSidebar[lastContentIdChanged].style.width = "0px";
            lastContentIdChanged = null;
        }, 50);

    });
}

window.addEventListener('load', () => {requestAnimationFrame(() => {
    document.body.classList.add('loaded');
});
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init(); // DOM is already loaded
}
