#!/usr/bin/env node
const fs = require('fs');
const zaq = require('zaq');
const url = require('url');
const open = require('opn');
const http = require('http');
const path = require('path');
const https = require('https');
const figlet = require('figlet');
const express = require('express');
const cookieParser = require('cookie-parser');

const LOCAL_IP = '127.0.0.1';

let config = null;

const credentials = {
    key: fs.readFileSync(__dirname + '/ssl/server.key', 'utf8'),
    cert: fs.readFileSync(__dirname + '/ssl/server.crt', 'utf8')
};

function collapseSpaces (text) {
    return text.split(' ')
        .filter(piece => piece)
        .map(piece => piece.trim())
        .join(' ');
}

function scanHostsFile () {
    const hostsFile = fs.readFileSync('/etc/hosts', 'utf-8');

    if (!hostsFile) {
        zaq.info(`Couldn't scan /etc/hosts: please run with "sudo".`);
        process.exit();
    }

    const hostsLines = hostsFile.split('\n')
        .filter(line => line && line[0] !== '#')
        .map(line => line.split('#')[0])
        .map(line => line.split('\t').join(' '))
        .map(line => collapseSpaces(line))
        .map(line => line.split(' '))
        .map(line => ({ source: line[1], destination: line[0] }));

    return hostsLines;
}

function getOriginHost (config) {
    const hostEntries = scanHostsFile();
    return hostEntries.find(entry => entry.source === config.origin);
}

function hostsIsConfigured (config) {
    const originHost = getOriginHost(config);
    return originHost && originHost.destination === LOCAL_IP;
}

function getQueryParams (urlSegment) {
    const output = {};
    if (!urlSegment) return output;

    const queryString = url.parse(urlSegment).query;
    if (!queryString) return output;

    queryString.split('&')
        .map(piece => {
            const [ key, value ] = piece.replace('=', '%_%').split('%_%');
            output[key] = value;
        });
    return output;
}

function maxLength (text, length = 0) {
    return text && length && text.length > length
        ? text.substring(0, length) + '...'
        : text;
}

function createTokenRequestHandler (config) {
    return function handleTokenRedirect (req, res) {
        const reqParams = getQueryParams(req.url);
        const requestUrl = url.parse(req.url);
        const token = reqParams.token
            ? reqParams.token
            : req.cookies.ssoToken;

        const expires = new Date(Date.now() + 10000);

        const landingUrl = [
            'http',
            config.useSSL ? 's' : '',
            '://',
            config.destination,
            req.baseUrl,
            req.path,
            token ? `?ssoToken=${token}` : null
        ].filter(x => x).join('');

        zaq.info(`Redirected to "${landingUrl}"`, { token: maxLength(token, 50) });
        res.cookie('ssoToken', token, { expires });
        res.redirect(landingUrl);
    }
}

function startRedirectServer (config) {
    const onStartCallback = config.onStartup ? config.onStartup : () => null;
    const handleTokenRedirect = createTokenRequestHandler(config);

    const app = express();
    app.use(cookieParser());
    app.get('*', handleTokenRedirect);

    let otherServerHasStarted = false;
    function serverStartedCallback (type, port) {
        return () => {
            zaq.ok(`Redirection ${type} server listening on :${port}`);
            if (!otherServerHasStarted) return otherServerHasStarted = true;
            if (onStartCallback) onStartCallback();
        };
    }

    const httpServer = https.createServer(app);
    const httpsServer = https.createServer(credentials, app);

    try {
        httpServer.listen(80, serverStartedCallback('http', 80));
        httpsServer.listen(443, serverStartedCallback('https', 443));
    } catch (err) {
        zaq.err('Failed to launch servers. Please run with root privileges.');
        process.exit();
        return;
    };
}

function displayAirfieldMasthead () {
    const masthead = figlet.textSync('AIRFIELD', { font: 'Colossal' });
    const lineLength = masthead.split('\n')[0].length;
    zaq.divider();
    console.log('\n' + masthead.substring(0, masthead.length - lineLength * 3));
    zaq.divider();
}

function loadConfig () {
    const configPath = path.join(process.cwd(), 'airfield.config.js');

    return fs.existsSync(configPath)
        ? require(configPath)
        : null;
}

function init () {
    displayAirfieldMasthead();

    const config = loadConfig();

    if (!config) {
        zaq.err('No configuration detected in current directory. Create a configuration saved as "airfield.config.js".');
        return;
    }

    const originHost = getOriginHost(config);
    const configured = hostsIsConfigured(config);

    if (!originHost) {
        zaq.err('/etc/hosts is not properly configured. Please run the following command, at your own risk, then restart your computer.')
        zaq.log(`\n    sudo -i`);
        zaq.log('    # Then, at the sudo command prompt, enter this command:')
        zaq.log(`    echo "${LOCAL_IP} ${config.origin}" >> /etc/hosts; exit;\n`);
        return;
    } else if (originHost && !configured) {
        zaq.warn(`/etc/hosts entry for "${config.origin}" is unusual:`, originHost);
        return;
    } else if (configured) {
        zaq.ok('Hosts file (/etc/hosts) is properly configured:', originHost);
        zaq.info('Starting redirect server. . .');
        startRedirectServer(config);
        return;
    }
}

init();
