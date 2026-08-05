const getColorFromName = (name) => {
    // Return a default color if name is invalid
    if (!name || typeof name !== 'string') {
        return 'hsl(0, 0%, 50%)'; // Default to gray
    }

    const prettyHues = [
        15,   // Warm orange
        45,   // Yellow-orange
        75,   // Lime green
        105,  // Bright green
        135,  // Teal
        165,  // Cyan
        195,  // Sky blue
        225,  // Royal blue
        255,  // Indigo
        285,  // Purple
        315,  // Magenta
        345   // Pink
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = prettyHues[hash % prettyHues.length];
    const saturation = 70 + (hash % 20);
    const lightness = 45 + (hash % 10);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

export default getColorFromName;
