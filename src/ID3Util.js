module.exports = new ID3Util;

const ENCODINGS = [
    'ISO-8859-1', 'UTF-16', 'UTF-16BE', 'utf8'
];

function ID3Util() {
}

ID3Util.prototype.parseEncodingByte = function(byte) {
    if(byte > -1 && byte < ENCODINGS.length) {
        return ENCODINGS[byte];
    } else {
        return ENCODINGS[0];
    }
};

ID3Util.prototype.createEncodingByte = function(encoding) {
      if(ENCODINGS.indexOf(encoding) !== -1) {
          return ENCODINGS.indexOf(encoding);
      } else {
          return 0x00;
      }
};

/**
 * @return {Buffer}
 */
ID3Util.prototype.encodeSize = function(totalSize) {
    let byte_3 = totalSize & 0x7F;
    let byte_2 = (totalSize >> 7) & 0x7F;
    let byte_1 = (totalSize >> 14) & 0x7F;
    let byte_0 = (totalSize >> 21) & 0x7F;
    return Buffer.from([byte_0, byte_1, byte_2, byte_3]);
};

/**
 * @return {Buffer}
 */
ID3Util.prototype.decodeSize = function(hSize) {
    return Buffer.from([hSize[0] << 21, hSize[1] << 14, hSize[2] << 7, hSize[3]]);
};