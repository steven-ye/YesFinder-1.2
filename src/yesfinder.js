/*
* YesFinder v1.2.0
* Steven Ye
* Email: steven_ye@foxmail.com
* Date: 2016-4-3
*/
;(function($, window, document,undefined) {
    //定义构造函数
    var Method = function(ele, opt, func) {
		this.$ele = ele,
		this.callback = func,
        this.folder = '',
		this.file='',
		this.upfiles=[],
		this.options = $.extend({}, $.fn.YesFinder.defaults, opt)
    };
    //定义方法
    Method.prototype = {
        init: function() {
			var self = this;
			this.get('init').then(function(data){
				self.baseurl=data.baseurl;
				self.iconurl = data.iconurl;
			},function(){
				alert('No response from the server.');
			});
			
			this.loadBody();
			this.loadMenu();
			this.loadFolders();
        },
		loadBody:function (){
			var that=this,$ele = this.$ele;
			var tpl ='<table cellpadding="0" cellspacing="0" border="0" width="100%">';
            tpl +='<tr><td width="20%"><div class="fm-sidebar">';
            tpl +='<h2>Folders</h2><ul class="folder-list">';
            tpl +='<li class="root"><a class="active" href=""> Home</a></li><ul></ul>';
            tpl +='</ul></div></td><td width="80%">';
            tpl +='<div class="fm-header">';
            tpl +='   <ul class="fm-toolbar"></ul>';
            tpl +='   <p>Total <span class="files_num">0</span> File(s).</p>';
            tpl +='</div>';
            tpl +='<div class="fm-body">';
			tpl +='   <ul class="file-list"></ul>';
            tpl +='</div></td></tr></table>';
			tpl +='<div class="cover"></div>';
			tpl +='<div class="modal"></div>';
			$ele.html(tpl);
			var sidebar = $('.fm-sidebar',$ele), fm_body=$('.fm-body',$ele);
			   
			adjust();
			$(window).resize(adjust);
			if($.smartMenu){
			    fm_body.smartMenu([
			      [{text:'Upload',func:function(){that.modal('upload');}},
			       {text:'Refresh',func:function(){that.refresh();}}
				   ]],{name:'fm-body',textLimit:18}
			    );
			}
			function adjust(){
				var W=$(window).width(),H=$(window).height();
				sidebar.css('height',H-30);
				fm_body.css('height',H-95);
			}
		},
		loadMenu: function(){
			var that=this,$ele = this.$ele;
			var menuList={
				  View:{text:'View',func:function(){that.view(that.file);}},
			      Upload:{text:'Upload',func:function(){that.modal('upload');}},
				  Refresh:{text:'Refresh',func:function(){that.refresh();}},
				  Delete:{text:'Delete',func:function(){that.delete(that.file);}},
				  Download:{text:'Download',func:function(){that.download(that.file);}},
			      Settings:{text:'Settings',func:'<ul><li><label><input type="checkbox" name="filename" checked> Filename</label></li><li><label><input type="checkbox" name="filetime"> Filetime</label></li><li><label><input type="checkbox" name="filesize"> Filesize</label></li></ul>'},
				  Help:{text:'Help',func:'<div>YesFinder need PHP5.4+ <br/> And JQuery 1.11.0+</div>'}
			};
			var menuOption = this.options.menu.split(',');
			var toolbar = $('.fm-toolbar',$ele).html('');
			$.each(menuList,function(key,menu){
				if(menuOption.indexOf(key)>=0){
				    var li=$('<li class="'+key.toLowerCase()+'">'+menu.text+'</li>').appendTo(toolbar);
				    if(typeof(menu.func)==='function'){
						li.click(menu.func);
				    }else{
						li.append(menu.func);
					}
				}
			});
			$('.settings input:checkbox',toolbar).each(function(){
				$(this).click(function(){
					if($(this).is(':checked')){
						$('.file-list li.'+$(this).attr('name'),$ele).show();
					}else{
						$('.file-list li.'+$(this).attr('name'),$ele).hide();
					}
				});
			});
		},
		loadFolders: function(){
			var that=this,$ele=this.$ele,promise = this.get('folders','/');
			promise.then(function(data){
			    if(data.error){
				    return $('.folder-list>ul',$ele).html('<p>'+data.error+'</p>');
			    } 
				$('.folder-list>ul',$ele).html(list(data));
				
				var menuData=[
				  [{
                    text: "New Folder",
	                func: function(){
			            var path = $(this).attr('href'),
						    modal = that.modal('newfolder'),
					        input = $('input',modal),
						    button = $('button',modal);
			            button.click(function(){
				            var newname = input.val();
				            if(!newname)return alert('Please input a folder name.');
				            if(!path)return alert('Please choose a folder first.');
				            that.newFolder(path,newname);
			            });
						
					}
		          },{
					text: "Rename",
	                func: function(){
						var oldname = $(this).attr('href');
			            if(oldname==''||oldname=='/'){
							return alert('The root cannot be renamed.');
						}
						var name = oldname.substr(oldname.lastIndexOf("/")+1),
							modal = that.modal('folder'),
							input = $('input[type=text]',modal).val(name),
						    button = $('button',modal);
				        input.next('span').text('');
			            button.click(function(){
				            var newname = input.val();
				            if(!newname)return alert('Please input a newname.');
				            if(!oldname)return alert('Please choose a folder first.');
							that.rename(oldname,newname,true);
			            });
					}
				  },{
					text: "Delete",
	                func: function(){
			            that.delFolder($(this).attr('href'));
					}
				  }]
				];
				
				$('.folder-list a',$ele).each(function(){
					$(this).click(function(e){
						e.preventDefault();
						that.folder = $(this).attr('href');
						that.loadFiles();
						that.file='';
						$('.folder-list a.active',$ele).removeClass('active');
	    				$(this).addClass('active');
					});
					if($.smartMenu)
					$(this).smartMenu(menuData,{name:'folders',textLimit:18}); //自定义右键
					if($(this).attr('href')===that.folder)$(this).click();
				});
			},function(){
				$('.folder-list>ul',$ele).html('<p>No response from the server.</p>');
			});
			
			function list(data){
			  var tpl=''; var that=this;
			  $.each(data,function(k,v){
				tpl += '<li><a href="'+v.path+'">'+v.name+'</a>';
				if(typeof(v.son)=='object'){
					tpl += '<ul>';
					tpl += list(v.son);
					tpl += '</ul>';
				}
				tpl += '</li>';
			  });
			  return tpl;
			}
		},
		loadFiles: function(){
			var that=this,$ele=this.$ele,$yesfile=$('.file-list',$ele),
			    promise = this.get('files',this.folder); 
			var menuData = [ //设置右键菜单
  	    	  [{
         	    text: "Select",
	     	    func: function(){
				    that.select($(this).find('input[type=checkbox]').val());
		    	 }
                }, {
    	           text: "View",
     	           func: function() {
					   var filename = $(this).find('input[type=checkbox]').val();
                       that.view(filename);
    	           }
   	            }, {
    	           text: "Download",
     	           func: function() {
                       that.download($(this).find('input[type=checkbox]').val());
    	           }
  	            }],
                [{
    	           text: "Rename",
    	           func: function() {
			           var oldname = $(this).find('input[type=checkbox]').val(),
					       name=oldname,ext='';
					   if(oldname.lastIndexOf('.')>-1){
						   name =  oldname.substr(0,oldname.lastIndexOf('.'));
					       ext = oldname.substr(oldname.lastIndexOf('.'));
					   }
					   
					   var modal = that.modal('file'),
					       input = $('input',modal),
						   button = $('button',modal);
				       input.val(name);
					   input.next('span').text(ext);
					   modal.find('.modal-header b').text('File Rename');
			           button.click(function(){
				           var newname = input.val();
				           if(!oldname){alert('Please choose a file first.');}
						   else if(!newname){alert('Please input a new name.');}
						   else if(newname==name){alert('The name is same');}
						   else {that.rename(oldname,newname);}
			           });
   	 	            }
	            }],
                [{
                    text: "Delete",
                    func: function() {
			              that.delete($(this).find('input[type=checkbox]').val());
                    }
 	            }]
	        ];
			var path='/';
			if(this.folder&&this.folder!='/')path=this.folder+'/';
			
			
			promise.then(function(data){
			    if(data.error){
				    return $yesfile.html('<p>'+data.error+'</p>');
			    }else if(!data.length){
				    return $yesfile.html('<h4>No files in this folder.</h4>');
			    }
				var tpl='';
				$.each(data,function(i,v){
					var ext = v.filename.substr(v.filename.lastIndexOf('.')),
						imgsrc=that.iconurl+v.fileicon;
					if('.jpg.jpeg.png.gif.bmp'.indexOf(ext)!==-1){
						imgsrc = that.folder=='/' ? that.baseurl:that.baseurl+that.folder+'/';
						imgsrc +=v.filename;
					}
					tpl += '<li><label><ul><li class="fileicon">';
					tpl += '<img src="'+imgsrc+'"/>';
				    tpl += '</li><li class="filename">'+v.filename+'</li>';
				    tpl += '<li class="filetime">'+v.filetime+'</li>';
				    tpl += '<li class="filesize">'+v.filesize+'</li>';
					tpl += '</ul><input type="checkbox" value="'+v.filename+'"/></label></li>';
	  		    });
			    $yesfile.html(tpl);
				$('.files_num',this.$ele).text(data.length);
				that.file='';
				
				$yesfile.find('label').each(function(){
					var filename = $(this).find('input[type=checkbox]').val();
				    $(this).click(function(){
					    that.file = filename;
					    $('li.active',$yesfile).removeClass('active');
					    $(this).parent().addClass('active');
				    });
				    $(this).dblclick(function(){
					    that.select(filename);
				    });
				    if($.smartMenu)
				    $(this).smartMenu(menuData,{name:'files',textLimit:18}); //自定义右键
			    });
				$('.settings input:checkbox',$ele).each(function(){
				    if($(this).is(':checked')){
					    $('li.'+$(this).attr('name'),$yesfile).show();
				    }else{
					    $('li.'+$(this).attr('name'),$yesfile).hide();
				    }
			    });
			},function(){
				$yesfile.html('<p>No response from the server.</p>');
			});
			
		},
		modal:function(){
			var that=this,$ele = this.$ele,m={},
			    modal = new Modal($ele),
				$modal = modal.modal,
				opt  = arguments[0]||'',
				callback = typeof arguments[1]=='function'?arguments[1]:arguments[2];
			
			if(modal[opt])return modal[opt]();
			if(opt == 'upload'){
				m.title = 'File Upload',
				m.content = '<ul><li><h4>Please add the files to upload.</h4></li></ul>',
				m.footer = '<input type="file" id="upfile" multiple/>'+
				         '<button id="addBtn" class="fl">+ Add Files</button>'+
				         '<button id="upload" class="fr">Upload</button>'+
						 '<div class="clearfix"></div>';
				modal.init(m,function(){
				    that.modalUpload();
					if(typeof callback === 'function')callback();
				});
			}else if(opt=='view'){
				m.title = 'Image View';
				m.content=arguments[1]?'<img src="'+arguments[1]+'" alt=""/>':'<p>No file</p>';
				modal.init(m,callback);
				var modalBody = $modal.find('.modal-content');
				modalBody.css({textAlign:'center',overflow:'inherit',padding:5});
			}else{
				if(opt=='file'){
					m.title = 'File Rename';
				}else if(opt=='folder'){
					m.title = 'Folder Rename';
				}else{
					m.title = 'New Folder';
				}
				m.content='<br><table align="center" width="100%"><tr><td align="center"><input type="text" class="yes_target"/>  <span class="yes_ext"></span> <button type="button" class="yes_btn_ok">Submit</button></td></tr></table>';
				modal.init(m,callback);
			}
			modal.show();
			return $modal;
		},
		modalUpload: function(){
			var that=this,
			    modal = $('.modal',this.$ele),
			    buttons = modal.find('button');
			
            list();
			buttons.eq(1).click(function(){
				that.upload().then(function(data){
					if(data.error){
				        alert('Failed: '+data.error);
				    }else{
						that.refresh();
						that.upfiles=[];
						list();
						modal.html('');
						alert('Files Uploaded Successfully!\n\n'+data+'.');
						that.modal('hide');
				    }
				},function(data){
					alert(data);
				});
			});
			
			buttons.eq(0).click(function(){
				var file=$('#upfile',modal);
				var clone=file.clone().val('');
				file.after(clone); 
				file.remove();
				clone.change(function(){
				    $.each(this.files,function(i,file){
						that.upfiles.push(file);
				    });
				    list();
			    });
				clone.click();
			});
			
			function remove(k){
				that.upfiles.splice(k,1);
				list();
			}
			function list(){
				var modalBody = modal.find('.modal-content');
				if(that.upfiles.length==0)return modalBody.html('<ul><li><h4>Please add the files to upload.</h4></li></ul>');
				modalBody.html('');
				$.each(that.upfiles,function(i,file){
					var ul=$('<ul><li class="col-8"><b>'+file.name+'</b></li><li class="col-2">'
					                 +(file.size/1024).toFixed(2)
									 +' KB</li><li class="col-2 text-right"><button>Cancel</button></li></ul>');
					$('button',ul).click(function(){
						that.upfiles.splice(i,1);
						list();
					});
					ul.appendTo(modalBody);
				});
			}
		},
		newFolder:function(path,name){
			if(!name)return alert('Please give a folder name first.');
			var that=this;
			this.get('newfolder', path+'/'+name).then(function(data){
				if(data.error)return alert(data.error);
				that.loadFolders();
				that.modal('hide');
			},function(data){
				alert('Failed to create a new folder.\n'+data);
			});
		},
		delFolder:function(path){
			if(!path)return alert('Please choose a folder first.');
			if(!confirm('Are you sure to delete this folder "'+path+'"?'))return;
			
			var data = this.get('delfolder', path);
			if(data.error){
				alert(data.error);
			}else if(data){
				this.loadFolders();
				alert('The folder is deleted.');
			}else{
				alert('Failed to delete the folder.\nThere may be some files and/or folders in it.');
			}
		},
		view: function(path){
			if(!path)return alert('Please choose a file first.');
			var ext = path.substr(path.lastIndexOf('.'));
			if('.jpg.jpeg.gif.png.bmp'.indexOf(ext.toLowerCase())===-1){
				return alert('Only image file can be viewed.');
			}
			if(this.folder)path = this.folder+'/'+path;
			path = this.baseurl+'/'+path;
			this.modal('view',path);
		},
		delete: function(path){
			if(!path){return alert('Please choose a file first.');}
			if(!confirm('Are you sure to delete this file: '+path+' ?'))return;
			var that=this,promise = this.get('delete',this.folder+'/'+path);
			promise.then(function(data){
			    if(data.error) return alert(data.error);
			    that.refresh();
			},function(){
				alert('Something wrong on the server to delete the file.');
			});
		},
		rename: function(oldname,newname,folder){
			var that=this,action = folder ? 'change':'alter',
				oldname = folder?oldname:this.folder+'/'+oldname;
			this.get(action,oldname+'||'+newname).then(function(data){
			    if(data.error){
				    return alert(data.error);
			    }
				action = folder ? that.loadFolders():that.loadFiles();
				that.modal('hide');
			},function(){
				alert('Failed to rename it');
			});
		},
		download: function(path){
			if(!path){return alert('Please choose a file first.');}
			path = this.folder+'/'+path;
			window.location = this.options.url+'?action=download&path='+path;
		},
		refresh : function(){
			this.loadFiles();
		},
		select : function(path){
			if(this.folder!=''&&this.folder!='/'){
				path = this.folder+'/'+path;
			}
			
			if(this.callback){
				this.callback.call(this,path);
			}else if(typeof(parent.yesfinder)==='function'){
				parent.yesfinder(path);
			}else if(typeof(window.yesfinder)==='function'){
			    window.yesfinder(path);
			}
		},
		get: function(action,path){
            var settings = this.options,defer = $.Deferred();
            
            $.ajax({  
                url : settings.url, 
                data: {action: action, path: path, type: settings.filetype},
                type : 'get',  
                cache: false,
                dataType:'json'
            }).then(function (data) {
    		    defer.resolve(data);
		      },function (data) {
   		        defer.reject(data);
		    });
            return defer.promise();
		},
		upload: function(){
			if(this.upfiles.length==0){
				return alert('Please add the files to upload.');
			}
			var defer = $.Deferred(),fd = new FormData();
			$.each(this.upfiles, function(i, file) {
                fd.append('file[]', file);
            });

			$.ajax({  
                url : this.options.url+'?action=upload&path='+this.folder, 
                data: fd,
                type:'POST',  
                cache: false,
	            contentType: false,    //不可缺
				processData: false,    //不可缺
                dataType:'json'
            }).then(function (data) {
    		    defer.resolve(data);
		      },function (data) {
   		        defer.reject(data);
		    });
			return defer.promise();
		}
    };
	
	var Modal = function(ele){
		this.cover = ele.find('.cover'),
		this.modal = ele.find('.modal'),
		this.show = function(){
			this.cover.fadeIn();
			this.modal.fadeIn();
		},
		this.hide = function(){
			this.cover.fadeOut();
			this.modal.fadeOut();
		},
		this.init = function(options,callback){
			var self=this, modal = this.modal.html(''),
			    opt = $.extend({},{title:'',content:''},options),
			    modalHead = $('<div class="modal-header">').appendTo(modal),
				modalTitle = $('<b></b>').appendTo(modalHead),
				closeBtn = $('<a class="close" title="close">&times;</a>').appendTo(modalHead),
				modelBody = $('<div class="modal-content"></div>').appendTo(modal);
			closeBtn.click(function(){self.hide();});
			modalTitle.text(opt.title);
			modelBody.html(opt.content);
			if(opt.footer)modal.append('<div class="modal-footer">'+opt.footer+'</div>');
			resize();
			$(window).resize(resize);
			if(typeof callback == 'function')callback();

			function resize(){
				var W=$(window).width(),w=modal.width(),
				    top = ($(window).height()-modal.height())/2;
			    if(top<0){top=0;}else if(top>200){top=200;}
			    if(W<550){w=W;}else{w=550;}
			    modal.css({'left':(W-w)/2,'top':top,'width':w});
			}
		}
	};
    //在插件中使用对象
    $.fn.YesFinder = function(options,callback) {
		if(typeof(options)==="function"){
			callback = options;
			options={};
		}
	    
		return this.addClass('yesFinder').each(function(){
		    //创建实体
            var method = new Method($(this), options, callback);
            //调用其方法
            method.init();
		});
    };
	$.fn.yesFinder = $.fn.YesFinder;
	$.fn.YesFinder.defaults={
		url: 'php/connector.php',
		filetype:'',
		menu:'View,Upload,Refresh,Delete,Download,Settings,Help'
	};
})(jQuery, window, document);