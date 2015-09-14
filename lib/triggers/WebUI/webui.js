var updateStats;
var updateTriggers;
var socket;

$(document).ready(function(){
	var isSet = function(setting){
		return $('#setting'+setting).is(':checked');
	}
	var getSet = function(setting){
		return $('#setting'+setting).val();
	}
	var success = $('#success');
	var error = $('#error');
	success.hide();
	error.hide();
	$.ajaxSetup({
		xhrFields: {
			withCredentials: true
		}
	});
	var copyRoom = function(event){
		$('.roomfield').val(event.currentTarget.data);
	};
	var copyUser = function(event){
		$('.userfield').val(event.currentTarget.data);
	};
	var post = function(data) {
		$.ajax({
			type: 'POST',
			url: location.href,
			data: data,
			success: displayResult,
			dataType: 'application/json'
		});
	}
	var displayError = function(err) {
			error.innerHTML = err;
			error.show()
			setTimeout(function(){error.hide()},5000);
	}
	var displayResult = function(err, res) {
		if(err || (res && res.body && res.body.error)) {
			displayError(err||res.body.error);
		} else {
			success.innerHTML = 'done';
			success.show();
			setTimeout(function(){success.hide()},5000);
		}
	}
	var send = function(event){
		post({
			type: 'send',
			target: $('#sendTarget').val(),
			message: $('#sendMessage').val()
		});
	}
	var name = function(){
		post({
			type: 'name',
			name: $('#nameName').val()
		});
	}
	var status = function(status){
		post({
			type: 'status',
			status: status
		});
	}
	var targetOnly = function(type) {
		post({
			type: type,
			target: $('#targetOnlyTargets').val()
		});
	}
	var kickban = function(type) {
		post({
			type: type,
			target: $('#kickbanTargets').val(),
			room: $('#kickbanRoom').val()
		});
	}
	var announce = function() {
		post({
			type: 'announce',
			target: $('#announceTarget').val(),
			headline: $('#announceHeadline').val(),
			body: $('#announceBody').val()
		});
	}
	var loadTrigger = function(){
		var options = $('#loadTriggerOptions').val();
		try{options=JSON.parse(options);}catch(err){}
		var options = JSON.stringify(options);
		post({
			type:'loadTrigger',
			name: $('#loadTriggerName').val(),
			trigtype: $('#loadTriggerType').val(),
			options:options
		});
	}
	var unloadTrigger = function(){
		post({
			type:'unloadTrigger',
			name: $('#unloadTriggerName').val(),
		});
	}
	var addIgnore = function(){
		post({
			type:'addIgnore',
			id: $('#ignoreId').val()
		});
	}
	var removeIgnore = function(){
		post({
			type:'removeIgnore',
			id: $('#ignoreId').val()
		});
	}
	$('#nameButton')    .click(name);
	$('#sendButton')    .click(send);
	$('#statusOffline') .click(function(){status(0)});
	$('#statusOnline')  .click(function(){status(1)});
	$('#statusBusy')    .click(function(){status(2)});
	$('#statusAway')    .click(function(){status(3)});
	$('#statusSnooze')  .click(function(){status(4)});
	$('#statusTrade')   .click(function(){status(5)});
	$('#statusPlay')    .click(function(){status(6)});
	$('#joinButton')    .click(function(){targetOnly('join')});
	$('#leaveButton')   .click(function(){targetOnly('leave')});
	$('#lockButton')    .click(function(){targetOnly('lock')});
	$('#unlockButton')  .click(function(){targetOnly('unlock')});
	$('#modButton')     .click(function(){targetOnly('mod')});
	$('#unmodButton')   .click(function(){targetOnly('unmod')});
	$('#kickButton')    .click(function(){kickban('kick')});
	$('#banButton')     .click(function(){kickban('ban')});
	$('#unbanButton')   .click(function(){kickban('unban')});
	$('#announceButton').click(announce);
	$('.roomid').click(copyRoom);
	$('.userid').click(copyUser);
	$('#unloadTriggerButton').click(unloadTrigger);
	$('#loadTriggerButton')  .click(loadTrigger);
	$('#toggleTriggers').click(function(){$('#triggerTable').toggle();});
	$('#addIgnoreButton').click(addIgnore);
	$('#removeIgnoreButton').click(removeIgnore);
	$('#settingShowTriggerOptions').click(function(){$('.TriggerOptions').toggle();});
	socket = io(location.href.replace(location.href.hash,'')+'.ws');
	socket.on('REQUEST', function(log){
		if(isSet('ShowRequests')) {
			prettyLog(log);
		}
	});
	prettyLog = function(log) {
		try {log=JSON.parse(log);}catch(err){};
		if(!isSet('ShowLogs')) {
			return;
		}
		try{log.meta=JSON.parse(log.meta)}catch(err){};
		if(log.meta && Object.keys(log.meta).length===0) {
			delete log.meta;
		}
		if(isSet('PrettyPrint')) {
			console.json(log);
		} else {
			try {
				console[log.level](log); //debug, error, info are built-in.
			} catch(err) {
				console.log(log); //but notice etc aren't.
			}
		}
	}
	socket.on('log', prettyLog);
	socket.on('STATS', function(event) {
		try {var stats = JSON.parse(event);}catch(err){stats=event;}
		processStats(stats);
		prettyLog(stats);
	});
	socket.on('TRIGGERS', function(event) {
		try {var triggers = JSON.parse(event);}catch(err){triggers=event;}
		prettyLog(triggers);
		processTriggers(triggers);
	});
	socket.on('IGNORES',processIgnores);
	socket.on('USERS',processUsers);
	updateTriggers = function(){socket.emit('TRIGGERS',{})};
	updateStats = function(){socket.emit('STATS',{})};
	$('#updateTriggers').click(updateTriggers);
	$('#updateStats').click(updateStats);
	socket.emit('IGNORES');
	if(isSet('UpdateStats')) {
		var statsint = setInterval(updateStats,localStorage.statsInterval||5000);
	} else {
		var statsint = false;
		updateStats();
	}
	if(isSet('UpdateTriggers')) {
		var trigint = setInterval(updateTriggers,localStorage.triggerInterval||300000);
	} else {
		var trigint = false;
		updateTriggers();
	}
});
var _bts = function(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) {
		return '0 Byte';
	}
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};
var formatTime = function(time) {
try{
console.log(time);
	var curtime = time[1] + time[0]*1000000000
	return _nsToStr(Math.floor(curtime/1000000000), true);
}catch(err){
console.log(err.stack);
}
}
var _nsToStr = function(seconds, goagain) {
    var temp = seconds; var next;
    function numberEnding (number) {return (number > 1) ? 's' : '';}

    if(temp > 259200) {
        temp = Math.floor(temp / 86400);
        next = (goagain===true ? _nsToStr(seconds-temp*86400,false) : '');
        return ' ' + temp + ' day' + numberEnding(temp) + next;
    } else if (temp > 10800) {
        temp = Math.floor(temp / 3600);
        next = (goagain===true ? _nsToStr(seconds-temp*3600,false) : '');
        return ' ' + temp + ' hour' + numberEnding(temp) + next;
    } else if (temp > 180) {
        temp = Math.floor(temp / 60);
        next = (goagain===true ? _nsToStr(seconds-temp*60,false) : '');
        return ' ' + temp + ' minute' + numberEnding(temp) + next;
    } else {
        return (goagain===true ? ' less than a minute' : '');
    }
}
var processStats = function(stats) {
	var newstats = {
		Runtime: formatTime(stats['sinceStart']),
		Muted: stats['muted'],
		Platform: stats['platform'],
		Architecture: stats['arch'],
		'Heap (Used)': _bts(stats['heapUsed']),
		'Heap (Total)': _bts(stats['heapTotal']),
		'RSS': _bts(stats['rss']),
		'Bot Version': stats['botVersion']['string'],
		'NodeJS Version': stats['nodeVersion']
	}
	if(stats.sinceLogon  && stats.connected) {
		newstats['Since Logon'] = formatTime(stats.sinceLogon);
		document.getElementById('Stats-SinceLogonRow').className="";
	} else {
		document.getElementById('Stats-SinceLogonRow').className="hidden";
	}
	if(stats.sinceLogoff && !stats.connected) {
		newstats['Since Logoff'] = formatTime(stats.sinceLogoff);
		document.getElementById('Stats-SinceLogoffRow').className="";
	} else {
		document.getElementById('Stats-SinceLogoffRow').className="hidden";
	}
	for(var stat in newstats) {
		var statname = 'Stats-'+stat.replace(/ |\(|\)/g,'');
		console.log('replacing '+statname+' with '+stat);
		var newstat = newstats[stat];
		document.getElementById(statname).textContent=newstat;
	}
}
var processTriggers = function(triggers) {
	console.log(triggers);
	for(var trigger in triggers) {
		var tr = document.createElement('tr');
		var trName = document.createElement('td');
			trName.className='TriggerName';
			trName.textContent=trigger;
		tr.appendChild(trName);
		var trType = document.createElement('td');
			trType.className='TriggerType'
			trType.textContent=triggers[trigger].type;
			trType.click(function(){triggerInfo(triggers[trigger].type)});
		tr.appendChild(trType);
		if(triggers[trigger].options && Object.keys(triggers[trigger].options).length) {
			var tOpts = document.createElement('table');
			tOpts.className='TriggerOptions';
			for (var option in triggers[trigger].options) {
				var optRow = document.createElement('tr');
				var optCell = document.createElement('td');
				optCell.textContent = option;
				optRow.appendChild(optCell);
				optCell = document.createElement('td');
				optCell.textContent = JSON.stringify(triggers[trigger].options[option]);
				optRow.appendChild(optCell);
				tOpts.appendChild(optRow);
			}
			tr.appendChild(tOpts);
		}
		document.getElementById('TriggerTableBody').appendChild(tr);
//		console.log(tr);
	}
//	document.getElementById('triggerList').appendChild(tr);
}
var processIgnores = function(ignores) {
	document.getElementById('ignores')
		.innerHTML=prettyPrint(JSON.parse(ignores)).innerHTML
		.replace(/>Array(.+)?</,'>Ignores<');
}
var processChats = function(chats) {
	console.log(chats);
	var chats = JSON.parse(chats);
	var groupTable = document.getElementById('groupColumn');
	for(var chat in chats) {
		console.log(chats[chat]);
		var row = document.createElement('tr');
		var group = document.createElement('td')
		group.id='groupname-'+chat;
		$(group).click(function(){$('#users-in-'+chat).toggle()});
		group.textContent='GroupName';
		row.appendChild(group);
		group = document.createElement('td');
		group.textContent=chat; //just the steamid for now, we'll grab group names later.
		$(group).click(function(){$('#users-in-'+chat).toggle()});
		row.appendChild(group);
		groupTable.appendChild(row);

//		group = document.createElement('td');
		var users = document.createElement('table');
		users.id='users-in-'+chat;
		for(var user in chats[chat]) {
			var tr=document.createElement('tr');
			var td=document.createElement('td');
			td.textContent='GroupUserName'; //we'll grab usernames later.
			tr.appendChild(td);

			td = document.createElement('td');
			td.textContent=user;
			td.className='GroupUserID';
			tr.appendChild(td);

			td = document.createElement('td');
			td.textContent=chats[chat][user].rank;
			td.className='GroupUserRank';
			tr.appendChild(td);

			td = document.createElement('td');
			td.textContent=chats[chat][user].permissions; //parse the permissions later, create buttons to kick etc, or maybe just copy the values to the form.
			td.className='GroupUserPerms';
			tr.appendChild(td);

			users.appendChild(tr);
		}
//		group.appendChild(users);
//		group.appendChild(users);
		row.appendChild(users);
		groupTable.appendChild(row);
//		groupTable.appendChild(group);
	}
//	document.getElementById('groups')
//		for(var 
//console.log(chats);
}
var processUsers = processChats;