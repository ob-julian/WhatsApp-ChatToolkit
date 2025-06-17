
const qrcode = require('qrcode-terminal');

module.exports = {
    event: 'qr',
    handler:  (qr, client, config) => {
        if (qrCodeTries === 0) {
                console.log('QR Code received, generating terminal QR code...');
                console.log('Security Note: Do not share this QR code with anyone.');
                console.log('Only scan this QR code if you trust this project.');
                console.log('If you suspect suspicious activity, untrust this session in WhatsApp.');
            } else {
                console.log('New QR Code received, generating terminal QR code...');
            }
            qrCodeTries++;
            qrcode.generate(qr, { small: true });
    }
};
const qrCodeTries = 0;