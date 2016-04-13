/**
 * 完全不同的域
 * 存在处于不同位置的相同域
 * 存在一个绵长的域，查询过程中会先被认为是两个域，在后续的查询过程中发现联结的情况
 * 所有域的综合不是一个完整的矩形的情况
 *
 *
 */
var FS = require( 'fs' );
var ConnectedDomain = require( '../index' );
var dataArrays = FS.readFileSync( './domains/separate.txt').toString().split( /\n\r?/ );
var datas = [];

dataArrays.forEach(function( line, index ){
    datas[ index ] = line.split( '' );
});

console.log( ConnectedDomain( datas, function( value ){
    if( value === ' ' ){
        return 'blank';
    }
    else {
        return 'not-blank';
    }
}));
