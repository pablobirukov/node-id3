module.exports = {};

const ID3Tag = require('./ID3Tag');
const iconv = require('iconv-lite');

const ENCODINGS = [
    'ISO-8859-1', 'UTF-16', 'UTF-16BE', 'utf8'
];

module.exports.encodingByteToString = function(byte) {
    if(byte > -1 && byte < ENCODINGS.length) {
        return ENCODINGS[byte];
    } else {
        return ENCODINGS[0];
    }
};

module.exports.encodingByteFromString = function(encoding) {
      if(ENCODINGS.indexOf(encoding) !== -1) {
          return ENCODINGS.indexOf(encoding);
      } else {
          return 0x00;
      }
};

module.exports.encodingFromStringOrByte = function(encoding) {
    if(ENCODINGS.indexOf(encoding) !== -1) {
        return encoding;
    } else if(encoding > -1 && encoding < ENCODINGS.length) {
        encoding = ENCODINGS[encoding];
    } else {
        encoding = ENCODINGS[0];
    }
    return encoding;
};

/**
 * @return {Buffer}
 */
module.exports.encodeSize = function(totalSize) {
    let byte_3 = totalSize & 0x7F;
    let byte_2 = (totalSize >> 7) & 0x7F;
    let byte_1 = (totalSize >> 14) & 0x7F;
    let byte_0 = (totalSize >> 21) & 0x7F;
    return Buffer.from([byte_0, byte_1, byte_2, byte_3]);
};

/**
 * @return {Buffer}
 */
module.exports.decodeSize = function(hSize) {
    return Buffer.from([hSize[0] << 21, hSize[1] << 14, hSize[2] << 7, hSize[3]]);
};

/**
 * @return {boolean}
 */
module.exports.isValidID3Header = function(buffer) {
    if(buffer.length < 10) {
        return false;
    } else if(buffer.readUIntBE(0, 3) !== 0x494433) {
        return false;
    } else if([0x02, 0x03, 0x04].indexOf(buffer[3]) === -1 || buffer[4] !== 0x00) {
        return false;
    } else if(buffer[6] & 128 === 1 || buffer[7] & 128 === 1 || buffer[8] & 128 === 1 || buffer[9] & 128 === 1) {
        return false;
    }
    return true;
};

module.exports.removeTagFromBuffer = function(buffer) {
    let id3Tag = (new ID3Tag()).loadFrom(buffer);
    if(!id3Tag) return buffer;
    let id3TagIndex = buffer.indexOf(id3Tag.header);
    if(id3TagIndex === -1) return buffer;
    return Buffer.concat([
        buffer.slice(0, id3TagIndex),
        buffer.slice(id3TagIndex + 10 + id3Tag.size)
    ]);
};

module.exports.stringToEncodedBuffer = function(str, encodingByte) {
    return iconv.encode(str, this.encodingFromStringOrByte(encodingByte));
};

module.exports.bufferToDecodedString = function(buffer, encodingByte) {
    return iconv.decode(buffer, this.encodingFromStringOrByte(encodingByte));
};

module.exports.stringToTerminatedBuffer = function(unterminatedString, encodingByte) {
    return this.stringToEncodedBuffer(unterminatedString + "\0", encodingByte);
};

module.exports.splitNullTerminatedBuffer = function(buffer, encodingByte) {
    let splitBuffer;
    if(encodingByte === 0x01 || encodingByte === 0x03) {
        splitBuffer = buffer.toString('hex').split('000000').map((str, i, arr) => Buffer.from(str + ((i + 1 !== arr.length) ? '00' : ''), 'hex'));
        if(splitBuffer.length < 2) {
            splitBuffer = buffer.toString('hex').split('0000').map(str => Buffer.from(str, 'hex'));
        }
    } else {
        splitBuffer = buffer.toString('hex').split('00').map(str => Buffer.from(str, 'hex'));
    }
    return splitBuffer;
};