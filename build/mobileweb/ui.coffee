do ->
	name = "stUI"
	
	factory = (exports) ->
		exports.components = components = {}
		
		# this sets the background color of the master UIView (when there are no windows/tab groups on it)
		Titanium.UI.setBackgroundColor('#000');
		
		# create tab group
		tabGroup1 = components['tabGroup1'] = Titanium.UI.createTabGroup();
		
		# create controls tab and root window
		win2 = components['win2'] = Titanium.UI.createWindow({  
			title:'Read',
			backgroundColor:'#fff'
			layout: 'vertical'
		});
		tab2 = components['tab2'] = Titanium.UI.createTab({  
			#icon:'KS_nav_ui.png',
			title:'Read',
			window:win2
		});
		
		label2 = components['label2'] = Titanium.UI.createLabel {
			value : 'No article chosen yet.',
			#height : "100%",
			width : "100%",
			#top : 60,
			#font : {fontSize:24,fontFamily:'Marker Felt', fontWeight:'bold'},
			color : '#000',
			textAlign : 'left',
			#borderWidth : 2,
			#borderColor : '#bbb',
			#borderRadius : 5
		}
		label3 = components['label3'] = Titanium.UI.createLabel {
			value : '...',
			#height : "100%",
			width : "100%",
			#top : 60,
			#font : {fontSize:18,fontFamily:'Marker Felt', fontWeight:'normal'},
			color : '#000',
			textAlign : 'left',
			#borderWidth : 2,
			#borderColor : '#bbb',
			#borderRadius : 5
		}
		
		win2.add(label2)
		win2.add(label3)
		
		# create base UI tab and root window
		win1 = components['win1'] = Titanium.UI.createWindow({  
			title:'Discover',
			backgroundColor:'#fff'
		});
		tab1 = components['tab1'] = Titanium.UI.createTab({  
			#icon:'KS_nav_views.png',
			title:'Discover',
			window:win1
		});
		label1 = components['label1'] = Titanium.UI.createLabel({
			color:'#999',
			text:'loading...',
			font:{fontSize:20,fontFamily:'Helvetica Neue'},
			textAlign:'center',
			width:'auto'
		})
		
		win1.add(label1)
		
		tableView1 = components['tableView1'] = Titanium.UI.createTableView({
			#data: data,
			#style: Titanium.UI.iPhone.TableViewStyle.GROUPED
		});
		tableView1.addEventListener 'click', (e) ->
			console.log 'clicked', e
			# event data
			index = e.index
			section = e.section
			row = e.row
			rowdata = e.rowData
			#unless 'clicked' in section.headerTitle
			#    section.headerTitle = section.headerTitle + ' (clicked)';
			date = rowdata.pubDate
			dateString = date.getMonth() + "/" + date.getDay() + "/" + date.getYear()
			link = '<a target="_blank" href="' + rowdata.link + '">read full</a>'
			label2.setText( rowdata.title )
			label3.setText( dateString + '<br />' + rowdata.description + '<br />' + link )
			tabGroup1.setActiveTab(tab2)
			###
			Titanium.UI.createAlertDialog({
				title: rowdata.title,
				message: dateString + '<br />' + rowdata.description + '<br />' + link
			}).show();
			###
		
		win1.add(tableView1);
		
		#  add tabs
		tabGroup1.addTab(tab1)
		tabGroup1.addTab(tab2)
		
		# open tab group
		tabGroup1.open()
		
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
	
