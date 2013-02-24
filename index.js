var util = require("util");

Vargs = module.exports = function(){
	
}

/*example
var config = {
	id : {type:String, required:true},
	options : {type:[Array,Object], default:null},
	cb : {type:Function, required:true}
}

*/

Vargs.exec = function(args, config){
	config = config || args.callee.args;
	if(config == null){
		error("No config provided and the arguments.callee has no args defined - see README for instructions");
	}
	
	var result = {};
	
	//VALIDATE THE CONFIGURATOR FOR THE ARGUMENTS BEFORE WE USE IT
	var ids = [], hasNonRequiredParams = false, hasCallback = false, callbackId = null, callbackRequired = null, 
	minRequired = 0, maxRequired = 0;
	for(var id in config){
		//add to stack for easier reference later
		ids.push(id);
		
		if(!config[id]){
			//ERROR:null config provided for parameter
			error("Null config provided for parameter '"+id+"'");
		}
		
		//STANDARDISE THE CONFIG VALUE - so if {id:String}, replace it with {id:{type:String}}
		if(config[id] instanceof Function){
			config[id] = {type:config[id]};
		}
		
		//STANDARDISE REQUIRED
		config[id].id = id;//make note of the id for reference
		var required = config[id].required = isParamRequired(config[id]);
		
		//increment minRequired count
		if(required){
			minRequired++;
		}
		maxRequired++;
		
		//IF WE HAVE CALL BACK THEN THERE'S BEEN A MISTAKE
		if(hasCallback){
			//ERROR:processing another parameter after a callback was defined
			error("Additional parameter '"+id+"' defined after callback '"+callbackId+"'");
		}
		
		
		//IF PROVIDED A CALLBACK THEN VALIDATE IT
		if(id == "cb" || id == "callback"){
			if(config[id].type !== Function){
				error("Reserved parameter '"+id+"' used without {type:Function}");
			}
			
			hasCallback = true;
			callbackRequired = required;
			callbackId = id;
			
			//STANDARISE THE ARGS OPTION
			if(config[id].args){
				//IF JUST PROVIDED A NUMBER THEN THIS IS THE MIN AND MAX
				if(!isNaN(config[id].args)){
					config[id].args = {min:config[id].args, max : config[id].args};
				}
				//makesure we have a minimum and maximum
				config[id].args.min = isNaN(config[id].args.min) ? 0 : config[id].args.min;
				config[id].args.max = isNaN(config[id].args.max) ? Infinity : config[id].args.max;
			}
		}
		
		//check if have a non required argument followed by a required
		if(hasNonRequiredParams && required){
			//only expecption to this is if the config[id] is the callback
			if(!hasCallback){
				throw new Error("Not able to have a non-required parameter followed by required parameter '"+id+"'");
			}
		}
		
		//switch - becomes active when we a hasNonRequiredParams
		hasNonRequiredParams = hasNonRequiredParams || (!required);
	}
	 
	if(args.length < minRequired){
		error("Too few arguments, expected minimum of "+minRequired+" but received "+args.length);
	}
	
	if(args.length > maxRequired){
		error("Too many arguments, expected maximum of "+maxRequired+" but received "+args.length);
	}
	//SORT THE ARGUMENTS - use the config to unwrap the arguments
	var ic = -1;
	function hasNextArgumentSchema(){
		return (ic + 1) < ids.length ? true : false
	}
	
	function getNextArgumentSchema(){
		var schema = hasNextArgumentSchema() ? config[ids[++ic]] : null;
		if(schema == null){
			error("Too many arguments provided - schema was exhausted");
		}
		return schema;
	}
	
	var i = -1, lim = args.length;
	
	while(++i < lim){
		var id = ids[i];
		var arg = args[i];
		var schema = getNextArgumentSchema();

		//if it doesn't fit and it's not required then drop it and test if the next parameter fits
		while(!isValidArgument(arg, schema)){
			//that argument didn't match the schema - keep trying until we get a schema that does
			if(schema.required){
				error("Arguments don't match schema, required params '"+schema.id+"' is missing\n\n[Schema "+util.inspect(config)+"]\n\n[Arguments "+util.inspect(args)+"]");
			}else{
				//take the default value for this item
				result[schema.id] = schema.default;
			}
			
			schema = getNextArgumentSchema();
		}
		
		//the argument we were provided is valid so pass it on
		result[schema.id] = !isUndefined(arg) ? arg : schema.default;
		
		//if it's the callback we need to validate it
		if(schema.id == callbackId && schema.args){
			console.log("validate callback");
			var err;
			if(arg.length < schema.args.min){
				err = "Too few parameters provided on callback";
			}else if(arg.length < schema.args.max){
				err = "Too many parameters provided on callback";
			}
			
			if(err){
				err += ", ";
				if(schema.args.min == schema.args.max){
					err += "expected " + schema.args.min;
				}else if(!isNaN(schema.args.min) && !isNaN(schema.args.max)){
					err += "expected ("+schema.args.min+","+schema.args.max+")";
				}else if(!isNaN(schema.args.min)){
					err += "expected more than "+schema.args.min;
				}else if(!isNaN(schema.args.max)){
					err += "expected more than "+schema.args.max;
				}
				error(err);
			}
		}
	}
	
	//make sure we have accounted for all the values in the schema
	while(hasNextArgumentSchema()){
		var schema = getNextArgumentSchema();
		result[schema.id] = schema.default;
	}
	
	return result;
}

Vargs.help = function(method){
	
}

function error(err, msgConsole){
	//console.warn(msgConsole || err);
	throw new Error(err);
}

function isUndefined(val){
	return val == undefined || val == null ? true : false;
}

function isParamRequired(param){
	return param.required == false ? false : true
}

function isValidArgument(arg, schema){
	//edge case - don't want Object catching everything
	if(schema.type == Object){
		if(arg.constructor == String || arg instanceof Function){
			return false;
		}
	}
	//is valid if matches type or is undefined
	return isUndefined(arg) || isUndefined(schema.type) || (arg instanceof schema.type) || (arg.constructor === schema.type) ? true : false;
}