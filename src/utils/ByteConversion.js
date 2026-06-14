/**
 * Byte Conversion Utilities
 *
 * Converts bandwidth/storage values to bytes for consistent handling
 * in the 3x-ui API which expects all data limits in bytes internally.
 */

const UNITS = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4
};

/**
 * Convert gigabytes to bytes
 * @param {number} gb - Gigabytes value
 * @returns {number} Value in bytes
 */
function gbToBytes(gb) {
    if (typeof gb !== 'number' || gb < 0) {
        throw new Error(`Invalid GB value: ${gb}. Must be a non-negative number.`);
    }
    return gb * UNITS.GB;
}

/**
 * Convert bytes to gigabytes
 * @param {number} bytes - Bytes value
 * @returns {number} Value in gigabytes
 */
function bytesToGb(bytes) {
    if (typeof bytes !== 'number' || bytes < 0) {
        throw new Error(`Invalid byte value: ${bytes}. Must be a non-negative number.`);
    }
    return bytes / UNITS.GB;
}

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Bytes value
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {string} Formatted string like "1.5 GB"
 */
function formatBytes(bytes, decimals = 2) {
    if (typeof bytes !== 'number' || bytes < 0) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(decimals)} ${units[unitIndex]}`;
}

/**
 * Safely convert totalGB option to bytes with warning for suspiciously small values
 * @param {number|undefined} totalGbValue - The totalGB value from options
 * @returns {number} Value in bytes (0 if undefined/null)
 */
function sanitizeTotalGb(totalGbValue) {
    if (totalGbValue === undefined || totalGbValue === null) {
        return 0;
    }

    if (typeof totalGbValue !== 'number') {
        throw new Error(`Invalid totalGB value: ${totalGbValue}. Must be a number.`);
    }

    // Warn if the value looks suspiciously small (likely a user error)
    if (totalGbValue > 0 && totalGbValue < 1) {
        console.warn(
            '⚠️  WARNING: totalGB is set to ' + totalGbValue + '. ' +
            'This will be converted to ' + gbToBytes(totalGbValue) + ' bytes. ' +
            'If you meant ' + totalGbValue + ' gigabytes, this is correct. ' +
            'If you meant something else, please check your value.'
        );
    }

    return gbToBytes(totalGbValue);
}

/**
 * Process options object to convert all bandwidth-related fields to bytes
 * Converts: totalGB → totalGB (in bytes)
 * @param {Object} options - Options object
 * @returns {Object} New object with converted values
 */
function convertBandwidthFields(options) {
    if (!options || typeof options !== 'object') {
        return options;
    }

    const converted = { ...options };

    // Convert totalGB if present
    if (converted.totalGB !== undefined && converted.totalGB !== null) {
        converted.totalGB = sanitizeTotalGb(converted.totalGB);
    }

    return converted;
}

/**
 * Process array of options objects for bulk operations
 * @param {Array<Object>} optionsArray - Array of option objects
 * @returns {Array<Object>} New array with converted values
 */
function convertBandwidthFieldsBulk(optionsArray) {
    if (!Array.isArray(optionsArray)) {
        return optionsArray;
    }

    return optionsArray.map(convertBandwidthFields);
}

module.exports = {
    gbToBytes,
    bytesToGb,
    formatBytes,
    sanitizeTotalGb,
    convertBandwidthFields,
    convertBandwidthFieldsBulk,
    UNITS
};
