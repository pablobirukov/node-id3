module.exports = new ID3Util;

const ENCODINGS = [
    'ISO-8859-1', 'UTF-16', 'UTF-16BE', 'utf8'
];

function ID3Util() {
}

ID3Util.prototype.parseEncodingByte = function(byte) {
    if(byte && byte < ENCODINGS) {
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