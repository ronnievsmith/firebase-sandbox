/*
fire.js v0.1 - Simple datetime add-on tools for JavaScript
Created by Ron Royston, https://rack.pub
https://github.com/rhroyston/fire-js
License: MIT

fire.push(args)
fire.update(args)
fire.set(targs)
fire.transaction(args)
fire.toast(msg)
*/

// slick pure javascript implementation of jQuery.ready, function r at end of code.  This ensures MDL toast works for error alerting
r(function(){
    //are we configured or not and if not grey out buttons and don't reference firebase.database()
    if(fireConfig.isConfigured){
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
    }
    fire.actionEnabler();
    
    //Capture errors and send to toast
    window.onerror = function (msg, url, lineNo, columnNo, error) {
        var string = msg.toLowerCase();
        var substring = "script error";
        if (string.indexOf(substring) > -1){
            fire.toast('Script Error: See Browser Console for Detail',null,4000);
        } else {
            fire.toast(msg,null,4000);
        }
      return false;
    };
});


//Revealing Module Pattern (Public & Private) w Public Namespace 'fire'
var fire = (function() {

    // object to expose as public properties and methods such as clock.now
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
    var buttonPush = doc.getElementById('button-push');
    var buttonUpdate = doc.getElementById('button-update');
    var buttonSet = doc.getElementById('button-set');
    var buttonTransaction = doc.getElementById('button-transaction');
    var pathInput = doc.getElementById('path-input');
    var childInput = doc.getElementById('child-input');
    var keyInput = doc.getElementById('key-input');
    var valueInput = doc.getElementById('value-input');
    var checkboxNoValue = doc.getElementById('checkbox-no-value');
    var actionButtons = doc.getElementsByClassName('action-button');
    var rackButton = doc.getElementById('rack');
    var licenseButton = doc.getElementById('license');
    var configureButton = doc.getElementById('configure');
    
    
    var dialogConfig = doc.getElementById('dialog-config');
    var dialogConfigTopIcon = doc.getElementById('dialog-config-top-icon');
    //dialog-config-content
    
    var dialogConfigProcessing = doc.getElementById('dialog-config-processing');
    var dialogConfigBody = doc.getElementById('dialog-config-body');
    var dialogConfigActions = doc.getElementById('dialog-config-actions');
    
    
    var dialogConfigClose = doc.getElementById('dialog-config-close');


    var dialogConfigStoreCheckbox = doc.getElementById('dialog-config-store-checkbox');
    
    //new ones
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

    var dialogConfigButtonCommit = doc.getElementById('dialog-config-button-commit');
    var apiKeyInput = doc.getElementById('apiKey-input');
    var authDomainInput = doc.getElementById('authDomain-input');
    var databaseURLInput = doc.getElementById('databaseURL-input');
    var storageBucketInput = doc.getElementById('storageBucket-input');
    

    
    

    // Get a reference to the database service
    pub.database;
        
    //make the buttons work
    attachListeners();

    // display config data on card
    displayFirebaseConfigData();
    
    pub.actionEnabler = function(){
        if(fireConfig.initialized){
            //enable action buttons
            buttonPush.disabled = false;
            buttonUpdate.disabled = false;
            buttonSet.disabled = false;
            buttonTransaction.disabled = false;
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
        licenseButton.addEventListener("click", function(e){
            window.location = "https://tldrlegal.com/license/mit-license";
        });
        dialogConfigClose.addEventListener("click", function(){
            dialogConfig.close();
        });
        dialogHelpClose.addEventListener("click", function(){
            dialogHelp.close();
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
            alert('fork clicked');
        });
        
        configureButton.addEventListener("click", function(){
            if (!configureButton.showModal) {
                dialogPolyfill.registerDialog(dialogConfig);
            }
            dialogConfig.showModal();
            //try and hide
            //need to populate the inputs if the data is there
            if(fireConfig.apiKey){apiKeyInput.value = fireConfig.apiKey;}
            if(fireConfig.authDomain){authDomainInput.value = fireConfig.authDomain;}
            if(fireConfig.databaseURL){databaseURLInput.value = fireConfig.databaseURL;}
            if(fireConfig.storageBucket){storageBucketInput.value = fireConfig.storageBucket;}
            //MDL Bug Fix
            var dialogInputs = doc.querySelectorAll('.dialog-inputs');
            for (var i = 0, l = dialogInputs.length; i < l; i++) {
                dialogInputs[i].MaterialTextfield.checkDirty();
            }
            //focus on input no 1
            apiKeyInput.focus();
        });

        dialogConfigButtonCommit.addEventListener("click", function(){
            //on close
            //if all fields are filled 
            runEntry(endEntry);
        });
    }

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
        //componentHandler.upgradeAllRegistered();
        
        dialogConfigButtonCommit.disabled = true;
        dialogConfigClose.disabled = true;
        dialogHelp.disabled = true;
        dialogConfigStoreCheckbox.disabled = true;
        //window.componentHandler.upgradeAllRegistered();

        //Store the input
        if (typeof(Storage) !== "undefined") {
            // Store
            localStorage.setItem("apiKey",api);
            localStorage.setItem("authDomain",auth);
            localStorage.setItem("databaseURL",db);
            localStorage.setItem("storageBucket",st);
        } else {
            pub.toast('Remember Data Operation Failed: No Web Storage support.',null,4000);
        }

        //initialize the firebase config to memory
        fireConfig.initConfig(api,auth,db,st);
            
        // Call the end Entry callback
        callback();
    }

function endEntry() {
    dialogConfigButtonCommit.disabled = false;
    dialogConfigClose.disabled = false;
    dialogHelp.disabled = false;
    dialogConfigStoreCheckbox.disabled = false;  
    
    //clear spinner
    dialogConfigProcessing.classList.add('hide');
    dialogConfigBody.classList.remove('hide');
    
    // display config data on card
    displayFirebaseConfigData(); 
    try{
        // Initialize Firebase
        //firebase.initializeApp(fireConfig.config); ****************** can't reinit?
        // Get a reference to the database service
        //var database = firebase.database();
        //all goo so close out dialog and stuff
        dialog.close();
        fireConfig.initialized = true;
        pub.actionEnabler();
    } catch (e){
        pub.toast('Firebase Initialization Failed' + e,null,4000);
    }
    location.reload();
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

    function displayFirebaseConfigData(){
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


