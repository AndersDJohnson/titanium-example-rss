do ->
	name = "stData"
	
	factory = (exports) ->
		
		RSS_URL = "http://www.startribune.com/local/index.rss2"
		
		MONTH_MAP = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 }
		parseDate = (dateString) ->
			dateParts = dateString.split(' ')
			timeParts = dateParts[4].split(':')
			out = MONTH_MAP[dateParts[2].toUpperCase()]
			out += '/' + dateParts[1] + ' '
			out += timeParts[0] + ':' + timeParts[1]
			return out
		
		getElementChild = (element, tagName) ->
			return element?.getElementsByTagName(tagName).item(0)
		
		getElementText = (element) ->
			text = element.textContent
			text ?= element.text
			return text
		
		exports.getRSS = (callback) ->
			xhr = Titanium.Network.createHTTPClient()
			xhr.open('GET', RSS_URL)
			
			xhr.onload = (e) ->
				xml = this.responseXML
				
				items = xml.documentElement.getElementsByTagName("item")
				data = []
				
				for item in items
					dateString = getElementText(getElementChild(item,'date'))
					data.push({
						title: getElementText(getElementChild(item,'title'))
						link: getElementText(getElementChild(item,'link'))
						description: getElementText(getElementChild(item,'description'))
						pubDate: new Date(dateString)
					});
				
				callback(data) if callback?
			
			xhr.onerror = (e) ->
				console.error('error')
				callback() if callback?
			
			xhr.send();
		
	# End factory
	
	# Export differently based on JS environment
	switch true
		when exports?
			factory(exports)
		when global?
			global[name] = {}
			factory(global[name])
		when window?
			window[name] = {}
			factory(window[name])
	

###
Example of the RSS feed XML structure:

<?xml version="1.0" encoding="utf-8"?>
<rss xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:taxo="http://purl.org/rss/1.0/modules/taxonomy/" version="2.0">
<channel>
<title>StarTribune.com | Local News</title>
<link>http://www.startribune.com/local</link>
<description>RSS Feed for Local</description>
<language>en-us</language>
<pubDate>Mon, 04 Jun 2012 20:30:09 GMT</pubDate>
<dc:date>2012-06-04T20:30:09Z</dc:date>
<dc:language>en-us</dc:language>
<item>
<title>Casual Minnesota vetting allowed tutor vendors to slip through</title>
<link>http://www.startribune.com/local/156921365.html</link>
<description>Minnesota's relaxed attitude in regulating the government's tutoring program burdened school districts with questionable companies.</description>
<pubDate>Mon, 04 Jun 2012 20:00:09 GMT</pubDate>
<guid>http://www.startribune.com/local/156921365.html</guid>
<dc:date>2012-06-04T20:00:09Z</dc:date>
</item>
...

###
