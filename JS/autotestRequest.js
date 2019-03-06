var TEST_RESULT = {"all_test_case_result":[]};
var ALL_LOADED_TEST_CASE = undefined;
var RESTRequest = new Class({
    'Extends': Request,

    'options': {
        url: '',
        data: {},
        headers: {},
        async: true,
        format: false,
        link: 'ignore',
        isSuccess: null,
        emulation: false,
        urlEncoded: false,
        evalScripts: false,
        evalResponse: false,
        noCache: false
    },
	
    'send': function(options) {
        if (!this.check(options)) return this;

        this.options.isSuccess = this.options.isSuccess || this.isSuccess;
        this.running = true;

        var type = typeOf(options);
        if (type == 'string' || type == 'element') options = {data: options};

        var old = this.options;
        options = Object.append({data: old.data, url: old.url, method: old.method}, options);
        var data = options.data, url = String(options.url), method = options.method.toLowerCase();

        switch (typeOf(data)){
            case 'element': data = document.id(data).toQueryString(); break;
            case 'object': case 'hash': data = Object.toQueryString(data);
        }

        if (this.options.format){
            var format = 'format=' + this.options.format;
            data = (data) ? format + '&' + data : format;
        }

        if (this.options.emulation && !['get', 'post'].contains(method)){
            var _method = '_method=' + method;
            data = (data) ? _method + '&' + data : _method;
            method = 'post';
        }

        if (this.options.urlEncoded && ['post', 'put'].contains(method)){
            var encoding = (this.options.encoding) ? '; charset=' + this.options.encoding : '';
            this.headers['Content-type'] = 'application/x-www-form-urlencoded' + encoding;
        }

        if (!url) url = document.location.pathname;

        var trimPosition = url.lastIndexOf('/');
        if (trimPosition > -1 && (trimPosition = url.indexOf('#')) > -1) url = url.substr(0, trimPosition);

        if (this.options.noCache)
            url += (url.contains('?') ? '&' : '?') + String.uniqueID();

        if (data && (method == 'get' || this.options.rawdata != '')){
            url += (url.contains('?') ? '&' : '?') + data;
            data = null;
        }

        var xhr = this.xhr;
        if ('onprogress' in new Browser.Request){
            xhr.onloadstart = this.loadstart.bind(this);
            xhr.onprogress = this.progress.bind(this);
        }

        xhr.open(method.toUpperCase(), url, this.options.async, this.options.user, this.options.password);
        if (this.options.user && 'withCredentials' in xhr) xhr.withCredentials = true;

        xhr.onreadystatechange = this.onStateChange.bind(this);

        Object.each(this.headers, function(value, key){
            try {
                xhr.setRequestHeader(key, value);
            } catch (e){
                this.fireEvent('exception', [key, value]);
            }
        }, this);

        this.fireEvent('request');

        if (this.options.files != undefined)
        {
            files = document.getElement(this.options.files.element);

            upload = new FormData();
            upload.append(this.options.files.name, files.files[0]);

            Object.each(this.options.data, function(value, key) {
                upload.append(key, value);
            });

            xhr.send(upload);
        }
        else if (this.options.rawdata != '')
        {
            xhr.send(this.options.rawdata);
        }
        else
        {
            xhr.send(data);
        }

        if (!this.options.async) this.onStateChange();
        if (this.options.timeout) this.timer = this.timeout.delay(this.options.timeout, this);
        return this;
    },
});

var error = function(message, element) {
    document.id('message').toggleClass('visible').getElement('span').set('text', message);

    var func = function() { document.id('message').toggleClass('visible') }.delay(2000);

    if (element) {
        new Fx.Scroll(document.body).toElement(element);
    }
};


window.addEvent('domready',function(){
	form = document.getElement('form[name=input]');
	//autotest only select id
	document.getElement('input[name=autotest]').addEvent('click',function(e){
		MyLog('Auto Test Clicked');
		if(ALL_LOADED_TEST_CASE){
			var testIds = form.elements['test[id]'].get('value');
			if(testIds){
				document.id('responseText').empty().set('class', '');
				TEST_RESULT = {"all_test_case_result":[]};
				clearAllResponseCode();
				var testIdList = testIds.split(',');
				var testCaseLoaded = ALL_LOADED_TEST_CASE.test_case;
				var server = ALL_LOADED_TEST_CASE.server;
				automationTokenToHeader();
				for(var index = 0 ; index < testIdList.length ; index++){
					for(var i = 0; i < testCaseLoaded.length ; i++){
						if(testIdList[index] == testCaseLoaded[i].testId){
							autoTest(server,testCaseLoaded[i]);
							MyLog('testId: '+testIdList[index] + ';test caseId: '+testCaseLoaded[i].testId);
							break;
						}
					}
				}
			}else{
				alert('Please input Test ID (ex: 1,2,3...)');
			}
		}else{
			alert('Please choose test case file!');
		}
		
		
	});
	//auto test all test id
	document.getElement('input[name=autotestall]').addEvent('click',function(e){
		if(ALL_LOADED_TEST_CASE){
			MyLog('Auto Test Clicked');
			document.id('responseText').empty().set('class', '');
			TEST_RESULT = {"all_test_case_result":[]};
			clearAllResponseCode();
			var testCaseLoaded = ALL_LOADED_TEST_CASE.test_case;
			var server = ALL_LOADED_TEST_CASE.server;
			automationTokenToHeader();
			for(var i = 0; i < testCaseLoaded.length ; i++){
				autoTest(server,testCaseLoaded[i]);
			}
			
		}else{
			alert('Please choose test case file!');
		}
		
		
	});
	//on select test case file
	form.elements['file[data]'].addEvent('change',function(){
		MyLog('file is choose');
		if(form.elements['file[data]'].get('value') != ''){
			var file = form.elements['file[data]'].files[0];
			MyLog('file selected '+file);
			loadTestCase(file);
		}else{
			reset();
			MyLog('no selected file');
		}
	});
	form.elements['file[data]'].addEvent('click',function(){
		form.elements['file[data]'].set('value',null);
		form.elements['file[data]'].fireEvent('change');
	});
	
	// headers params
    document.getElements('li:last-of-type input[name="headers[key][]"], li:last-of-type input[name="headers[value][]"]').addEvent('focus', function() {
        row = this.getParent().clone();
        row.grab(new Element('input', {'type': 'button', 'value': '-', 'events': {'click': function(e) {e.stop(); this.getParent().dispose(); }}}));
        this.getParent().grab(row, 'before');
        row.getElement('input').focus();
    });
	document.getElements('ul li [href="#testID"]').addEvent('click',function(e){
		MyLog(e.href);
	});
	//export result
	document.getElement('input[name=export_result]').addEvent('click',function(e){
		var textResult = "";
		var allTestCaseResult = TEST_RESULT.all_test_case_result;
		if(allTestCaseResult.length > 0){
			for(var i = 0 ; i < allTestCaseResult.length ; i++){
				Object.each(allTestCaseResult[i],function(value,key){
				MyLog(key+value);
				textResult += key + ' : ' + value +'\n';
				})
			}
			exportResult('TestResult.txt',JSON.stringify(allTestCaseResult));
		}else{
			alert('Test case result is empty!');
		}
		
	});
	//clear result
	document.getElement('input[name=clear_result]').addEvent('click',function(e){
		document.id('responseText').empty().set('class', '');
		TEST_RESULT = {"all_test_case_result":[]};
		clearAllResponseCode();
	});
	automationTokenToHeader();
});
var exportResult = function(fileName,text){
	//text = beautify.js(text);
	var textFile = new Blob([text],{tyep:"text/plain;charset=UTF-8"});
	var url = URL.createObjectURL(textFile);
	var a = document.createElement('a');
	a.setAttribute('href',url);
	a.setAttribute('download',fileName);
	a.click();
};

var autoTest = function(server,requestDataJson){
	if(requestDataJson){
		try{
			url = server+requestDataJson.url;
			if(requestDataJson.url && requestDataJson.method){
				//document.id('responseText').empty().set('class', '');
				if (url == '' || !/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(url)){
					error('Please enter a valid URL');
					alert('Invalide URL, Please check in your test case file. Your URL is: '+url);
				}else{
					MyLog(url);
					var options = {
						'url': url,
						'method': requestDataJson.method,
						'encoding': 'UTF-8',
						'timeout': 60 * 1000,
						'rawdata': JSON.stringify(requestDataJson.DataParams),
						'headers': {
							'Accept': requestDataJson.contentType,
							'Content-Type': requestDataJson.contentType + '; charset=UTF-8',
							'Accept-Language':  'en'
						},
						'onProgress': function(event, xhr) {
							if (event.lengthComputable)
							{
								//document.getElement('progress').show().set('value', (event.loaded / event.total) * 100);
							}
						},
						'onTimeout': function() {
							error('Connection Timed-out');
							alert('Connection Timed-out');
							//MyLog('Connection Timed-out');
						},
						'onComplete': function(responseText, responseXML) {
							if (this.xhr.status == 0) {
								alert('Connection Failed! Please check your network connection and make sure that your URL is correct.\n<< '+requestDataJson.testName +' >>\n<< Test ID = '+requestDataJson.testId +' >>\n<< '+options.url +' >>\n\n');
								error('Connection Failed!');
							} 
							else {
								var contentType = this.xhr.getResponseHeader('Content-Type');

								if (contentType != null) {
									var index = contentType.indexOf(';');

									if (index > 1)
									{
										contentType = contentType.slice(0, index);
									}
								}

								var requestText = 'Request URL: {0}\nRequest Method: {1}\n'.substitute([options.url, options.method]);

								// data
								switch (typeOf(this.options.data)) {
									case 'string':
										requestText += 'Params: ' + this.options.data;
										break;

									case 'object':
										requestText += 'Params: ' + JSON.encode(this.options.data)  ;
										break;
								}

								var requestHeaders = '';
								Object.each(options.headers, function(value, key) {
									requestHeaders += key + ': ' + value + "\n";
								});
								MyLog('send requestHeader: \n'+requestHeaders);
								MyLog('send requestText: \n'+requestText);

								switch (contentType)
								{
									case 'application/json':
										responseText = beautify.js(this.xhr.responseText);
										//requestDataJson['result'] = responseText;
										//MyLog(JSON.encode(responseText).api_response_code+'');
										document.id('responseText').appendText('<<<< '+requestDataJson.testName +' >>>>\n');
										document.id('responseText').appendText('<<<< Test ID = '+requestDataJson.testId +' >>>>\n');
										document.id('responseText').appendText('<<<< '+options.url +' >>>>\n\n');
										document.id('responseText').appendText(responseText+'\n\n');
										var testCaseResult = {};
										var response = JSON.parse(responseText);
										testCaseResult['testName'] = requestDataJson.testName;
										testCaseResult['testId'] = requestDataJson.testId;
										testCaseResult['result'] = response;
										TEST_RESULT['all_test_case_result'].push(testCaseResult);
										if(response.response_code){
											requestDataJson['result'] = response.response_code;
											if(response.response_code == 500){
												requestDataJson['result'] = response.response_code+ ', Message: ' + response.message;
											}
											MyLog('have response_code');
										}else if(response.error_code){
											requestDataJson['result'] = response.error_code + ', Message: ' + response.message;
										}
										else{
											requestDataJson['result'] = 'NO response code';
											MyLog('no response_code');
										}
										refreshTestCase();
										break;

									case 'text/xml':
									case 'application/xml':
									case 'application/rss+xml':
									case 'application/atom+xml':
										responseXML = beautify.xml(this.xhr.responseXML);

										var declaration = this.xhr.responseText.match(/^(\s*)(<\?xml.+?\?>)/i);

										document.id('responseText').set('class', 'prettyprint lang-xml').appendChild(responseXML)
										document.id('responseText').appendText(declaration[2] + "\n", 'top');
										break;

									case 'text/html':
										//document.id('responseText').set('class', 'prettyprint lang-html').set('text', this.xhr.responseText);
										break;

									default:
										//document.id('responseText').set('class', 'prettyprint').set('text', this.xhr.responseText);
										break;
								}

								//prettyPrint();

								//document.getElements('nav ul li a[href="#response"]').fireEvent('click');
							}
							//getAutoTokenAndAddToHeader = false;
						}						
					};
					options.data = {};
					//upload file
					var fileUpload =  requestDataJson.fileUpload;
					if(fileUpload){
						//use var fileData = undefined because if fileUpload is empty object it will be still undefined
						//but in case fileUpload is not empty it will initial as an object and put data in this var
						var fileData = undefined;
						Object.each(fileUpload,function(value,key){
							MyLog('has fileUpload');
							fileData ={};
							if(typeOf(value) == "string"){
								fileData[key] = btoa(value);
								MyLog('string');
							}else if(typeOf(value) == "object"){
								MyLog('object');
								var str = '';
								Object.each(value,function(fvalue,fkey){
									if(typeOf(fvalue)=="string"){
										str +='"'+fvalue+'"'+','
									}else{
										str +=fvalue+','
									}
								
								})
								//use substring to remove ',' at the end of this string
								str = str.substring(0,str.length-1);
								fileData[key] = btoa(str);
								MyLog('normal string: '+key + ':' + str);
								MyLog('base64 string: '+key + ':' + btoa(str));
							}
						})
						if(fileData){
							MyLog('upload file rawData is set');
							options.rawdata = JSON.stringify(fileData);
							MyLog(options.rawdata);
						}else{
							MyLog('no fileUpload');
							MyLog('upload file rawData is not set');
						}
					
					}
					//insert body
					if(requestDataJson.URLParams){
						Object.each(requestDataJson.URLParams,function(value,key){
							if(key!=''){
							//MyLog('key: '+key + ', value: '+value);
							options.data[key] = value;
							}
						})
					}
				
					//insert heade: header will be get from form for input header not from localStorage
					form.getElements('input[name="headers[key][]"]').each(function(key, index) {
						if (key.get('value') != '') {
							options.headers[key.get('value')] = form.getElements('input[name="headers[value][]"]')[index].get('value');
						}
					});
					new RESTRequest(options).send();
				}
				
			}
		}catch(e){
			MyLog(e);
		}
		
	}else{
		MyLog('auto test not work');
	}
};

//get token from localStorage and put it into header
var automationTokenToHeader = function(){
	if(localStorage['automation-token']){
		var automationToken = JSON.decode(localStorage['automation-token']);
		if(automationToken.Authorization){
			var form = document.getElement('form');
			//var lastIndexOfInput = form.getElements('input[name="headers[key][]"]').length-1;
			form.getElements('input[name="headers[key][]"]')[0].focus();
			form.getElements('input[name="headers[key][]"]')[0].set('value','Authorization');
			form.getElements('input[name="headers[value][]"]')[0].set('value',automationToken.Authorization);
			form.getElements('input[name="headers[key][]"]')[0].blur();
			MyLog('set unfocuse run');
		}
	}
	else{
		var automationToken = {};
		MyLog('it doesn\'t have any token');
	}
	
};
//load all test case from file when it was selected
var  loadTestCase = function(file){
	try{
		var reader = new FileReader();
		var extendsion = file.name.split('.')[1].toLowerCase();
		if(extendsion == 'cvs' || extendsion == 'txt'){
			reader.onload = function(){
				var result = reader.result; 
				try{
					ALL_LOADED_TEST_CASE = JSON.decode(result);
				}catch(e){
					alert('Please check your file format it is not a correct JSON format!');
				}
				var server = ALL_LOADED_TEST_CASE.server;
				var allTestCase = ALL_LOADED_TEST_CASE.test_case;
				removeTestCase();
				document.id('responseText').empty().set('class', '');
				for(var i = 0 ; i < allTestCase.length;i++){
					addTestCaseElement(allTestCase[i].testId,allTestCase[i].testName);
				}
				
			};
			reader.readAsText(file);
		}else{
			alert('Please select txt or cvs file!');
		}
	}catch(e){
		MyLog(e);
		
	}
}
//set everything to empty when the file selected was remove
var reset = function(){
	removeTestCase();
	ALL_LOADED_TEST_CASE = undefined;
	document.id('responseText').empty().set('class', '');
	TEST_RESULT = {"all_test_case_result":[]};
}

//clear response code from all test case
var clearAllResponseCode = function(){
	var allTestCase = ALL_LOADED_TEST_CASE.test_case;
	for(var i = 0 ; i < allTestCase.length;i++){
		allTestCase[i]['result'] = '';
	}
	refreshTestCase();
}
//reload test case on web screen when it get result test
var refreshTestCase = function(){
	var allTestCase = ALL_LOADED_TEST_CASE.test_case;
	removeTestCase();
	for(var i = 0 ; i < allTestCase.length;i++){
		addTestCaseElement(allTestCase[i].testId,allTestCase[i].testName,allTestCase[i].result);
	}
}
//remove all test case from web screen
var removeTestCase = function(){
	var ul = document.getElementById("test_case_list");
	ul.empty();
}
//adding test case to web screen
var addTestCaseElement = function(testId,testName,responseCode){
	var ul = document.getElementById("test_case_list");
	var li = document.createElement("LI");
	var p = document.createElement("p");
	if(responseCode && responseCode != ''){
		if(responseCode == '200' || responseCode == '201' || responseCode == '202' || responseCode == '204' || responseCode == '206'){
			p.innerHTML = "Test ID = "+testId +" : "+testName + ",  <span class ='special_word_green'>responseCode = "+responseCode +"&nbsp</span>";
			li.appendChild(p);
			ul.appendChild(li);
		}else{
			p.innerHTML = "Test ID = "+testId +" : "+testName + ", <span class ='special_word_red'>error code = "+responseCode +"&nbsp</span>";
			li.appendChild(p);
			ul.appendChild(li);
		}
		
	}else{
		p.innerHTML = 'Test ID = '+testId +' : '+testName;
		li.appendChild(p);
		ul.appendChild(li);
	}
}

var MyLog = function(textToLog){
	console.log(textToLog);
};
