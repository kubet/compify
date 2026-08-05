// Hardcoded versions for specific packages
const hardcodedVersions = {
    '@react-three/fiber': '8.9.0',
    'three': '0.148.0',
    '@react-three/drei': '9.4.0'
};

export const fetchLatestVersion = async (pkgName) => {
    if (hardcodedVersions[pkgName]) {
        return hardcodedVersions[pkgName];
    }

    try {
        const response = await fetch(`https://data.jsdelivr.com/v1/package/npm/${pkgName}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        return data.tags?.latest || 'latest';
    } catch (error) {
        console.warn(`Failed to fetch version for ${pkgName}:`, error);
        return 'latest';
    }
};