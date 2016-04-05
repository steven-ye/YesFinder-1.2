<?php
/*
* YesFinder v1.2.0
* Steven Ye
* Email: steven_ye@foxmail.com
* Date: 2016-4-3
*/

if(!defined('YESFINDER'))die('Illegal request.');

class YesFinder{
	private $config;
	private $fileType;
	private $allowType = 'jpg,gif,png,jpeg,bmp,ai,psd,eps,cdr,tiff,raw,rar,zip,gzip,7z,txt,rtf,pdf,css,doc,docx,xls,xlsx,ppt,pptx,pages,numbers,xml,rss,fla,flv,acc,aif,avi,mp3,mp4,mov,wav,wmv,atom,sql';
	private $path;
	
	function __construct($config){
		$this->config = $config;
		extract($config);
		$this->BasePath = isset($BasePath)?$BasePath:'../uploads/';
		$this->IconPath= isset($IconPath)?$IconPath:'../skins/images/icons/64/';
		$this->fileType = $fileType = isset($fileType)?$fileType:'';
		$this->allowType = empty($fileType)?$this->allowType:$fileType;
		if(!is_dir($this->BasePath))mkdir($this->BasePath,0777,true);
	}
	function init(){
		$data['baseurl']=$this->config['BaseUrl'];
		$data['iconurl']=$this->config['IconUrl'];
		return $data;
	}
	function files($path=''){
		$data =array();
		$path = $path=='/'?$this->BasePath:$this->BasePath.$path;
		$path = trim($path,'/');
		if(!is_dir($path))return false;
		if(empty($this->fileType)||$this->fileType=='*'){
			$files = glob($path.'/*');
		}else{
		    $files = glob($path.'/*.{'.$this->fileType.'}',GLOB_BRACE);
		}
		
		$iconlist=scandir($this->IconPath);
		$i=0;
		foreach($files as $file){
			if(is_dir($file))continue;
			$f = [];
			$f['filename'] = basename($file);
			$filetype = strtolower(substr(strrchr($file, "."), 1));
			if(!empty($filetype)&&in_array($filetype.'.png',$iconlist))
			    $f['fileicon'] = $filetype.'.png';
			else
			    $f['fileicon'] = 'unknown.png';
			//if(is_dir($file))$f['fileicon'] = 'folder.png';
			$f['filesize'] = $this->format_bytes(filesize($file));
			$f['filetime'] = date('Y-m-d H:i:s',filemtime($file));
			
			$data[$i]=$f;
			$i++;
		}
		return $data;
	}
	
	function folders($path=''){
		$path = trim($path,'/');
		$dir = $path=='/'?$this->BasePath:$this->BasePath.'/'.$path.'/';
		
		$files = glob($dir.'*',GLOB_ONLYDIR);
		$i=0; $data = array();
		foreach($files as $file){
			if($file=='.'||$file=='..')continue;
			$filename = basename($file);
			$data[$i]['name']=$filename;
			$data[$i]['path']=empty($path)?$filename:$path.'/'.$filename;
			$data[$i]['son']=$this->folders($path.'/'.$filename);
			$i++;
		}
		return $data;
	}
	
	function newfolder($path=''){
		$newname = basename($path);
		$parent = dirname($path);
		$parent = $parent=='/'?$this->BasePath:$this->BasePath.$parent;
		
		if(!is_dir($parent)){
			$data['error'] = "The folder '{$path}' isn\'t existed.";
		}elseif(is_dir($parent.'/'.$newname)){
			$data['error'] = "The folder '{$path}/{$newname}' is already existed.";
		}else{
			try{ 
				if(mkdir($parent.'/'.$newname)){
					$data = true;
				}else{
					$data['error'] = 'Failed to create a new folder';
				}
			}
			catch(Exception $e){
				$data['error'] = $e->getMessage();
			}
		}
		return $data;
	}
	function change($path=''){
		$arr = explode('||',$path);
		$oldpath = trim($arr[0]);
		$newname = isset($arr[1])?$arr[1]:'';
		$old = $this->BasePath.$oldpath;
		if(empty($newname)){
			$data['error'] = "A new name is required.";
		}elseif(empty($old)){
			$data['error'] = "Please choose a folder first.";
		}elseif(is_dir($old)){
			$new = dirname($old).'/'.$newname;
			try{ 
				if(rename($old,$new)){
					$data = true;
				}else{
					$data['error'] = 'Failed to create a new folder';
				}
			}
			catch(Exception $e){
				$data['error'] = $e->getMessage();
			}
		}else{
			$data['error'] = "Folder '$oldpath' doesn't exist.";
		}
		return $data;
	}
	function delfolder($path=''){
		$dir = $this->BasePath.trim($path,'/');
		if(is_dir($dir)){
			try{ 
				if(rmdir($dir)){
					$data = true;
				}else{
					$data['error'] = 'Failed to create a new folder';
				}
			}
			catch(Exception $e){
				$data['error'] = $e->getMessage();
			}
		}else{
		    $data['error']="The folder '{$path}' isn't existed.";
		}
		return $data;
	}
	function upload($path=''){
		$path = $this->BasePath.trim($path,'/');
		if(!is_dir($path)){
			$data['error']='Folder \''.$path.'\' does not exist.';
		}elseif(!file_exists('fileupload.class.php')){
			$data['error']='File \'fileupload.class.php\' does not exist.';
		}
		if(isset($data))return $data;
		require_once('fileupload.class.php');
		$up = new FileUpload();
		//设置属性(上传的位置， 大小， 类型， 名是是否要随机生成)
		
		$up -> set("path", $path);
		$up -> set("maxsize", 8*1024*1024);
		if(!empty($this->allowType)&&$this->allowType!='*')
		$up -> set("allowtype", explode(',',$this->allowType));
		$up -> set("israndname", false);
		
		if($up -> upload("file")) {
			return $up->getFileName();
		}else{
			$data['error']= $up->getErrorMsg();
		}
		/**/
		return $data;
	}
	function download($path=''){
		if(empty($path)){return 'Please choose a file first.';}
		$file = $this->BasePath.trim($path,'/');
		if(!file_exists($file)){
			return "$path doesn't exist.";
		}else{
		$fileinfo = pathinfo($file);
		header('Content-type: application/x-'.$fileinfo['extension']);
		header('Content-Disposition: attachment; filename='.$fileinfo['basename']);
		header('Content-Length: '.filesize($file));
		readfile($file);
		}
	}
	function alter($path=''){
		$arr = explode('||',$path);
		$old = $this->BasePath.trim($arr[0],'/');
		$newname = isset($arr[1])?$arr[1]:'';
		if(empty($newname)){
			$data['error'] = "A new name is required.";
		}elseif(file_exists($old)){
			$inf = pathinfo($old);
			if(isset($inf['extension'])){
			    $new = str_replace($inf['basename'],$newname.'.'.$inf['extension'],$old);
			}else{
				$new = str_replace($inf['basename'],$newname,$old);
			}
			try{ 
				if(rename($old,$new)){
					$data = true;
				}else{
					$data['error'] = 'Failed to create a new folder';
				}
			}
			catch(Exception $e){
				$data['error'] = $e->getMessage();
			}
		}else{
			$data['error'] = "Folder '".basename($old)."' doesn't exist.";
		}
		return $data;
	}
	function delete($path=''){
		$realpath = $this->BasePath.trim($path,'/');
		if(file_exists($realpath)){
			try{ 
				if(unlink($realpath)){
					$data = true;
				}else{
					$data['error'] = 'Failed to create a new folder';
				}
			}
			catch(Exception $e){
				$data['error'] = $e->getMessage();
			}
		}else{
			$data['error']="$path doesn't exist.";
		}
		return $data;
	}
	private function format_bytes($size) { 
       $units = array(' B', ' KB', ' MB', ' GB', ' TB'); 
       for ($i = 0; $size >= 1024 && $i < 4; $i++) $size /= 1024; 
       return round($size, 2).$units[$i]; 
    } 
}
