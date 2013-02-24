var util = require("util");

Vargs = module.exports = function(){
	
}

/*example
var schemas = {
	id : {type:String, required:true},
	options : {type:[Array,Object], default:null},
	cb : {type:Function, required:true}
}
*/

Vargs.exec = function(args, schemas){
	schemas = schemas || args.callee.args;
	if(schemas == null){
		throw new Error("No schemas provided and the arguments.callee has no args defined - see README for instructions");
	}
	
	var result = {};
	
	//VALIDATE THE CONFIGURATOR FOR THE ARGUMENTS BEFORE WE USE IT
	var ids = [], hasNonRequiredParams = false, hasCallback = false, callbackId = null, callbackRequired = null, 
	minRequired = 0, maxRequired = 0;
	for(var id in schemas){
		//add to stack for easier reference later
		ids.push(id);
		
		if(!schemas[id]){
			//ERROR:null schemas provided for parameter
			throw new Error("Null schema provided for parameter '"+id+"'");
		}
		
		//STANDARDISE THE CONFIG VALUE - so if {id:String}, replace it with {id:{type:String}}
		if(schemas[id] instanceof Function){
			schemas[id] = {type:schemas[id]};
		}
		
		//STANDARDISE REQUIRED
		schemas[id].id = id;//make note of the id for reference
		var required = schemas[id].required = isParamRequired(schemas[id]);
		
		//increment minRequired count
		if(required){
			minRequired++;
		}
		maxRequired++;
		
		//IF WE HAVE CALL BACK THEN THERE'S BEEN A MISTAKE
		if(hasCallback){
			//ERROR:processing another parameter after a callback was defined
			throw new Error("Additional parameter '"+id+"' defined after callback '"+callbackId+"'");
		}
		
		
		//IF PROVIDED A CALLBACK THEN VALIDATE IT
		if(id == "cb" || id == "callback"){
			if(schemas[id].type !== Function){
				throw new Error("Reserved parameter '"+id+"' used without {type:Function}");
			}
			
			hasCallback = true;
			callbackRequired = required;
			callbackId = id;
			
			//STANDARISE THE ARGS OPTION
			if(schemas[id].args){
				//IF JUST PROVIDED A NUMBER THEN THIS IS THE MIN AND MAX
				if(!isNaN(schemas[id].args)){
					schemas[id].args = {min:schemas[id].args, max : schemas[id].args};
				}
				//makesure we have a minimum and maximum
				schemas[id].args.min = isNaN(schemas[id].args.min) ? 0 : schemas[id].args.min;
				schemas[id].args.max = isNaN(schemas[id].args.max) ? Infinity : schemas[id].args.max;
			}
		}
		
		//check if have a non required argument followed by a required
		if(hasNonRequiredParams && required){
			//only expecption to this is if the schemas[id] is the callback
			if(!hasCallback){
				throw new Error("Not able to have a non-required parameter followed by required parameter '"+id+"'");
			}
		}
		
		//switch - becomes active when we a hasNonRequiredParams
		hasNonRequiredParams = hasNonRequiredParams || (!required);
	}
	 
	if(args.length < minRequired){
		throw new Error("Too few arguments, expected minimum of "+minRequired+" but received "+args.length);
	}
	
	if(args.length > maxRequired){
		throw new Error("Too many arguments, expected maximum of "+maxRequired+" but received "+args.length);
	}
	//SORT THE ARGUMENTS - use the schemas to unwrap the arguments
	var ic = -1;
	function hasNextArgumentSchema(){
		return (ic + 1) < ids.length ? true : false
	}
	
	function getNextArgumentSchema(){
		var schema = hasNextArgumentSchema() ? schemas[ids[++ic]] : null;
		if(schema == null){
			throw new Error("Too many arguments provided - schema was exhausted");
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
				throw new Error("Arguments don't match schema, required params '"+schema.id+"' is missing\n\n[Schema "+util.inspect(schemas)+"]\n\n[Arguments "+util.inspect(args)+"]");
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
				throw new Error(err);
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
	if(method instanceof Function && method.args){
		console.log("help: ", method.name || "anonymous function");
		var schemas = method.args;
		for(var i in schemas){
			var schema = schemas[i];
			console.log("\t",i, schema);
		}
	}
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