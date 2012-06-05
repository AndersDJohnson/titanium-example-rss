_ = require("lib/underscore.js")

UI = require("ui.js")
console.log 'UI:', UI

Data = require("data.js")
console.log 'Data:', Data
Data.getRSS (data) ->
	console.log data
	UI.components['tableView1'].setData(data)
	UI.components['win1'].remove(UI.components['label1'])
