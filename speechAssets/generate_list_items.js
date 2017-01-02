'use strict';

var fs = require('fs');
var config = require('../config');

var iDeviceType = ['iPad', 'iPad 2', 'iPad Air', 'iPad Air 2', 'iPad Mini', 'iPad Mini 2', 'iPad Mini 3', 'iPad Mini 4', 'iPad Pro',
                   'iPhone', 'iPhone 3G', 'iPhone 3GS','iPhone 4', 'iPhone 4s', 'iPhone 5', 'iPhone 5s', 'iPhone 5c', 'iPhone 6', 'iPhone 6 Plus', 'iPhone 6s', 'iPhone 6s Plus', 'iPhone 7', 'iPhone 7 Plus', 
                   'iPod', 'iPod Touch', 
                   'MacBook', 'MacBook Pro', 'MacBook Air'];

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
