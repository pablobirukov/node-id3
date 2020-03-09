module.exports = ID3Frame;

const ID3V2_2_IDENTIFIER_SIZE = 3;
const ID3V2_3_IDENTIFIER_SIZE = 4;
const ID3V2_4_IDENTIFIER_SIZE = 4;

function ID3Frame(id3Tag, identifier, size, body) {
    this.id3Tag = id3Tag;
    this.identifier = identifier;
    this.size = size;
    this.body = body;
}

ID3Frame.prototype.load = function(buffer) {
    if(!buffer || buffer.length < 10 || !this.id3Tag) {
        return null;
    }

    let identifierSize;
    switch(this.id3Tag.version) {
        case 0x02:
            identifierSize = ID3V2_2_IDENTIFIER_SIZE;
            break;
        case 0x03:
            identifierSize = ID3V2_3_IDENTIFIER_SIZE;
            break;
        case 0x04:
            identifierSize = ID3V2_4_IDENTIFIER_SIZE;
            break;
        default:
            return null;
    }

    this.identifier = buffer.slice(0, identifierSize);
    this.size = buffer.readUInt32BE(identifierSize);
    if(buffer.length > 10) {
        this.body = buffer.slice(10, this.size + 10);
    }

    return this;
};