/*
firebase-sandbox version.06-2016 - Firebase v3 methods from a graphical user interface (GUI) for learning and testing purposes.
Created by Ron Royston, https://rack.pub
https://github.com/rhroyston/firebase-sandbox
License: MIT

fire.push(args)
fire.update(args)
fire.set(targs)
fire.transaction(args)
args = {path:path,child:child,key:key,val:val}
fire.toast(msg)
*/

// fires when doc ready
r(function(){
    //step 1 load the config from session or storage?  session takes precedence
    if (fireConfig.sessionStorageConfig()){
        fire.loadToMemory(fireConfig.sessionApiKey, fireConfig.sessionAuthDomain, fireConfig.sessionDatabaseURL, fireConfig.sessionStorageBucket);
        fireConfig.configured = true;
    } else if (fireConfig.localStorageConfig()){
        fire.loadToMemory(fireConfig.storedApiKey, fireConfig.storedAuthDomain, fireConfig.storedDatabaseURL, fireConfig.storedStorageBucket);
        fireConfig.configured = true;
    }
        
    //if firebase config in memory                            
    if(fireConfig.configured){
        // display config data on card
        fire.displayConfig();
        
        // Attempt to Initialize Firebase
        try{
            firebase.initializeApp(fireConfig.config);
            fireConfig.initialized = true;
        } catch (e){
            fireConfig.initialized = false;
            fire.toast('Firebase Failed to Initialize: ' + e,null,5000);
        }
        
        // Attempt to Get a reference to the database service
        try{
            fire.database = firebase.database();
            fireConfig.initialized = true;
        } catch (e){
            fireConfig.initialized = false;
            fire.toast(e,null,5000);
        }
    } else {
        //don't enable buttons and bring attention to configure button
        fire.settingsIcon.classList.add('spin');
    }
    
    if(fireConfig.initialized){
        fire.buttonEnabler();
    }
    
    //Capture errors and send to toast
    window.onerror = function (msg, url, lineNo, columnNo, error) {
        var string = msg.toLowerCase();
        var substring = "script error";
        
        var test = 'Your API key is invalid'.toLowerCase();
        if (string.indexOf(test) > -1){
            //fire.toast('Script Error: See Browser Console for Detail',null,4000);
            //disable action buttons
            setTimeout(function(){
                fire.buttonDisabler();
            }, 1000);
        }
        
        var oAutoError = 'not authorized for OAuth operations'.toLowerCase();
        if (string.indexOf(oAutoError) > -1){
            //do not toast this error
            return
        }
        
        if (string.indexOf(substring) > -1){
            fire.toast('Script Error: See Browser Console for Detail',null,4000);
            console.log(msg, url, lineNo, columnNo, error);
        } else {
            fire.toast(msg,null,4000);
            console.log(msg, url, lineNo, columnNo, error);
        }
      return false;
    };
});

//Revealing Module Pattern (Public & Private) w Public Namespace 'fire'
var fire = (function() {
    // object to expose as public properties and methods
    var pub = {};
    //firebase config
    var config = {};
    // reference document once for performance
    var doc = document; 
    //for toasting
    var timer = 10; //in milliseconds

    //reference all the buttons and inputs
    var apiKeySpan = doc.getElementById('api-key-span');
    var authDomainSpan = doc.getElementById('auth-domain-span');
    var databaseUrlSpan = doc.getElementById('database-url-span');
    pub.buttonPush = doc.getElementById('button-push');
    pub.buttonUpdate = doc.getElementById('button-update');
    pub.buttonSet = doc.getElementById('button-set');
    pub.buttonTransaction = doc.getElementById('button-transaction');
    var pathInput = doc.getElementById('path-input');
    var childInput = doc.getElementById('child-input');
    var keyInput = doc.getElementById('key-input');
    var valueInput = doc.getElementById('value-input');
    var checkboxNoValue = doc.getElementById('checkbox-no-value');
    var actionButtons = doc.getElementsByClassName('action-button');
    var rackButton = doc.getElementById('rack');
    var licenseButton = doc.getElementById('license');
    var configureButton = doc.getElementById('configure');
    pub.settingsIcon = doc.getElementById('settings-icon');
    
    var dialogConfig = doc.getElementById('dialog-config');
    var dialogConfigTopIcon = doc.getElementById('dialog-config-top-icon');
    var dialogConfigProcessing = doc.getElementById('dialog-config-processing');
    var dialogConfigBody = doc.getElementById('dialog-config-body');
    var dialogConfigActions = doc.getElementById('dialog-config-actions');
    var dialogConfigClose = doc.getElementById('dialog-config-close');
    var dialogConfigButtonCommit = doc.getElementById('dialog-config-button-commit');
    var dialogConfigStoreCheckbox = doc.getElementById('dialog-config-store-checkbox');
    var dialogConfigRemember = true;
    
    var dialogHelp = doc.getElementById('dialog-help');
    var dialogHelpTitle = doc.getElementById('dialog-help-title');
    var dialogConfigTitle = doc.getElementById('dialog-config-title');
    var dialogHelpTopIcon = doc.getElementById('dialog-help-top-icon');
    var dialogHelpContent = doc.getElementById('dialog-help-content');
    var dialogHelpBody = doc.getElementById('dialog-help-body');
    var dialogHelpActions = doc.getElementById('dialog-help-actions');
    var dialogHelpClose = doc.getElementById('dialog-help-close');
    
    var mainHelp = doc.getElementById('main-help');
    var fork = doc.getElementById('fork');
    
    var apiKeyInput = doc.getElementById('apiKey-input');
    var authDomainInput = doc.getElementById('authDomain-input');
    var databaseURLInput = doc.getElementById('databaseURL-input');
    var storageBucketInput = doc.getElementById('storageBucket-input');
    
    var iframes = document.getElementsByTagName('iframe');

    // initialize object to reference to the database service
    pub.database;
        
    //make the buttons work
    attachListeners();

    
    pub.iframeKiller = function(){
        for (var i = 0; i < iframes.length; i++) {
            iframes[i].location='';
        }
    };
    
    pub.buttonDisabler = function(){
        pub.buttonPush.setAttribute("disabled","disabled");
        pub.buttonUpdate.setAttribute("disabled","disabled");
        pub.buttonSet.setAttribute("disabled","disabled");
        pub.buttonTransaction.setAttribute("disabled","disabled");
        
    };
    
    pub.buttonEnabler = function(){
        if(fireConfig.initialized){
            //enable action buttons
            pub.buttonPush.disabled = false;
            pub.buttonUpdate.disabled = false;
            pub.buttonSet.disabled = false;
            pub.buttonTransaction.disabled = false;
        }        
    }

    //create single object for passing values/arguments to database methods
    var args = function(){
        var path;
        var child;
        var key;
        var val;
        if(pathInput.value == ''){path = null} else {path = pathInput.value}
        if(childInput.value == ''){child = null} else {child = childInput.value}
        if(keyInput.value == ''){key = null} else {key = keyInput.value}
        if(valueInput.value == ''){val = null} else {val = valueInput.value}
        if (checkboxNoValue.checked){
            val = true;
        }
        
        //Add slash to path and or child and alert via toast if empty
        var pathChild = [];
        pathChild = conditionInputs(path,child);
        path = pathChild[0];
        child= pathChild[1];
        
        //return args object
        return {path:path,child:child,key:key,val:val};
    };
    
    function attachListeners(){
        
        for (var i = 0, len = actionButtons.length; i < len; i++) {
            actionButtons[i].addEventListener("click", function(e){
                switch (this.id) {
                    case 'button-push':
                        fire.push(args());
                        break;
                    case 'button-set':
                        fire.set(args());
                        break;
                    case 'button-transaction':
                        fire.transaction(args());
                        break;
                    case 'button-update':
                        fire.update(args());
                        break;
                }
            });
        }
        
        rackButton.addEventListener("click", function(e){
            window.location = "https://rack.pub";
        });
        
        //licenseButton.addEventListener("click", function(e){
        //    window.location = "https://tldrlegal.com/license/mit-license";
        //});
        
        dialogConfigStoreCheckbox.addEventListener("click", function(e){
            if (dialogConfigStoreCheckbox.checked){
                dialogConfigRemember = true;
            } else {
                dialogConfigRemember = false;
            }
            
        });
        
        dialogConfigClose.addEventListener("click", function(){
            dialogConfig.close();
        });
        
        dialogHelpClose.addEventListener("click", function(){
            dialogHelp.close();
            // remove id fragment from URL and slice off the remaining hash in HTML5
            window.location.replace("#");
            if (typeof window.history.replaceState == 'function') {
              history.replaceState({}, '', window.location.href.slice(0, -1));
            }
        });
        
        dialogHelpTopIcon.addEventListener("click", function(){
            dialogHelp.close();
        });
        
        mainHelp.addEventListener("click", function(){
            if (!mainHelp.showModal) {
                dialogPolyfill.registerDialog(dialogHelp);
            }
            dialogHelp.showModal();
            doc.activeElement.blur();
        });
        fork.addEventListener("click", function(){
            window.location="https://github.com/rhroyston/firebase-sandbox";
        });
        
        configureButton.addEventListener("click", function(){
            if (!configureButton.showModal) {
                dialogPolyfill.registerDialog(dialogConfig);
            }
            dialogConfig.showModal();

            if(!(typeof(componentHandler) == 'undefined')){
                componentHandler.upgradeAllRegistered();
            }
        
            //populate inputs if we have the config data in memory
            if(fireConfig.configured){
                apiKeyInput.value = fireConfig.config.apiKey;
                authDomainInput.value = fireConfig.config.authDomain;
                databaseURLInput.value = fireConfig.config.databaseURL;
                storageBucketInput.value = fireConfig.config.storageBucket;
            }
            
            // FOR NOW WE ENABLE COMMIT BUTTON BUT WANT TO ADD AUTO ENABLE ON DETECT ALL INPUTS FILLED
            dialogConfigButtonCommit.disabled = false;
            dialogConfigClose.disabled = false;
            dialogConfigStoreCheckbox.disabled = false;
            
            //MDL Bug Fix
            var dialogInputs = doc.querySelectorAll('.dialog-inputs');
            for (var i = 0, l = dialogInputs.length; i < l; i++) {
                dialogInputs[i].MaterialTextfield.checkDirty();
            }
            //focus on input no 1
            apiKeyInput.focus();
        });
        dialogConfigButtonCommit.addEventListener("click", function(){
            runEntry(endEntry);
        });
    }
    
    pub.loadToStorage = function(api,auth,db,st){
        //If browser storage not available tell user <-- ONLY NEEDED IF REMEMBER CHECKED
        if (typeof(Storage) == "undefined"){
            pub.toast('Browser storage not supported. Cannot remember config',null,4000);
            return false;
        } else {
            //LOAD TO STORAGE
            try{
                localStorage.setItem("firebaseSandboxApiKey",api);
                localStorage.setItem("firebaseSandboxAuthDomain",auth);
                localStorage.setItem("firebaseSandboxDatabaseURL",db);
                localStorage.setItem("firebaseSandboxStorageBucket",st);
                return true;
            } catch (e) {
                pub.toast(JSON.stringify(e),null,4000);
                return false;
            }        
        }
    }
    pub.loadToSession = function(api,auth,db,st){
        //If browser session storage not available tell user
        if (typeof(Storage) == "undefined"){
            pub.toast('Browser session storage not supported',null,4000);
            return false;
        } else {
            //LOAD TO SESSION
            try{
                sessionStorage.setItem("firebaseSandboxApiKey",api);
                sessionStorage.setItem("firebaseSandboxAuthDomain",auth);
                sessionStorage.setItem("firebaseSandboxDatabaseURL",db);
                sessionStorage.setItem("firebaseSandboxStorageBucket",st);
                return true;
            } catch (e) {
                pub.toast(JSON.stringify(e),null,4000);
                return false;
            }        
        }
    };
    pub.loadToMemory = function(api,auth,db,st){
        //LOAD to MEMORY
        try{
        	fireConfig.config.apiKey = api;
        	fireConfig.config.authDomain = auth;
        	fireConfig.config.databaseURL = db;
        	fireConfig.config.storageBucket = st;
            return true;
        } catch (e) {
            pub.toast(JSON.stringify(e),null,4000);
            return false;
        }
    };
    pub.removeConfigFromStorage = function(){
        try{
            localStorage.removeItem("firebaseSandboxApiKey");
            localStorage.removeItem("firebaseSandboxAuthDomain");
            localStorage.removeItem("firebaseSandboxDatabaseURL");
            localStorage.removeItem("firebaseSandboxStorageBucket");
            pub.toast('Config Removed from Storage',null,4000);
            return true;
        } catch (e) {
            pub.toast(JSON.stringify(e),null,4000);
            return false;
        }
    };
    function runEntry(callback) {
        //check if all inputs have values and if not toast which one does not then exit
        if(!apiKeyInput.value){pub.toast('API Key Required',null,4000);return;}
        if(!authDomainInput.value){pub.toast('Auth Domain Required',null,4000);return;}
        if(!databaseURLInput.value){pub.toast('Database URL Required',null,4000);return;}
        if(!storageBucketInput.value){pub.toast('Storage Bucket Required',null,4000);return;}
        
        //get the input
        var api = apiKeyInput.value;
        var auth = authDomainInput.value;
        var db = databaseURLInput.value;
        var st = storageBucketInput.value;

        //clear dialog and show spinner while processing
        dialogConfigBody.classList.add('hide');
        dialogConfigProcessing.classList.remove('hide');
        
        dialogConfigButtonCommit.disabled = true;
        dialogConfigClose.disabled = true;
        dialogHelp.disabled = true;
        dialogConfigStoreCheckbox.disabled = true;
        
        //load config to memory in any case
        pub.loadToMemory(api,auth,db,st);
            
        //REMEMBER ME CHECKED
        if(dialogConfigStoreCheckbox.checked){
            //save to local storage and session storage
            pub.loadToStorage(api,auth,db,st);
            pub.loadToSession(api,auth,db,st);
        // REMEMBER ME NOT CHECKED
        } else {
            pub.removeConfigFromStorage();
            pub.loadToSession(api,auth,db,st);
        }

        try{
            firebase.app().delete().then(function() {
                pub.iframeKiller();
                callback();
            });
        }catch (e){
            callback();
        }
    }

    function endEntry() {
        pub.displayConfig();
        try{
            firebase.initializeApp(fireConfig.config);
            fireConfig.initialized = true;
        } catch (e) {
            pub.toast(e,null,10000);
            fireConfig.initialized = false;
        }
        
        try{
            pub.database = firebase.database();
            fireConfig.initialized = true;
        } catch (e) {
            pub.toast(e,null,10000);
            fireConfig.initialized = false;
        }

        dialogConfigButtonCommit.disabled = false;
        dialogConfigClose.disabled = false;
        dialogHelp.disabled = false;
        dialogConfigStoreCheckbox.disabled = false;  
        
        //clear spinner
        dialogConfigProcessing.classList.add('hide');
        dialogConfigBody.classList.remove('hide');
        
        pub.buttonEnabler();
        
        //try to close out dialog
        dialogConfig.close();
    }

    //fire.push(args)
    pub.push = function(args) {
        //var newPostKey = firebase.database().ref().child('posts').push().key;
        var thisRef = pub.database.ref(args.path).child(args.child);
        var obj = {};
        obj[args.key] = args.val;           
        thisRef.push(obj, onComplete);
    };
    
    //fire.set(args)
    pub.set = function(args) {
        var thisRef = pub.database.ref(args.path).child(args.child);
        var obj = {};
        obj[args.key] = args.val;           
        thisRef.set(obj, onComplete);
    };
    
    //fire.transaction(args)
    pub.transaction = function(args) {
        var obj = {};
        obj[args.key] = args.val; 
        pub.database.ref(args.path).transaction(function(currentData) {
            if (currentData === null) {
                return { whatever: obj };
            } else {
                pub.toast(args.key + ':' + args.val + ' already exists.');
                return; // Abort the transaction.
            }
        }, function(error, committed, snapshot) {
            if (error) {
                pub.toast('Transaction Failed Abnormally!', error);
            } else if (!committed) {
                pub.toast('Transaction Aborted');
            } else {
                pub.toast("Transaction Result: ", JSON.stringify(snapshot.val()));
            }
        });
    };
    
    //fire.update(args)
    pub.update = function(args) {
        var thisRef = pub.database.ref(args.path).child(args.child);
        var obj = {};
        obj[args.key] = args.val; 
        thisRef.update(obj, onComplete);
    };
    
    function conditionInputs(path,child){
        if(!path && !child){
            pub.toast('Warning: "/" Added to Path and Child: Null Not Allowed for Path or Child');
            return ["/","/"];
        } else if (!path){
            pub.toast('Warning: "/" Added to Path: Null Not Allowed for Path');
            return ["/",child];
        } else if (!child){
            pub.toast('Warning: "/" Added to Child: Null Not Allowed for Child');
            return [path,"/"];        
        }
        else {
            return [path,child];
        }
    }

    var onComplete = function(error) {
        if (error) {
            pub.toast('Error ' + error);
        } else {
            pub.toast('Success');
        }
    };
    
    pub.displayConfig = function(){
        var msg = '<span class="mdl-color-text--red-600">config not found!</span>';
        if(fireConfig.config.apiKey){
            apiKeySpan.innerHTML = fireConfig.config.apiKey.toString();
        } else {
            apiKeySpan.innerHTML = msg;
        }
        if(fireConfig.config.authDomain){
            authDomainSpan.innerHTML = fireConfig.config.authDomain.toString();
        } else {
            authDomainSpan.innerHTML = msg;
        } 
        if(fireConfig.config.databaseURL){
            databaseUrlSpan.innerHTML = fireConfig.config.databaseURL.toString();
        } else {
            databaseUrlSpan.innerHTML = msg;
        } 
    }

    pub.toast = function(msg,obj,timeout){
        var snackbarContainer = doc.querySelector('#toast'); //toast div
        if(!obj){obj = ''}
        if(!timeout){timeout = 2750}
        var data = {
            message: msg + obj,
            timeout: timeout
        };
        snackbarContainer.MaterialSnackbar.showSnackbar(data);
    }
    
    //eg, toastUp('Nothing Found.  Click <a href="/admin">Meetings Manager</a>.');
    pub.toastUp = function (msg){
        var toast = doc.querySelector('#toast');
        var snackbarText = doc.querySelector('.mdl-snackbar__text');
        snackbarText.innerHTML = msg;
        toast.classList.add("mdl-snackbar--active");
    }
    
    //eg, toastDown(2000);
    pub.toastDown = function (count) {
        setTimeout(function () {
            var toast = doc.getElementById("toast");
            toast.classList.remove("mdl-snackbar--active");
            toast.setAttribute('aria-hidden', 'true');
        }, timer * count);
    }

    //API
    return pub;
}());

function r(f){/in/.test(document.readyState)?setTimeout('r('+f+')',9):f()}


