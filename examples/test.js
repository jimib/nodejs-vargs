var vargs = require("./../");

var TestClass = function(){
	
}

//TEST METHOD
TestClass.prototype.getSomething = function(id, options, cb){
	var args = vargs.exec(arguments);
	console.log("getSomething: ", args);
}
TestClass.prototype.getSomething.args = {
	id : String, 
	options: {type : Object, required: false, default : {}}, 
	callback : {type: Function, args:2}
};

var instance = new TestClass();

vargs.help(TestClass.prototype.getSomething);
vargs.help(instance.getSomething);

//try calling the method with correct parameters
instance.getSomething("id", function(err, result){
	
});

instance.getSomething("id", {page:1}, function(err, result){
	
});

//try again but with an error
instance.getSomething("id", {page:1}, function(err){
	
});