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

console.log("\n/*NOW TO USE THE INSTANCE WE CREATED*/\n");
//try calling the method with correct parameters
instance.getSomething("id", function(err, result){
	
});

instance.getSomething("id", {page:1}, function(err, result){
	
});

try{
	//try again but delibrately make a mistake (only 1 parameter expected on callback)
	instance.getSomething("id", {page:1}, function(err){
	
	});
}catch(err){
	console.log(err);
}
