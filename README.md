# Airfield!

Successfully proxy Cobalt token redirects locally, for Macs.

## Setup
1. Install dependencies with `npm install` or `yarn`.
2. In the Airfield directory, run `npm link`. This will tie the `airfield` terminal command to the script.
3. Run `sudo airfield`.

To change the proxied hostname, local destination, or some other details, edit `serverConfig.js` in the `airfield` directly.

## Troubleshooting
|Issue|Possible Fix|
|:--|:--|
|I get a message that says "your hosts file ain't setup right" or something|Follow the instructions given to properly configure your hosts file to handle your desired given hostname. Be sure to restart your computer afterward.|
|I get an error that says "EACCESS", then some cryptic node garbage.|Run the app as root/super user to host on ports below 1024 (including 80 and 443 as needed here).|
|I get an error that says "EADDRINUSE", then some cryptic node garbage.|Make sure there's no other apps running on your port 80 or 443 (the default web ports for http and https, respectively). Google this if you aren't sure how to check.|
|The redirect doesn't complete; I land on a page that looks like "labss.secure.t-mobilemoney.com" but it says the SSL certificate is invalid.|Add an exception in your browser for the invalid certificate. This is necessary since we need to catch local traffic hitting `https://...`.|
|Something else is wrong|Well, slack austin or something.|


## How it works
Once your `/etc/hosts` file is configured properly to treat requests to "example.com" (or whatever) to your local machine (127.0.0.1), `airfield` runs a server at port 80/443, which intercepts the redirected page URL. The token part of the querystring along with the full post-hostname path is passed along to the specified destination host.
