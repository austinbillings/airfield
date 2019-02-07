# airfield

Redirection proxy for directing remote hosts to local services. Compatible with unix-like systems (macOS, Linux, etc.).

## Installation
```sh
npm install -g airfield
```

## Setup
In any project folder, setup an airfield config file as `airfield.config.js`. Here's a sample:

```
module.exports = {
    origin: 'some-remote-site.com', // capture traffic intended for this domain
    destination: 'localhost:1234', // and push it to this domain instead
    useSSL: false,
    onStartup: () => {
        console.log('it works! :)');
    }
};
```

## Usage
In the project folder where you've got your `airfield.config.js`, simply run `airfield` (although you may need to run `sudo airfield`, depending on how your system's permissions are configured. If so, `airfield` will let you know.).

```
> airfield

-------------------------------------------------------------------------------------------------------------------------------------

       d8888 8888888 8888888b.  8888888888 8888888 8888888888 888      8888888b.
      d88888   888   888   Y88b 888          888   888        888      888  "Y88b
     d88P888   888   888    888 888          888   888        888      888    888
    d88P 888   888   888   d88P 8888888      888   8888888    888      888    888
   d88P  888   888   8888888P"  888          888   888        888      888    888
  d88P   888   888   888 T88b   888          888   888        888      888    888
 d8888888888   888   888  T88b  888          888   888        888      888  .d88P
d88P     888 8888888 888   T88b 888        8888888 8888888888 88888888 8888888P"

-------------------------------------------------------------------------------------------------------------------------------------
 ✓ OK:      Hosts file (/etc/hosts) is properly configured:
 >>>>         {
 ::::           "source": "some-remote-site.com",
 ::::           "destination": "127.0.0.1"
 ::::         }
 → INFO:    Starting redirect server. . .
 ✓ OK:      Redirection http server listening on :80
 ✓ OK:      Redirection https server listening on :443
 ✓ OK:      It works :)
```

## Troubleshooting
|Issue|Possible Fix|
|:--|:--|
|I get a message that says "your hosts file ain't setup right" or something|Follow the instructions given to properly configure your hosts file to handle your desired given hostname. Be sure to restart your computer afterward.|
|I get an error that says "EACCESS", then some cryptic node garbage.|Run the app as root/super user to host on ports below 1024 (including 80 and 443 as needed here).|
|I get an error that says "EADDRINUSE", then some cryptic node garbage.|Make sure there's no other apps running on your port 80 or 443 (the default web ports for http and https, respectively). Google this if you aren't sure how to check.|
|The redirect doesn't complete; I land on a webpage but it says the SSL certificate is invalid.|Add an exception in your browser for the invalid certificate. This is necessary since we need to catch local SSL traffic (at `https://...`).|
|Something else is wrong|Well, [email austin](austin@austinbillings.com) or something.|


## How it works
Once your `/etc/hosts` file is configured properly to treat requests to "example.com" (or whatever) to your local machine (127.0.0.1), `airfield` runs a server at port 80/443, which intercepts the redirected page URL. The token part of the querystring along with the full post-hostname path is passed along to the specified destination host.
