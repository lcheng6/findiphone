'use strict';

var fs = require('fs');
var config = require('../config');

var iDeviceType = ['iPad', 'iPhone', 'iPod', 'MacBook', 'MacBook Pro'];

var listFile = fs.createWriteStream('customSlotTypes/LIST_OF_ITEMS', {
	flags: 'w' // 
});

function create_list_of_items(listFile) {
	iDeviceType.forEach(function(deviceType) {
		listFile.write(deviceType + "\n");
	})
	config.iCloudAccounts.forEach(function(account) {
		console.log(account.NickName);
		iDeviceType.forEach(function(deviceType) {
			listFile.write (account.NickName + ' ' + deviceType + "\n");
		});
		iDeviceType.forEach(function(deviceType) {
			listFile.write (account.NickName + '\'s ' + deviceType + "\n");
		});
	})
}

create_list_of_items(listFile);
