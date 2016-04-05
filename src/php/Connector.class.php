<?php
/*
* YesFinder v1.2.0
* Steven Ye
* Email: steven_ye@foxmail.com
* Date: 2016-4-3
*/

class Connector{
	function __construct($config){
		$this->config = $config;
		$this->action = isset($_GET['action'])?$_GET['action']:'';
		$this->path = isset($_GET['path'])?$_GET['path']:'';
	}
	function run(){
		if(!file_exists('connector.class.php')){
	        $data['error']='File \'yesfinder.class.php\' doesn\'t exist.';
	        return $this->output($data);
        }
        require_once('yesfinder.class.php');
		$app = new YesFinder($this->config);
		if(method_exists($app,$this->action)){
	        $data = call_user_func(array($app,$this->action),$this->path);
		}else{
			$data['error']='Invalid request.';	
        }
		$this->output($data);
	}
	function output($data){
		header('Content-type: application/json');
		echo json_encode($data);
	}
}