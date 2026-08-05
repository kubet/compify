export const spotmap = [
    {
        "color": "hsl(260, 98%, 40%)",
        "size": 300,
        "initialPosition": {
            "x": "29.5%",
            "y": "34.9%"
        }
    },
    {
        "color": "hsl(444, 97%, 44%)",
        "size": 300,
        "initialPosition": {
            "x": "26.8%",
            "y": "33.9%"
        }
    },
    {
        "color": "hsl(264, 94%, 54%)",
        "size": 400,
        "initialPosition": {
            "x": "20.4%",
            "y": "33.2%"
        }
    },
    {
        "color": "hsl(270, 93%, 73%)",
        "size": 200,
        "initialPosition": {
            "x": "20.4%",
            "y": "34.0%"
        }
    }
];
// const generateCluster = useCallback((count, centerX, centerY, radius) => {
//     return Array.from({ length: count }, (_, i) => {
//         const angle = Math.random() * 2 * Math.PI;

//         // Non-linear distance distribution, more points towards the center
//         const distance = radius * (Math.random() ** 3); // Power law for tighter clustering near center

//         // Organic, slightly varying hue range
//         const baseHue = 240 + Math.sin(i) * 20;
//         const hueVariation = Math.random() * 30 - 15; // More controlled, natural variation
//         const hue = baseHue + hueVariation;

//         // Subtle size variation with more significant control
//         const baseSize = 100 + Math.sin(i) * 50; // Varies base size slightly across iterations
//         const sizeVariation = Math.random() ** 0.8 * 100; // Exponential for smaller variations
//         const size = baseSize + sizeVariation + 40;

//         const val = {
//             color: `hsl(${hue}, ${90 + Math.random() * 10}%, ${50 + Math.random() * 20}%)`,
//             size: size,
//             initialPosition: {
//                 x: `${centerX + distance * Math.cos(angle)}%`,
//                 y: `${centerY + distance * Math.sin(angle)}%`,
//             },
//         }
//         console.log(val)
//         return val;
//     });
// }, []);

// const spots = useMemo(() => [
//     ...generateCluster(3, 40, 37, 33), // Cluster in top-left
//     ...generateCluster(2, 40, 34, 50), // Cluster in bottom-right
// ], [generateCluster]);