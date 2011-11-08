$(document).ready(function(){
	$('#txtValue').keyup(function(){
                sendValue($(this).val());  
               
            });
	$('#brdimg').click(function(e){
		sendCoords(e,$(this));
	    });
	$.board = {
	    xsize:$('#brdimg').width(),
	    ysize:$('#brdimg').height()
	};
           
    });
function sendValue(str){
    $.post("ajax/test/"+str, {name:"Dusan", surname:"Miloradovic"},
	   function(data){
	       $('#display').html(data);
	   },"html");
           
}

	
function sendCoords(e,t){
    var x=e.pageX - t.offset().left;
    var y=e.pageY - t.offset().top;
    $.post("tictactoe",{xcoord:x/$.board.xsize, ycoord:y/$.board.ysize},
	   function (data){
	       var xField=jQuery.parseJSON(data).xfield;
       	       var yField=jQuery.parseJSON(data).yfield;
	       var xDraw=(xField+0.5)* ($.board.xsize/3);
	       var yDraw=(yField+0.5)* ($.board.ysize/3);
	       alert(xDraw+';;;;'+$.board.xsize);
	       $("#polje_"+xField+"_"+yField).remove();

	       $("#igra").append($("<div id='polje_"+xField+"_"+yField+"'> <img id='figimg' src='img/figura.jpg' /> </div>").css(
																 {'position':'absolute','z-index':'1', 'left':(xDraw+'px'), 'top':(yDraw+'px')}
					 ));
	   });
}
