const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config', 'servers.json');

class Config {
    constructor() {
        this._load();
    }

    _load() {
        try {
            const data = fs.readFileSync(configPath, 'utf8');
            const parsed = JSON.parse(data);
            Object.assign(this, parsed);
        } catch (e) {
            console.error('Could not load config:', e);
        }
    }

    save() {
        // Only save own properties, not methods
        const data = {};
        for (const key of Object.keys(this)) {
            if (!key.startsWith('_')) {
                data[key] = this[key];
            }
        }
        fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
        console.log('Configuration saved to config file.');
    }

    reload() {
        // Remove all current properties except methods
        for (const key of Object.keys(this)) {
            if (!key.startsWith('_')) {
                delete this[key];
            }
        }
        this._load();
    }

    set(key, value) {
        this[key] = value;
        this.save();
    }
}

module.exports = new Config();