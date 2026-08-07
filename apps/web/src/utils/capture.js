(function () {
    const MAX_WIDTH = 350;
    const MAX_HEIGHT = 400;
    const WEBP_QUALITY = 0.5;

    class ComponentCapture {
        constructor() {
            this.settings = {};
            this.setupMessageListener();
            this.initStyle();
        }

        getRootElement() {
            const rootSelectors = [
                '.sp-preview-container',
                '#root',
                '#app',
                '[data-svelte]',
                '.angular-root'
            ];

            for (const selector of rootSelectors) {
                const element = document.querySelector(selector);
                if (element) return element;
            }

            return document.body.firstElementChild;
        }

        getTargetElement() {
            const root = this.getRootElement();
            return root?.firstElementChild || null;
        }

        initStyle() {
            if (document.documentElement.dataset.scrollbarInitialized) return;

            const style = document.createElement('style');
            style.textContent = `
                .custom-scrollbar {
                    height: 100%;
                    width: 100%;
                    overflow-y: overlay;
                    overflow-x: hidden;
                    -webkit-overflow-scrolling: touch;
                    position: relative;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                    background-color: transparent;
                    position: absolute;
                    right: 0;
                    z-index: 9999;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background-color: transparent;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(193, 193, 193, 0.5);
                    border-radius: 10px;
                    border: 2px solid transparent;
                    background-clip: padding-box;
                    cursor: pointer;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(168, 168, 168, 0.8);
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:vertical {
                    min-height: 30px;
                }

                /* Firefox */
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(193, 193, 193, 0.5) transparent;
                }
            `;

            document.head.appendChild(style);

            document.documentElement.classList.add('custom-scrollbar');

            document.documentElement.dataset.scrollbarInitialized = 'true';
        }

        calculateScaledDimensions(originalWidth, originalHeight) {
            const isPortrait = originalHeight / originalWidth > MAX_HEIGHT / MAX_WIDTH;
            return isPortrait
                ? {
                    width: Math.round((MAX_HEIGHT / originalHeight) * originalWidth),
                    height: MAX_HEIGHT
                }
                : {
                    width: MAX_WIDTH,
                    height: Math.round((MAX_WIDTH / originalWidth) * originalHeight)
                };
        }


        async getElementImageData(targetElement, root) {
            if (!targetElement || !root) return null;

            const originalStyle = targetElement.getAttribute('style') || '';

            try {
                const canvas = targetElement.querySelector('canvas');
                if (canvas) {
                    const gl = canvas.getContext('webgl', { alpha: true }) ||
                        canvas.getContext('webgl2', { alpha: true });
                    if (gl) {
                        gl.flush();
                    }
                    return canvas.toDataURL('image/png', 1.0);
                }

                const zoomLevel = parseFloat(document.documentElement.style.zoom) || 1;
                const rect = targetElement.getBoundingClientRect();
                const rootStyle = window.getComputedStyle(root);
                const targetStyle = window.getComputedStyle(targetElement);

                const rootPaddingLeft = parseFloat(rootStyle.paddingLeft);
                const targetMarginLeft = parseFloat(targetStyle.marginLeft);
                const targetMarginRight = parseFloat(targetStyle.marginRight);

                const actualWidth = rect.width / zoomLevel;
                const actualHeight = rect.height / zoomLevel;

                const { width: targetWidth, height: targetHeight } =
                    this.calculateScaledDimensions(actualWidth, actualHeight);

                const usesMarginPositioning = targetMarginLeft > 0 || targetStyle.marginLeft === 'auto';

                const transform = usesMarginPositioning
                    ? `translate(-${targetElement.offsetLeft - rootPaddingLeft}px) scale(${targetWidth / actualWidth})`
                    : `scale(${targetWidth / actualWidth})`;

                return await htmlToImage.toPng(targetElement, {
                    quality: WEBP_QUALITY,
                    width: targetWidth,
                    height: targetHeight,
                    style: {
                        transform,
                        transformOrigin: 'top left',
                        width: `${actualWidth}px`,
                        height: `${actualHeight}px`,
                        margin: targetStyle.margin,
                        opacity: '1',
                        visibility: 'visible'
                    },
                    // cacheBust: true,
                    // filter: (node) => {
                    //     if (node.nodeName === "IMG") {
                    //         node.src = `https://compify.app/proxy/image?url=${encodeURIComponent(node.src)}`;
                    //     }
                    //     return true;
                    // },
                });
            } finally {
                targetElement.setAttribute('style', originalStyle);
            }
        }

        async captureImage() {
            try {
                const targetElement = this.getTargetElement();
                const root = this.getRootElement();
                const dataUrl = await this.getElementImageData(targetElement, root);

                if (dataUrl) {
                    window.parent.postMessage({ type: 'image-data', dataUrl }, '*');
                }
            } catch (error) {
                console.error('Capture error:', error);
            }
        }


        async captureGif() {
            try {
                const previewElements = Array.from(document.querySelectorAll('[id^="preview-"]'));
                const captures = [];

                // Get random 5 elements or all if less than 5
                const selectedElements = previewElements.length <= 5
                    ? previewElements
                    : this.shuffleArray(previewElements).slice(0, 5);

                for (const element of selectedElements) {
                    const root = this.getRootElement();
                    const dataUrl = await this.getElementImageData(element, root);
                    if (dataUrl) {
                        captures.push(dataUrl);
                    }
                }

                if (captures.length > 0) {
                    window.parent.postMessage({ type: 'gif-data', captures }, '*');
                } else {
                    console.warn('No frames were captured');
                }

                return captures;
            } catch (error) {
                console.error('GIF capture error:', error);
                return [];
            }
        }

        // Helper function to shuffle array (Fisher-Yates algorithm)
        shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        initSettings(settings) {
            if (!settings) return;

            const root = this.getRootElement();

            if (settings.fonts) {
                this.loadGoogleFonts(settings.fonts);
                delete settings.fonts;
            }

            if (settings.backgroundColor) {
                document.body.style.backgroundColor = settings.backgroundColor;
                delete settings.backgroundColor;
            }

            if (settings.zoomLevel) {
                const zoomStyles = {
                    zoom: settings.zoomLevel,
                    height: '100%',
                    width: '100%'
                };
                Object.assign(document.documentElement.style, zoomStyles);
                Object.assign(document.body.style, {
                    height: '100%',
                    width: '100%',
                    margin: '0'
                });
                delete settings.zoomLevel;
            }

            if (settings?.fontFamily?.includes(' ')) {
                settings.fontFamily = `"${settings.fontFamily}"`;
            }

            if (root) {
                Object.assign(root.style, settings);
            }
        }

        generateBatchFontUrl = (fonts) => {
            const baseUrl = 'https://fonts.googleapis.com/css2';
            const familyParams = fonts.map(font => {
                const familyName = encodeURIComponent(font.n).replace(/%20/g, '+');
                return `family=${familyName}${font.e ? ':' + font.e : ''}`;
            }).join('&');
            return `${baseUrl}?${familyParams}&display=swap`;
        };

        loadGoogleFonts(fonts) {
            if (!fonts?.length) {
                const existingFonts = document.querySelectorAll('[data-fonts]');
                existingFonts.forEach(element => element.remove());
                return;
            }

            const href = this.generateBatchFontUrl(fonts);

            const existingFontLink = document.querySelector(`link[href="${href}"]`);
            if (existingFontLink) return;

            const existingFonts = document.querySelectorAll('[data-fonts]');
            existingFonts.forEach(element => element.remove());

            const link = document.createElement('link');
            link.href = href;
            link.rel = 'stylesheet';
            link.crossOrigin = 'anonymous';
            link.dataset.fonts = 'true';
            document.head.appendChild(link);
        }

        setupMessageListener() {
            window.addEventListener('message', ({ data }) => {
                if (data.type === 'get-image') {
                    this.captureImage();
                } else if (data.type === 'get-gif') {
                    this.captureGif();
                } else if (data.type === 'preview-settings') {
                    this.initSettings(data.settings);
                    // this.initUiFrameworks(data.uiFrameworks);
                }
            }, false);

            window.parent.postMessage({ type: 'iframe-ready' }, '*');
        }
    }

    const capture = new ComponentCapture();

    Object.defineProperty(window, 'ComponentCapture', {
        get: () => capture,
        set: (value) => {
            if (typeof value === 'object') {
                capture.initSettings(value.settings);
            } else if (typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    capture.initSettings(parsed.settings);
                } catch (e) {
                    console.error('Invalid settings JSON:', e);
                }
            }
        }
    });
})();