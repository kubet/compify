import Color from 'color';
const getContrastText = (bgColor) => {
    const bg = Color(bgColor);
    const bgLuminance = bg.luminosity();
    const bgHue = bg.hue();
    const bgSaturation = bg.saturationl();

    // Simplified perceptual brightness
    const perceptualBrightness = Math.sqrt(
        0.299 * bg.red() ** 2 + 0.587 * bg.green() ** 2 + 0.114 * bg.blue() ** 2
    ) / 255;

    // Determine if the background is grayscale
    const isGrayscale = bgSaturation < 5;

    // Generate contrast color
    const generateContrastColor = () => {
        if (isGrayscale) {
            // For grayscale, use black or white
            return perceptualBrightness > 0.5 ? Color('#000000') : Color('#FFFFFF');
        } else {
            // For colored backgrounds, adjust lightness of the same hue
            const contrastLightness = perceptualBrightness > 0.5 ? 10 : 90;
            return Color.hsl(bgHue, bgSaturation, contrastLightness);
        }
    };

    // Adjust contrast
    const adjustContrast = (color) => {
        const getContrastRatio = (c1, c2) => {
            const l1 = c1.luminosity();
            const l2 = c2.luminosity();
            return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        };

        let adjustedColor = color;
        const targetContrast = 4.5;
        const maxIterations = 20;

        for (let i = 0; i < maxIterations; i++) {
            const currentContrast = getContrastRatio(bg, adjustedColor);
            if (currentContrast >= targetContrast) break;

            const adjustment = 0.05 * (perceptualBrightness > 0.5 ? -1 : 1);
            adjustedColor = adjustedColor.lightness(
                Math.max(0, Math.min(100, adjustedColor.lightness() + adjustment * 100))
            );
        }

        return adjustedColor;
    };

    let contrastColor = generateContrastColor();
    contrastColor = adjustContrast(contrastColor);

    return contrastColor.hex();
};

export default getContrastText;