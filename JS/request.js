var getAutoTokenAndAddToHeader = false;

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


window.addEvent('domready', function() {
    new Keyboard({
        'defaultEventType': 'keyup',
        'events': {
            'alt+o': function() { document.getElement('nav ul li a[href="#options"]').fireEvent('click') },
            'alt+t': function() { document.getElement('nav ul li a[href="#target"]').fireEvent('click') },
            'alt+c': function() { document.getElement('nav ul li a[href="#accept"]').fireEvent('click') },
            'alt+z': function() { document.getElement('nav ul li a[href="#auth"]').fireEvent('click') },
            'alt+m': function() { document.getElement('nav ul li a[href="#misc"]').fireEvent('click') },
            'alt+h': function() { document.getElement('nav ul li a[href="#headers"]').fireEvent('click') },
            'alt+b': function() { document.getElement('nav ul li a[href="#body"]').fireEvent('click') },
            'alt+r': function() { document.getElement('nav ul li a[href="#response"]').fireEvent('click') },
			'alt+a': function() { document.getElement('nav ul li a[href="#autotest"]').fireEvent('click') },
        }
    }).activate();

    // show/hide elements
    if (localStorage['display']) {
        var display = JSON.decode(localStorage['display']);
    } else {
        var display = {};
    }

    Object.each(display, function(value, key) {
        document.getElement('section#options input[value="{0}"]'.substitute([key])).set('checked', value ? true : false);
    });

    // set theme
    if (localStorage['theme']) {
        document.getElement('section#options input[value="' + localStorage['theme'] + '"]').set('checked', true);
    } else {
        document.getElement('section#options input[name="theme"]').set('checked', true);
    }

    document.getElements('section#options input[name="display"]').addEvent('change', function() {
        display[this.get('value')] = this.checked;

        localStorage['display'] = JSON.encode(display);

        section = document.getElement('section[rel="' + this.get('value') + '"]');

        if (this.checked) {
            section.show();
        } else {
            section.hide();
        }
    }).fireEvent('change');

    document.getElements('section#options input[name="theme"]').addEvent('change', function() {
        if (this.checked) {
            localStorage['theme'] = this.get('value');

            section = document.id('theme').set('href', this.get('value'));
        }
    }).fireEvent('change');

    // menu navigation
    document.getElements('nav ul li a').addEvent('click', function(e) {
        

        var name = this.get('href').split('#')[1];
		console.log(name);
		
		if(name=='autotest'){
			console.log('handle autotest clicked');
			window.open("autotest.html")
		}else{
			if (e) e.stop();
			var target = document.id(name);
			
			document.getElements('section.main').setStyle('height', '30px');
			this.getParent('ul').getElements('.active').removeClass('active');
			
			this.addClass('active');

			var height = 30;

			target.getElements('section').each(function(section) {
				if (section.getStyle('display') != 'none') {
					height += section.getSize().y + 10;
				}
			});
			target.setStyle('height', height + 'px');
		}
		  
    });

    // focus magic
    // run on all elements except the auth selector
    document.getElements('section.main').addEvent('focus:relay(input:not([name="auth[method]"]), select)', function(e) {
        document.getElement('nav ul li a[href="#' + this.getParent('section.main').id + '"]').fireEvent('click');
    });
	/**document.getElement('nav ul li a[href="#autotest"]').addEvent('click',function(e){
		console.log('autotest is clicked');
	});**/

    document.getElements('section.main h2').addEvent('click', function(e) {
        document.getElement('nav ul li a[href="#' + this.getParent().id + '"]').fireEvent('click');
    });

    // focus on the url field
    if (window.location.hash) {
        document.getElement('nav ul li a[href="' + window.location.hash + '"]').fireEvent('click');
    } else {
        document.getElement('input[type=url]').focus();
    }

    // create autocomplete lists
    document.getElements('input[list]').each(function(input) {
        var list = document.id(input.get('list')).getElements('option').get('value');
        new Meio.Autocomplete(input, list);
    });

    // Auth
    document.getElements('label input[name="auth[method]"]').addEvent('change', function()
    {
        var method = this.get('value');

        document.getElements('section#auth tr[rel]').hide();
        document.getElements('section#auth tr[rel] select, section#auth tr[rel] input').set('disabled', true);

        document.getElements('section#auth tr[rel="' + method + '"]').setStyle('display', 'table-row');
        document.getElements('section#auth tr[rel="' + method + '"] select, section#auth tr[rel="' + method + '"] input').set('disabled', false);
    });

    document.getElements('label input[name="auth[method]"]').addEvent('focus', function(e) {
        this.fireEvent('change');
        document.getElement('nav ul li a[href="#auth"]').fireEvent('click');
    });

    document.getElements('label input[name="auth[method]"]').addEvent('click', function(e) {
        this.fireEvent('focus');
    });

    // oauth version
    document.getElement('input[name="auth[oauth][version]"]').addEvent('change', function() {
        this.set('value', parseInt(this.get('value')).toFixed(1));
    });

    // Misc
    document.getElements('label input[name^="misc[checkbox]"]').addEvent('change', function()
    {
        if (this.checked) {
            this.getParent().getParent().getParent().getParent().getElements('div input').set('disabled', false);
        } else {
            this.getParent().getParent().getParent().getParent().getElements('div input').set('disabled', true);
        }
    });

    // headers & body params
    document.getElements('li:last-of-type input[name="headers[key][]"], li:last-of-type input[name="headers[value][]"], li:last-of-type input[name="body[params][key][]"], li:last-of-type input[name="body[params][value][]"]').addEvent('focus', function() {
        row = this.getParent().clone();
        row.grab(new Element('input', {'type': 'button', 'value': '-', 'events': {'click': function(e) {e.stop(); this.getParent().dispose(); }}}));
        this.getParent().grab(row, 'before');
        row.getElement('input').focus();
    });

    // reset
    document.getElement('input[type=reset]').addEvent('click', function(e) {
        document.id('requestText').empty();
        document.id('requestHeaders').empty();
        document.id('responseHeaders').empty();
        document.id('responseText').empty().set('class', '');
	
		//i added this code for reset method to set content-type to empty
		document.getElement('input[name=content_type]').set('checked',false);
		document.getElement('input[name=content_type]').disabled = true;
			
		var contentType = document.getElement('input[name=content_type]');
		contentType.fireEvent('change');
		
    });
	// token automation and save to localStorage
	document.getElement('input[name=token]').addEvent('click',function(e) {
		getTokenAutomation();
		//getTokenInBackground();
	});

	//Add authorization header
	document.getElement('input[name=addtoken]').addEvent('click',function(e) {
		automationTokenToHeader();
	});
	
	//combine auto token and add to header
	document.getElement('input[name=token_authorization]').addEvent('click',function(e){
		getAutoTokenAndAddToHeader = true;
		getTokenAutomation();
	});
	
    // save
    document.getElement('input[name=save]').addEvent('click', function(e) {
        e.stop();

        // text
        textDefaults = {};

        textElements = document.getElements('input[type="url"], input[type="number"], input[type="text"]:not([name="headers[key][]"], [name="headers[value][]"], [name="body[params][key][]"], [name="body[params][value][]"])');

        textElements.get('name').each(function(value, key) {
            textDefaults[value] = textElements.get('value')[key];
        });

        localStorage['text-defaults'] = JSON.encode(textDefaults);

        // radio
        radioDefaults = {};

        radioElements = document.getElements('input[type="radio"]:not([name="theme"])');

        radioElements.get('name').each(function(value, key) {
            if (radioElements[key].checked) {
                radioDefaults[value] = radioElements.get('value')[key];
            }
        });

        localStorage['radio-defaults'] = JSON.encode(radioDefaults);

        // checkboxes
        checkDefaults = {};

        checkElements = document.getElements('input[type="checkbox"]:not([name="display"])');

        checkElements.get('name').each(function(value, key) {
            checkDefaults[value] = checkElements[key].checked;
        });

        localStorage['check-defaults'] = JSON.encode(checkDefaults);

        // select
        selectDefaults = {};

        selectElements = document.getElements('select');

        selectElements.get('name').each(function(value, key) {
            selectDefaults[value] = selectElements.get('value')[key];
        });

        localStorage['select-defaults'] = JSON.encode(selectDefaults);
    });

	//when use method get no need content-type
	document.getElement('input[name=target[method]]').addEvent('change',function(){
		if(this.value == 'GET'){
			document.getElement('input[name=content_type]').set('checked',false);
			document.getElement('input[name=content_type]').disabled = true;
			
			var contentType = document.getElement('input[name=content_type]');
			contentType.fireEvent('change');
			//document.getElement('input[name=body[type]]').set('value','');
			//document.getElement('input[name=body[type]]').disabled = true;
			
		}else{
			document.getElement('input[name=content_type]').set('checked',true);
			document.getElement('input[name=content_type]').disabled = false;
			
			var contentType = document.getElement('input[name=content_type]');
			contentType.fireEvent('change');
			//document.getElement('input[name=body[type]]').disabled = false;
		
		}
	});

	document.getElement('input[name=content_type]').addEvent('change',function(e){
		//when we check it mean we can put content-type
		if(this.checked){
			document.getElement('input[name=body[type]]').disabled = false;
			//document.getElement('input[name=body[type]]').set('value','application/json');
		}
		//when we don't check it mean we can't put content-type
		else{
			document.getElement('input[name=body[type]]').set('value','');
			document.getElement('input[name=body[type]]').disabled = true;
		}
	});
    // submit
document.getElements('section#controls input[type="button"]:not([name="save"],[name="token"],[name="addtoken"],[name="token_authorization"])').addEvent('click', function() {
        var form = document.getElement('form[name=request]');
        form.elements['target[method]'].set('value', this.get('value'));
		
		var method = document.getElement('input[name=target[method]]');
		method.fireEvent('change');
		
        form.fireEvent('submit');
    });
    // load defaults last so that all previous events are triggerd when needed
    // load default values for text elements
    if (localStorage['text-defaults']) {
        var textDefaults = JSON.decode(localStorage['text-defaults']);
    } else {
        var textDefaults = {};
    }

    Object.each(textDefaults, function(value, key) {
        element = document.getElement('[name="{0}"]'.substitute([key]));
        if (element) element.set('value', value);
    });

    // load default values for select elements
    if (localStorage['select-defaults']) {
        var selectDefaults = JSON.decode(localStorage['select-defaults']);
    } else {
        var selectDefaults = {};
    }

    Object.each(selectDefaults, function(value, key) {
        document.getElement('[name="{0}"]'.substitute([key])).getElement('option[value={0}]'.substitute([value])).set('selected', true);
    });

    // load default values for radio elements
    if (localStorage['radio-defaults']) {
        var radioDefaults = JSON.decode(localStorage['radio-defaults']);
    } else {
        var radioDefaults = {};
    }

    Object.each(radioDefaults, function(value, key) {
        document.getElement('[name="{0}"][value="{1}"]'.substitute([key, value])).set('checked', true).fireEvent('change');
    });

    // load default values for checkbox elements
    if (localStorage['check-defaults']) {
        var checkDefaults = JSON.decode(localStorage['check-defaults']);
    } else {
        var checkDefaults = {};
    }

    Object.each(checkDefaults, function(value, key) {
        if (value) {
            document.getElement('[name="{0}"]'.substitute([key])).set('checked', true).fireEvent('change');
        }
    });

    document.getElement('form[name=request]').addEvent('submit', function(e)
    {
        if (e) e.stop();

        document.id('requestText').empty();
        document.id('requestHeaders').empty();
        document.id('responseHeaders').empty();
        document.id('responseText').empty().set('class', '');

        var form = document.getElement('form');

        if (form.elements['target[url]'].get('value') == '' || !/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(form.elements['target[url]'].get('value')))
        {
            error('Please enter a valid URL', form.elements['target[url]']);
			getAutoTokenAndAddToHeader = false;
        }
       /* else if (form.elements['accept[type]'].get('value') == '')
        {
            error('Please enter a valid Accept header or choose one from the list', form.elements['accept[type]']);

        }
        else if (form.elements['body[type]'].get('value') == '')
        {
            error('Please enter a valid Content-Type header or choose one from the list', form.elements['body[type]']);
        }*/
        else
        {
			saveUserData(form.elements['body[raw]'].get('value'),form.elements['target[url]'].get('value'),form.elements['target[method]'].get('value'));
            var options = {
                'url': form.elements['target[url]'].get('value'),
                'method': form.elements['target[method]'].get('value'),
                'encoding': form.elements['body[charset]'].get('value'),
                'timeout': form.elements['target[timeout]'].get('value') * 1000,
                'rawdata': form.elements['body[raw]'].get('value'),
                'headers': {
                    'Accept': form.elements['accept[type]'].get('value'),
                    'Content-Type': form.elements['body[type]'].get('value') + '; charset=' + form.elements['body[charset]'].get('value'),
                    'Accept-Language':  form.elements['accept[language]'].get('value')
                },

                /*
                 * these headers are forbidden to change in chrome
                 * 'Accept-Charset':  form.elements['accept[charset]'].get('value'),
                 * 'Accept-Encoding':  form.elements['accept[encoding]'].get('value'),
                 * 'Cache-Control': form.elements['misc[cache]'].get('value'),
                 * 'Date': form.elements['misc[date]'].get('value'),
                 * 'Connection': form.elements['misc[connection]'].get('value'),
                 * 'Expect': form.elements['misc[expect]'].get('value'),
                 * 'Referer': form.elements['misc[referer]'].get('value'),
                 * 'User-Agent': form.elements['misc[agent]'].get('value'),
                 * 'Via': form.elements['misc[via]'].get('value'),
                 */

                'onProgress': function(event, xhr) {
                    if (event.lengthComputable)
                    {
                        document.getElement('progress').show().set('value', (event.loaded / event.total) * 100);
                    }
                },

                'onTimeout': function() {
					getAutoTokenAndAddToHeader = false;
                    error('Connection Timed-out');
                },

                'onComplete': function(responseText, responseXML) {
                    if (this.xhr.status == 0) {
                        error('Connection Failed!');
                    } else {
                        var contentType = this.xhr.getResponseHeader('Content-Type');

                        if (contentType != null) {
                            var index = contentType.indexOf(';');

                            if (index > 1)
                            {
                                contentType = contentType.slice(0, index);
                            }
                        }

                        var requestText = 'Request URL: {0}\nRequest Method: {1}\n'.substitute([options.url, options.method]);

                        // uploaded files?
                        if (document.getElement('[name="file[data]"]').get('value') != '' && document.getElement('[name="file[name]"]').get('value') != '') {
                            requestText += 'Files: {0}\n'.substitute([JSON.encode(document.getElement('[name="file[data]"]').files[0])]);
                        }

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

                        document.id('requestText').set('text', requestText);
                        document.id('requestHeaders').set('text', requestHeaders);
                        document.id('responseHeaders').set('text', 'Status Code: ' + this.xhr.status + "\n" + this.xhr.getAllResponseHeaders());

                        switch (contentType)
                        {
                            case 'application/json':
                                responseText = beautify.js(this.xhr.responseText);
                                document.id('responseText').set('class', 'prettyprint lang-js').set('text', responseText);
								analysToken(responseText);
								if(getAutoTokenAndAddToHeader){
									automationTokenToHeader();
								}
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
                                document.id('responseText').set('class', 'prettyprint lang-html').set('text', this.xhr.responseText);
                                break;

                            default:
                                document.id('responseText').set('class', 'prettyprint').set('text', this.xhr.responseText);
                                break;
                        }

                        prettyPrint();

                        document.getElements('nav ul li a[href="#response"]').fireEvent('click');
                    }
					getAutoTokenAndAddToHeader = false;
                }
            };

            if (form.elements['misc[if][match]'].get('value') != '') {
                options.headers['If-Match'] = form.elements['misc[if][match]'].get('value');
            }

            if (form.elements['misc[if][nonematch]'].get('value') != '') {
                options.headers['If-None-Match'] = form.elements['misc[if][nonematch]'].get('value');
            }

            if (form.elements['misc[if][modifiedsince]'].get('value') != '') {
                options.headers['If-Modified-Since'] = form.elements['misc[if][modifiedsince]'].get('value');
            }

            if (form.elements['misc[if][unmodifiedsince]'].get('value') != '') {
                options.headers['If-Unmodified-Since'] = form.elements['misc[if][unmodifiedsince]'].get('value');
            }

            if (form.elements['misc[if][range]'].get('value') != '') {
                options.headers['If-Range'] = form.elements['misc[if][range]'].get('value');
            }

            if (form.elements['misc[forwards]'].get('value') != '') {
                options.headers['Max-Forwards'] = form.elements['misc[forwards]'].get('value');
            }

            if (form.elements['misc[pragma]'].get('value') != '') {
                options.headers['Pragma'] = form.elements['misc[pragma]'].get('value');
            }

            if (form.elements['misc[range]'].get('value') != '') {
                options.headers['Range'] = form.elements['misc[range]'].get('value');
            }

            options.data = {};

            form.getElements('input[name="body[params][key][]"]').each(function(key, index) {
                if (key.get('value') != '') {
                    options.data[key.get('value')] = form.getElements('input[name="body[params][value][]"]')[index].get('value');
                }
            });

            switch (form.getElement('input[name="auth[method]"]:checked').get('value'))
            {
                case 'manual':
                    options.headers.Authorization = form.elements['auth[manual]'].get('value');
                    break;

                case 'plain':
                    options.user = form.elements['auth[plain][username]'].get('value');
                    options.password = form.elements['auth[plain][password]'].get('value');
                    break;

                case 'basic':
                    options.headers.Authorization = 'Basic ' + btoa(form.elements['auth[basic][username]'].get('value') + ':' + form.elements['auth[basic][password]'].get('value'));
                    break;

                case 'oauth':
                    var request = {
                        'path': form.elements['target[url]'].get('value'),
                        'action': form.elements['target[method]'].get('value'),
                        'method': form.elements['auth[oauth][method]'].get('value'),
                        'signatures': {
                            'consumer_key': form.elements['auth[oauth][consumer][key]'].get('value'),
                            'shared_secret': form.elements['auth[oauth][consumer][secret]'].get('value'),
                            'access_token': form.elements['auth[oauth][token][key]'].get('value'),
                            'access_secret': form.elements['auth[oauth][token][secret]'].get('value')
                        }
                    };

                    var data_query = Object.toQueryString(options.data);

                    if (data_query != '' && form.elements['body[type]'].get('value') == 'application/x-www-form-urlencoded') {
                        request.parameters = data_query + '&oauth_version=' + form.elements['auth[oauth][version]'].get('value');
                    } else {
                        request.parameters = 'oauth_version=' + form.elements['auth[oauth][version]'].get('value');
                    }

                    var oauth = OAuthSimple().sign(request);

                    if (form.elements['auth[oauth][method]'].get('value') == 'header') {
                        options.headers.Authorization = oauth.header;
                    } else {
                        options.url = oauth.signed_url;

                        // MooTools appends the same body twice
                        // TODO: Params!
                        //if (form.elements['body[type]'].get('value') == 'application/x-www-form-urlencoded') {
                            //options.url = options.url.replace('&' + form.elements['body[type]'].get('value'), null);
                        //}
                    }
                    break;

                case 'none':
                default:
                    break;
            }

            if (form.elements['file[data]'].get('value') != '' && form.elements['file[name]'].get('value') != '') {
                options.files = {
                    'name': form.elements['file[name]'].get('value'),
                    'element': 'input[name="file[data]"]'
                }

                delete options.headers['Content-Type'];
            }

            form.getElements('input[name="headers[key][]"]').each(function(key, index) {
                if (key.get('value') != '') {
                    options.headers[key.get('value')] = form.getElements('input[name="headers[value][]"]')[index].get('value');
                }
            });

            new RESTRequest(options).send();
        }
    });
});
//start getting token
var getTokenAutomation = function(){
	var form = document.getElement('form[name=request]');
		//get url
		if(localStorage['token-url']){
			var tokenUrl = JSON.decode(localStorage['token-url']);
			if(tokenUrl.url){
				
				console.log('this url for get token: '+tokenUrl.url);
				form.elements['target[url]'].set('value',tokenUrl.url);
				//get method
				form.elements['target[method]'].set('value', 'POST');
				//when set method need to fireEvent
				var method = document.getElement('input[name=target[method]]');
				method.fireEvent('change');
		
				form.elements['body[charset]'].set('value', 'UTF-8');
				form.elements['target[timeout]'].set('value', '60');
				//if user used to generate the token, username and password will be saved, this function can get it from loacalStorage
				var userData = getUserData();
				form.elements['body[raw]'].set('value',JSON.stringify(userData));
		
				form.elements['accept[type]'].set('value','application/json');
				form.elements['body[type]'].set('value','application/json');
				form.elements['accept[language]'].set('value','en');
				form.fireEvent('submit');
			}
		}else{
			alert('It seem like you never input URL,username and password for generate token, so please please generate it manually next time you will be able to use this funtion!');
		}
		
}

//when get response from server just use this method to find the token if has token it will return the token
var analysToken = function(responseText){
	if(responseText){
		try{
			jsonResponse = JSON.parse(responseText);
			if(jsonResponse.token){
				console.log('have token');
				saveToken(jsonResponse.token);
				clearTokenThread();
				console.log('clear thread interval');
				if(jsonResponse.expire){
					startTokenThead(jsonResponse.expire);
					console.log('set new thread interval '+jsonResponse.expire);
					console.log(responseText);
				}else{
					startTokenThead(36000);
					console.log('set new thread interval 36sec');
				}
				
			}else{
				console.log('no token');
			}
		}catch(e){
			console.log('response from server is not a json format');
		}
	}
}

//use for save the token in case it not undifine or token not empty
var saveToken = function(token){
	if(token){
		var automationToken = {};
		automationToken['Authorization'] = 'Bearer '+token;
		localStorage['automation-token'] = JSON.encode(automationToken);
		console.log('token is save');
	}else{
		console.log('token is empty');
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
		}
	}
	else{
		var automationToken = {};
		console.log('it doesn\'t have any token');
	}
	
};
var refreshToken = function(){
	if(localStorage['automation-token']){
		var automationToken = JSON.decode(localStorage['automation-token']);
		if(automationToken.Authorization){
			var form = document.getElement('form');
			form.getElements('input[name="headers[key][]"]')[0].set('value','Authorization');
			form.getElements('input[name="headers[value][]"]')[0].set('value',automationToken.Authorization);
		}
	}
	else{
		var automationToken = {};
		console.log('it doesn\'t have any token');
	}
}
var getTokenInBackground = function(){
	if(localStorage['token-url']){
		var userData = getUserData();
		var tokenUrl = JSON.decode(localStorage['token-url']);
		if(tokenUrl.url){
			if(tokenUrl.url == '' || !/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(tokenUrl.url)){
				console.log('url problem when auto get token in background');
			}else{
				getAutoTokenAndAddToHeader = true;
				var options = {
					'url': tokenUrl.url,
					'method': 'POST',
					'encoding': 'UTF-8',
					'timeout': 60 * 1000,
					'rawdata': JSON.stringify(userData),
					'headers': {
						'Accept': 'application/json',
						'Content-Type': 'application/json; charset=UTF-8',
						'Accept-Language':  'en'
					},
					'onProgress': function(event, xhr) {
						if (event.lengthComputable)
						{
							document.getElement('progress').show().set('value', (event.loaded / event.total) * 100);
						}
					},

					'onTimeout': function() {
						getAutoTokenAndAddToHeader = false;
						error('Connection Timed-out');
					},
					'onComplete': function(responseText, responseXML) {
						if (this.xhr.status == 0) {
							//error('Connection Failed!');
						} else {
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

                        //document.id('requestText').set('text', requestText);
                        //document.id('requestHeaders').set('text', requestHeaders);
                        //document.id('responseHeaders').set('text', 'Status Code: ' + this.xhr.status + "\n" + this.xhr.getAllResponseHeaders());

                        switch (contentType)
                        {
                            case 'application/json':
                                responseText = beautify.js(this.xhr.responseText);
                                //document.id('responseText').set('class', 'prettyprint lang-js').set('text', responseText);
								analysToken(responseText);
								if(getAutoTokenAndAddToHeader){
									refreshToken();
								}
								getAutoTokenAndAddToHeader = false;
                                break;

                            case 'text/xml':
                            case 'application/xml':
                            case 'application/rss+xml':
                            case 'application/atom+xml':
                                //responseXML = beautify.xml(this.xhr.responseXML);

                                //var declaration = this.xhr.responseText.match(/^(\s*)(<\?xml.+?\?>)/i);

                                //document.id('responseText').set('class', 'prettyprint lang-xml').appendChild(responseXML)
                                //document.id('responseText').appendText(declaration[2] + "\n", 'top');
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
						getAutoTokenAndAddToHeader = false;
					}
				
				};
			}
			
			options.data = {};
			new RESTRequest(options).send();
			console.log('getTokenInBackground is run');
				
		}
	}
}

//save paramet use for get token
var saveUserData = function(jsonRequestDataParam,url,method){
	if(jsonRequestDataParam && method == 'POST'){
		try{
			json = JSON.parse(jsonRequestDataParam);
			var strUrl = url.split('/');
			var lastPos = strUrl.length-1;
			if(json.username && json.password && strUrl[lastPos] == "token"){
				console.log('it have username and password' + 'last word is: ' + strUrl[lastPos]);
				var userData = {};
				userData['username'] = json.username;
				userData['password'] = json.password;
				localStorage['user-data'] = JSON.encode(userData);
				console.log('save username password to loacalStorage');
				saveTokeUrl(url);
				console.log('save url to loacalStorage');
			}else{
			console.log('no username and password');
			}
		}catch(e){
			console.log('request is not a json format');	
		}
	}
}
var saveTokeUrl = function(url){
	if(url){
		var tokenUrl = {};
		tokenUrl['url'] = url;
		console.log(url);
		localStorage['token-url'] = JSON.encode(tokenUrl);
	}
}
var getUserData = function(){
	if(localStorage['user-data']){
		var userData = JSON.decode(localStorage['user-data']);
	}else{
		var userData = {};
	}
	return userData;
}
var myTokenThread;
var clearTokenThread = function(){
	clearInterval(myTokenThread);
};
var startTokenThead = function(timer){
	//at here is use for convert from sec to milisec before input to this method
	//time = time*1000;
	myTokenThread = setInterval(getTokenInBackground,timer);
}
