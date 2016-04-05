<?php
/*
* YesFinder v1.2.0
* Steven Ye
* Email: steven_ye@foxmail.com
* Date: 2016-4-3
*/

define('YESFINDER','1.0');
if(!file_exists('connector.class.php')){
	$data['error']='File \'connector.class.php\' doesn\'t exist.';
	die(json_encode($data));
}

require('connector.class.php');

$config=array(
	'BasePath'=>'../../uploads/',
	'BaseUrl'=>'uploads/',
    'IconPath'=>'../skins/images/icons/64/',
	'IconUrl'=>'src/skins/images/icons/64/',
	//,'fileType'=>'jpg,gif,png,jpeg'
);

$connector = new Connector($config);
$connector->run();

