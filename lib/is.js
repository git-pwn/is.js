//
//     is.js - 1.0.2
//     Minimalistic predicate library
//     Pwn <hi@pwn.buzz>
//

( function ( root , factory ) {

if ( typeof define === 'function' && define.amd ) {

    // AMD. Register as an anonymous module.
    define( factory )

} else if ( typeof module === 'object' && module.exports ) {

    // Node. Does not work with strict CommonJS, but only CommonJS-like
    // environments that support `module.exports`, like Node.
    module.exports = factory()

} else {

    // Browser globals
    root.is = factory()

}

} )( this , function factory() {

    var is = { not : {} }
    var util

    var hasOwnProperty = Object.prototype.hasOwnProperty


    //
    // __getTag( value )__
    //
    // Get the _[[class]]_ attribute, or _tag_ in `is.js` terminology, of any
    // given value.
    //

    var getTag = ( function () {

        var reSource = /(?:function|class)\s*(\w*)/

        var toString = Object.prototype.toString
        var toSource = Function.prototype.toString

        return function tagOf( value ) {

            var tagFromClass
            var tagFromSource

            if ( value === null ) {
                return 'null'
            } else if ( value === void 0 ) {
                return 'undefined'
            }

            tagFromClass = toString.call( value )
            tagFromClass = tagFromClass.substring( 8 , tagFromClass.length - 1 )

            if ( typeof value.constructor !== 'function' ) {
                return tagFromClass.toLowerCase()
            } else {
                tagFromSource = toSource.call( value.constructor ).match( reSource )[ 1 ]
                return ( tagFromSource || tagFromClass ).toLowerCase()
            }

        }

    } )()


    //
    // __ownKeys( value )__
    //
    // `Object.keys` ponyfill.
    //

    var ownKeys = Object.keys || ( function ( dontEnums ) {

        var dontEnumsLength = dontEnums.length
        var hasDontEnumBug = !{ toString : null }.propertyIsEnumerable( 'toString' )

        return function ownKeys( object ) {

            var key
            var keys = []
            var index

            if ( object === null || object === void 0 ) {
                throw new TypeError( 'ownKeys called on non-object' )
            }

            for ( key in object ) {
                if ( hasOwnProperty.call( object , key ) ) {
                    keys.push( key )
                }
            }

            // Fix IE < 9 _JScript DontEnum Bug_.
            if ( hasDontEnumBug ) {
                for ( index = 0 ; index < dontEnumsLength ; index += 1 ) {
                    key = dontEnums[ index ]
                    if ( hasOwnProperty.call( object , key ) ) {
                        keys.push( key )
                    }
                }
            }

            return keys

        }

    } )( [

        // These properties are marked as _DontEnum_ in IE < 9.
        // They will never show up in `for...in` loops nor pass
        // `propertyIsEnumerable` check.
        'toString' ,
        'toLocaleString' ,
        'valueOf' ,
        'isPrototypeOf' ,
        'hasOwnProperty' ,
        'propertyIsEnumerable' ,
        'constructor'

    ] )


    util = {

        //
        // __util.addPredicate( name , predicate )__
        //
        // Add new checks(or _predicates_ in `is.js` terminology).
        //

        addPredicate : function addPredicate( name , predicate ) {

            if ( /^(not|use)$/.test( name ) ) {
                throw new Error( '"' + name + '" is a reserved name' )
            }

            if ( hasOwnProperty.call( is , name ) ) {
                throw new Error( 'predicate "' + name + '" already defined' )
            }

            if ( typeof predicate !== 'function' ) {
                throw new TypeError( 'predicate must be a function' )
            }

            is[ name ] = predicate
            is.not[ name ] = function delegate() {
                return !predicate.apply( null , arguments )
            }

        }

    }


    //
    // __is.use( bundle )__
    //
    // Define new _bundles_(collection of related _predicates_).
    //

    is.use = function use( bundle ) {

        if ( typeof bundle === 'function' ) {

            //
            // `bundle` takes two parameters(order matters):
            //
            //    - `util`: The utility object.
            //    - `is`: The `is` export.
            //
            // The `util` and `is` export is passed in as free variables so that
            // one can write standalone bundles without referencing `is.js` first.
            //
            //    ```js
            //    // standalone bundle, does not depend on `is.js`
            //    module.exports = function bundle( util , is ) {
            //        util.addPredicate( 'eq' , function ( value , other ) {
            //            if ( is.not.object( value ) || is.not.object( other ) ) {
            //                return false
            //            }
            //            return value.uuid = other.uuid
            //        } )
            //    }
            //    ```
            //
            // To import the bundle:
            //
            //    ```js
            //    is.use( require( 'path/to/bundle' ) )
            //    ```
            //

            bundle( util , is )

        }

    }


    //
    // # CORE BUNDLES
    // Predicates shipped with `is.js`, packaged in various bundles.
    //


    //
    // ### bundle:nil
    //

    is.use( function nilBundle( util ) {

        //
        // __is.null( value )__
        //
        // Checks whether given value is `null`.
        //

        util.addPredicate( 'null' , function isNull( value ) {
            return value === null
        } )


        //
        // __is.undefined( value )__
        //
        // Checks whether given value is `undefined`.
        //

        util.addPredicate( 'undefined' , function isUndefined( value ) {
            return value === void 0
        } )


        //
        // __is.exist( value )__
        //
        // Checks whether given value exists, i.e, not `null` nor `undefined`.
        //

        util.addPredicate( 'exist' , function isExist( value ) {
            return value != null // eslint-disable-line no-eq-null
        } )


        //
        // __is.nil( value )__
        //
        // Checks whether given value is either `null` or `undefined`.
        //

        util.addPredicate( 'nil' , function isNil( value ) {
            return value == null // eslint-disable-line no-eq-null
        } )

    } )


    //
    // ### bundle:number
    //

    is.use( function numberBundle( util ) {

        //
        // __is.number( value )__
        //
        // Checks whether given value is a number.
        //

        util.addPredicate( 'number' , function isNumber( value ) {
            return typeof value === 'number'
        } )


        //
        // __is.numeral( value )__
        //
        // Checks whether given value is a numeral, i.e:
        //
        // - a genuine finite number
        // - or a string that represents a finite number
        //

        util.addPredicate( 'numeral' , function isNumeral( value ) {

            var tag = getTag( value )
            if ( tag !== 'number' && tag !== 'string' ) {
                return false
            }

            if ( is.emptyString( value ) ) {
                return false
            }

            try {
                value = Number( value )
            } catch ( error ) {
                return false
            }

            return is.finite( value )

        } )


        //
        // __is.nan( value )__
        //
        // Checks whether given value is `NaN`.
        //

        util.addPredicate( 'nan' , function isNaN( value ) {
            return value !== value // eslint-disable-line no-self-compare
        } )


        //
        // __is.odd( number )__
        //
        // Checks whether given value is an odd number.
        //

        util.addPredicate( 'odd' , function isOdd( number ) {
            return is.integer( number ) && number % 2 === 1
        } )


        //
        // __is.even( number )__
        //
        // Checks whether given value is an even number.
        //

        util.addPredicate( 'even' , function isEven( number ) {
            return is.integer( number ) && number % 2 === 0
        } )


        //
        // __is.finite( number )__
        //
        // Checks whether given value is a finite number.
        //

        if ( Number.isFinite ) {
            util.addPredicate( 'finite' , Number.isFinite )
        } else {
            util.addPredicate( 'finite' , function isFiniteNumber( number ) {
                return is.number( number ) && isFinite( number )
            } )
        }


        //
        // __is.infinite( number )__
        //
        // Checks whether given value is an infinite number, i.e: +∞ or -∞.
        //

        util.addPredicate( 'infinite' , function isInfinite( number ) {
            return number === +1 / 0 || number === -1 / 0
        } )


        //
        // __is.integer( number )__
        //
        // Checks whether given value is an integer.
        //

        if ( Number.isInteger ) {
            util.addPredicate( 'integer' , Number.isInteger )
        } else {
            util.addPredicate( 'integer' , function isInteger( number ) {
                return is.finite( number ) && Math.floor( number ) === number
            } )
        }


        //
        // __is.safeInteger( number )__
        //
        // Checks whether given value is a safe integer.
        //

        if ( Number.isSafeInteger ) {
            util.addPredicate( 'safeInteger' , Number.isSafeInteger )
        } else {
            ( function () {

                var MAX = Number.MAX_SAFE_INTEGER || Math.pow( 2 , 53 ) - 1
                var MIN = Number.MIN_SAFE_INTEGER || -MAX

                util.addPredicate( 'safeInteger' , function isSafeInteger( number ) {
                    return is.integer( number ) && ( number >= MIN && number <= MAX )
                } )

            } )()
        }

    } )


    //
    // ### bundle:string
    //

    is.use( function stringBundle( util ) {

        //
        // __is.string( value )__
        //
        // Checks whether given value is a string.
        //

        util.addPredicate( 'string' , function isString( value ) {
            return typeof value === 'string'
        } )


        //
        // __is.emptyString( string )__
        //
        // Checks whether given value is an empty string, i.e, a string with
        // whitespace characters only.
        //

        util.addPredicate( 'emptyString' , function isEmptyString( string ) {
            return is.string( string ) && /^\s*$/.test( string )
        } )


        //
        // __is.substring( substring , string , [offset=0] )__
        //
        // Checks whether one string may be found within another string.
        //

        util.addPredicate( 'substring' , function isSubstring( substring , string , offset ) {

            var length

            if ( getTag( string ) !== 'string' ) {
                return false
            }

            length = string.length
            offset = is.integer( offset ) ? offset : 0

            // Allow negative offsets.
            if ( offset < 0 ) {
                offset = length + offset
            }

            if ( offset < 0 || offset >= length ) {
                return false
            }

            return string.indexOf( substring , offset ) !== -1

        } )


        if ( String.prototype.startsWith && String.prototype.endsWith ) {

            //
            // __is.prefix( prefix , string )__
            //
            // Checks whether `string` starts with `prefix`.
            //

            util.addPredicate( 'prefix' , function isPrefix( prefix , string ) {
                return getTag( string ) === 'string' && string.startsWith( prefix )
            } )


            //
            // __is.suffix( suffix , string )__
            //
            // Checks whether `string` ends with `suffix`.
            //

            util.addPredicate( 'suffix' , function isSuffix( suffix , string ) {
                return getTag( string ) === 'string' && string.endsWith( suffix )
            } )

        } else {

            ( function ( makePredicate ) {

                util.addPredicate( 'prefix' , makePredicate() )
                util.addPredicate( 'suffix' , makePredicate( true ) )

            } )( function makePredicate( suffix ) {

                return function predicate( affix , string ) {

                    var index
                    var offset
                    var affixLength
                    var stringLength

                    if ( getTag( string ) !== 'string' ) {
                        return false
                    }

                    affix = String( affix )

                    affixLength = affix.length
                    stringLength = string.length

                    if ( affixLength > stringLength ) {
                        return false
                    }

                    offset = suffix ? stringLength - affixLength : 0

                    for ( index = 0 ; index < affixLength ; index += 1 ) {
                        if ( string.charCodeAt( offset + index ) !== affix.charCodeAt( index ) ) {
                            return false
                        }
                    }

                    return true

                }

            } )

        }

    } )


    //
    // ### bundle:boolean
    //

    is.use( function booleanBundle( util ) {

        //
        // __is.boolean( value )__
        //
        // Checks whether given value is a boolean.
        //

        util.addPredicate( 'boolean' , function isBoolean( value ) {
            return value === true || value === false
        } )

    } )


    //
    // ### bundle:object
    //

    is.use( function objectBundle( util ) {

        //
        // __is.object( value )__
        //
        // Checks whether given value is an object.
        //

        util.addPredicate( 'object' , function isObject( value ) {
            return is.not.primitive( value )
        } )


        //
        // __is.emptyObject( object )__
        //
        // Checks whether given value is an empty object, i.e, an object without
        // any own, enumerable, string keyed properties.
        //

        util.addPredicate( 'emptyObject' , function isEmptyObject( object ) {
            return is.object( object ) && ownKeys( object ).length === 0
        } )


        //
        // __is.propertyDefined( object , path )__
        //
        // Checks whether `path` is a direct or inherited property of `object`.
        //

        util.addPredicate( 'propertyDefined' , function isPropertyDefined( object , path ) {

            var key
            var keys
            var context

            context = object
            keys = String( path ).split( '.' )

            while ( key = keys.shift() ) { // eslint-disable-line no-cond-assign
                if ( is.not.object( context ) || !( key in context ) ) {
                    return false
                } else {
                    context = context[ key ]
                }
            }

            return true

        } )


        //
        // __is.conforms( object , schema , [strict=false] )__
        //
        // Checks whether `object` conforms to `schema`.
        //
        // A `schema` is an object whose properties are functions that takes
        // these parameters(in order):
        //
        // - __value:any__ - The value of current iteration.
        // - __key:string__ - The corresponding key of current iteration.
        // - __context:object__ - The object in question.
        //
        // These functions, or _validators_, are called for each corresponding
        // key in `object` to check whether object conforms to the schema. An
        // object is said to be conforms to the schema if all validators passed.
        //
        // In strict mode(where `strict=true`), `is.conforms` also checks whether
        // `object` and `schema` has the same set of own, enumerable, string-keyed
        // properties, in addition to check whether all validators passed.
        //

        util.addPredicate( 'conforms' , function isConforms( object , schema , strict ) {

            var key
            var keys
            var index
            var length
            var validator

            if ( is.not.object( object ) || is.not.object( schema ) ) {
                return false
            }

            keys = ownKeys( schema )
            length = keys.length

            if ( strict && length !== ownKeys( object ).length ) {
                return false
            }

            for ( index = 0 ; index < length ; index += 1 ) {

                key = keys[ index ]
                validator = schema[ key ]

                if ( typeof validator !== 'function' ) {
                    continue
                }

                if ( !hasOwnProperty.call( object , key ) ||
                     !validator( object[ key ] , key , object ) ) {
                    return false
                }

            }

            return true

        } )

    } )


    //
    // ### bundle:array
    //

    is.use( function arrayBundle( util ) {

        //
        // __is.array( value )__
        //
        // Checks whether given value is an array.
        //

        if ( Array.isArray ) {
            util.addPredicate( 'array' , Array.isArray )
        } else {
            util.addPredicate( 'array' , function isArray( value ) {
                return getTag( value ) === 'array'
            } )
        }


        //
        // __is.arrayLikeObject( value )__
        //
        // Checks whether given value is an _array-like_ object.
        //
        // An object is qualified as _array-like_ if it has a property named
        // `length` that is a positive safe integer. As a special case, functions
        // are never qualified as _array-like_.
        //

        util.addPredicate( 'arrayLikeObject' , function isArrayLikeObject( value ) {

            var length

            if ( is.primitive( value ) || is[ 'function' ]( value ) ) {
                return false
            } else {
                length = value.length
                return is.integer( length ) && length >= 0 && length <= 0xFFFFFFFF // 32-bit unsigned int maximum
            }

        } )


        //
        // __is.inArray( value , array , [offset=0] , [comparator=is.equal] )__
        //
        // Checks whether given array or array-like object contains certain element.
        //
        // - __value__: The element to search.
        // - __array__: The array or array-like object to search from.
        // - __offset__: The index to search from, inclusive.
        // - __comparator__: The comparator invoked per element against `value`.
        //

        util.addPredicate( 'inArray' , function isInArray( value , array , offset , comparator ) {

            var index
            var length

            // Only works with genuine arrays or array-like objects.
            if ( is.not.arrayLikeObject( array ) ) {
                return false
            }

            if ( is[ 'function' ]( offset ) ) {
                comparator = offset
                offset = 0
            } else {
                offset = is.integer( offset ) ? offset : 0
                comparator = is[ 'function' ]( comparator ) ? comparator : is.equal
            }

            length = array.length

            // Allow negative offsets.
            if ( offset < 0 ) {
                offset = length + offset
            }

            if ( offset < 0 || offset >= length ) {
                return false
            }

            for ( index = offset ; index < length ; index += 1 ) {

                // Skip _holes_ in sparse arrays.
                if ( !hasOwnProperty.call( array , index ) ) {
                    continue
                }

                if ( comparator( value , array[ index ] ) ) {
                    return true
                }

            }

            return false

        } )

    } )


    //
    // ### bundle:type
    //

    is.use( function typeBundle( util ) {

        //
        // __is.sameType( value , other )__
        //
        // Checks whether given values are of the same type.
        //

        util.addPredicate( 'sameType' , function isSameType( value , other ) {
            return typeof value === typeof other && getTag( value ) === getTag( other )
        } )


        //
        // __is.primitive( value )__
        //
        // Checks whether given value is a primitive.
        //

        util.addPredicate( 'primitive' , function isPrimitive( value ) {
            return is.nil( value ) ||
                   is.number( value ) ||
                   is.string( value ) ||
                   is.boolean( value ) ||
                   is.symbol( value )
        } )


        //
        // Generate type check predicates for standard builtin classes.
        //

        ; ( function ( makePredicate , tags ) { // eslint-disable-line semi-spacing

            var tag
            var index
            var length = tags.length

            for ( index = 0 ; index < length ; index += 1 ) {
                tag = tags[ index ]
                util.addPredicate( tag , makePredicate( tag.toLowerCase() ) )
            }

        } )( function makePredicate( tag ) {

            return function predicate( value ) {
                return getTag( value ) === tag
            }

        } , [ 'date' , 'error' , 'function' , 'map' , 'regexp' , 'set' , 'symbol' ] )

    } )


    //
    // ### bundle:equality
    //

    is.use( function equalityBundle( util ) {

        //
        // __is.equal( value , other )__
        //
        // Checks whether given values are equal, using _SameValueZero_ algorithm.
        //

        util.addPredicate( 'equal' , function isEqual( value , other ) {
            return value === other || ( value !== value && other !== other ) // eslint-disable-line no-self-compare
        } )


        //
        // __is.deepEqual( value , other )__
        //
        // Checks whether given values are deeply equal, i.e:
        //
        // - If `Type( value ) !== Type( other )`, returns `false`.
        // - For primitives, checks whether they are equal using _SameValueZero_.
        // - For arrays, checks whether they have same set of members, all of
        //   which are deeply equal.
        // - Otherwise, checks whether they have same set of own, enumerable,
        //   string keyed properties, all of which are deeply equal.
        //

        util.addPredicate( 'deepEqual' , function isDeepEqual( value , other ) {

            if ( is.not.sameType( value , other ) ) {
                return false
            }

            if ( is.primitive( value ) ) {
                return is.equal( value , other )
            }

            if ( is.array( value ) ) {

                if ( value.length !== other.length ) {
                    return false
                }

                return ( function () {

                    var index
                    var length

                    for ( index = 0 , length = value.length ; index < length ; index += 1 ) {
                        if ( is.not.deepEqual( value[ index ] , other[ index ] ) ) {
                            return false
                        }
                    }

                    return true

                } )()

            }

            return ( function () {

                var key
                var keys
                var index
                var length

                keys = ownKeys( value )
                length = keys.length

                if ( length !== ownKeys( other ).length ) {
                    return false
                }

                for ( index = 0 ; index < length ; index += 1 ) {
                    key = keys[ index ]
                    if ( !hasOwnProperty.call( other , key ) ||
                         is.not.deepEqual( value[ key ] , other[ key ] ) ) {
                        return false
                    }
                }

                return true

            } )()

        } )

    } )


    return is

} )
