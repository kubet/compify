export const doubleHash = (text) => {
    if (!text) return '';
    let hash1 = 0;
    let hash2 = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash1 = ((hash1 << 5) - hash1) + char;
        hash1 = hash1 & hash1;
        hash2 = ((hash2 << 7) - hash2) + char;
        hash2 = hash2 & hash2;
    }
    return `${hash1 >>> 0}${hash2 >>> 0}`;
};

export const generateHashForAllFiles = (files) => {
    return Object.entries(files).reduce((acc, [fileName, fileData]) => {
        if (fileData.hidden !== false) {
            acc[fileName] = doubleHash(fileData.code);
        }
        return acc;
    }, {});
};