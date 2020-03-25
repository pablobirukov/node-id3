module.exports = new ID3FrameReader;

const ID3Util = require("./ID3Util");

function ID3FrameReader() {
}

ID3FrameReader.prototype.buildFrame = function(buffer, array) {
    let frame = {};
    let result = [null, buffer.slice(0)];
    for(let spec of array) {
        if(!result[1] || result[1].length === 0) {
            if(spec.optional) {
                continue;
            } else {
                break;
            }
        }
        result = spec.func.call(null, result[1], spec.args || [], frame, frame[spec.encoding]);
        if(spec.dataType) {
            setNestedKey(frame, spec.name, convertDataType(result[0], spec.dataType, frame, frame[spec.encoding]));
        } else {
            setNestedKey(frame, spec.name, result[0]);
        }
    }

    return frame;
};

function convertDataType(buffer, dataType, frame, encoding = 0x00) {
    if(!buffer) return undefined;
    if(!(buffer instanceof Buffer)) return buffer;
    if(buffer.length === 0) return undefined;
    if(dataType === "number") {
        return buffer.readUIntBE();
    } else if (dataType === "string") {
        return ID3Util.bufferToDecodedString(buffer, encoding);
    } else {
        return buffer;
    }
}

function setNestedKey(obj, key, value) {
    key.split(".").reduce((a, b, index, keyPath) => {
        if (typeof a[b] === "undefined" && index !== keyPath.length - 1){
            a[b] = {};
            return a[b];
        }

        if (index === keyPath.length - 1){
            a[b] = value;
            return value;
        } else {
            return a[b];
        }
    }, obj);
}

ID3FrameReader.prototype.staticSize = function(buffer, args) {
    let size = buffer.length;
    if(args && args.length > 0) {
        size = args[0];
    }
    if(buffer.length > size) {
        return [buffer.slice(0, size), buffer.slice(size)];
    } else {
        return [buffer.slice(0), null];
    }
};

ID3FrameReader.prototype.nullTerminated = function(buffer, args, frame, encoding) {
    return ID3Util.splitNullTerminatedBuffer(buffer, encoding || 0x00);
};