### Titanium RSS Viewer Example ###

A quick demo of a custom RSS feed reader app in Appcelerator Titanium, using compiled CoffeeScript.

Disclaimer: Only tested build as a mobile web app from Titanium Studio using Google Chrome. Not sure about other browser/device support.

## Instructions ##

This is an entire Titanium Studio project, so you should be able to import it.
If not, start a new Titanium project and replace its "Resources" directory with the one here.

Build and run in Titanium Studio.

A tip for testing locally in a web browser with an externally-hosted RSS feed:
Temporarily disable your browser's security policy blocking cross-domain JavaScript XMLHttpRequest's,
since it's likely that the server is blocking your local IP/domain via the Access-Control-Allow-Origin HTTP header.
One way to do that is to launch the Google Chrome / Chromium executable with its "--disable-web-security" flag.
Be careful though, don't use that instance to load any websites that might have content you can't trust (i.e. ads).
