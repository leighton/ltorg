var connect = require("connect"), 
    moment = require("moment"),
    Hmmac = require("hmmac");

var KeyStore = function(path){
  this.store = require(path);
};

KeyStore.prototype.getCredentials = function(id,cb){
  cb(this.store[id] || null);
};

var hmac_intercept = function(config,store){

  var hmac = new Hmmac(config);

  var cred_fn = function(reqAccessKey,cb){
      store.getCredentials(reqAccessKey,function(cred){
        cb(cred ? {
          accessKeyId : cred.key,
          accessKeySecret : cred.secret
        } : null);
      });
  };

  return function(req,res,fn){
    hmac.validateHttpRequest(req, cred_fn, function(valid) {
      if (true === valid) {
        return fn(req,res);
      } else {
        res.statusCode=401;
        res.end();
      }
    });
  };

};

/*
 * slim server, just do basic routing by hand
 */
var activity = function(){

    var current = "",
        expires = null;

    return function(req,res,next){

        var get = function(req,res){
            if(current!=="" && expires!==null){
                ob = { 
                    msg : current,
                    timeout : expires.diff(moment(),'seconds')*1000
                };
                res.end(JSON.stringify(ob));
            }else{
                res.statusCode = 401;
                res.end();
            }
        };

        var put = function(req,res,next){
            if(req.body.msg && req.body.timeout){
              console.log("Updating activity message cache: message="+req.body.msg+", timeout="+req.body.timeout);
              current=req.body.msg;
              expires = moment().add('s',req.body.timeout);
              setTimeout(function(){
                current="";
                expires=null;
              },req.body.timeout*1000);
              res.statusCode = 200;
              res.write("{result:'Activity message cache has been updated!'}");
            }
            res.end();
        };

        var hmac = (function(){
          var config = require('etc/hmmac-config.json');
          var store = new KeyStore('etc/api-keys.json');
          return hmac_intercept(config,store);
        })();

        if(req.url==="/activity"){
            switch(req.method){
                case 'GET':
                    get(req,res);
                    break;
                case 'PUT':
                    hmac(req,res,put);
                    break;
                default:
                    next(req,res);
            }
        }else{
            next();
        }
    };
};

var app = connect()
    .use(connect.logger('short'))
    .use(connect.json())
    .use(connect.static('public'))
    .use(activity())
    .listen(3000);

console.log("Server is listening on port: "+3000);
