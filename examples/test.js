var util = require("util");
var vargs = require("./../");

function testFunc(id, options, cb){
	var args = vargs.exec(arguments);
	console.log(util.inspect(args));
}
testFunc.args = {id : String, options: {type : Object, required: false, default : {}}, callback : {type: Function, required:false, args:{min:1, max:3}}};

testFunc("id");