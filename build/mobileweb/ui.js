// Generated by CoffeeScript 1.3.3
(function() {

  (function() {
    var factory, name;
    name = "stUI";
    factory = function(exports) {
      var components, label1, label2, label3, tab1, tab2, tabGroup1, tableView1, win1, win2;
      exports.components = components = {};
      Titanium.UI.setBackgroundColor('#000');
      tabGroup1 = components['tabGroup1'] = Titanium.UI.createTabGroup();
      win2 = components['win2'] = Titanium.UI.createWindow({
        title: 'Read',
        backgroundColor: '#fff',
        layout: 'vertical'
      });
      tab2 = components['tab2'] = Titanium.UI.createTab({
        title: 'Read',
        window: win2
      });
      label2 = components['label2'] = Titanium.UI.createLabel({
        value: 'No article chosen yet.',
        width: "100%",
        color: '#000',
        textAlign: 'left'
      });
      label3 = components['label3'] = Titanium.UI.createLabel({
        value: '...',
        width: "100%",
        color: '#000',
        textAlign: 'left'
      });
      win2.add(label2);
      win2.add(label3);
      win1 = components['win1'] = Titanium.UI.createWindow({
        title: 'Discover',
        backgroundColor: '#fff'
      });
      tab1 = components['tab1'] = Titanium.UI.createTab({
        title: 'Discover',
        window: win1
      });
      label1 = components['label1'] = Titanium.UI.createLabel({
        color: '#999',
        text: 'loading...',
        font: {
          fontSize: 20,
          fontFamily: 'Helvetica Neue'
        },
        textAlign: 'center',
        width: 'auto'
      });
      win1.add(label1);
      tableView1 = components['tableView1'] = Titanium.UI.createTableView({});
      tableView1.addEventListener('click', function(e) {
        var date, dateString, index, link, row, rowdata, section;
        console.log('clicked', e);
        index = e.index;
        section = e.section;
        row = e.row;
        rowdata = e.rowData;
        date = rowdata.pubDate;
        dateString = date.getMonth() + "/" + date.getDay() + "/" + date.getYear();
        link = '<a target="_blank" href="' + rowdata.link + '">read full</a>';
        label2.setText(rowdata.title);
        label3.setText(dateString + '<br />' + rowdata.description + '<br />' + link);
        return tabGroup1.setActiveTab(tab2);
        /*
        			Titanium.UI.createAlertDialog({
        				title: rowdata.title,
        				message: dateString + '<br />' + rowdata.description + '<br />' + link
        			}).show();
        */

      });
      win1.add(tableView1);
      tabGroup1.addTab(tab1);
      tabGroup1.addTab(tab2);
      return tabGroup1.open();
    };
    switch (true) {
      case typeof exports !== "undefined" && exports !== null:
        return factory(exports);
      case typeof global !== "undefined" && global !== null:
        global[name] = {};
        return factory(global[name]);
      case typeof window !== "undefined" && window !== null:
        window[name] = {};
        return factory(window[name]);
    }
  })();

}).call(this);
