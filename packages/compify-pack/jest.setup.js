const { TextDecoder, TextEncoder } = require('node:util');

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;
