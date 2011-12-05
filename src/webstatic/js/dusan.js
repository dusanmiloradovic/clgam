$(document).ready(function(){
	$('#brdimg').click(function(e){
		sendCoords(e,$(this));
	    });
    $('#sg123').click(function(e){
	$.post("startgame",{game_name:"tictactoe"});
    });


	waitForMsg();
	waitForInvitations();
    });

$(window).load(function (e){
    	$.board = {
	    xsize:$('#brdimg').width(),
	    ysize:$('#brdimg').height()
	};
    });

	
function sendCoords(e,t){
    var x=e.pageX - t.offset().left;
    var y=e.pageY - t.offset().top;
    $.post("tictactoe",{xcoord:x/$.board.xsize, ycoord:y/$.board.ysize});
}

function displayField(data){
    var xField=jQuery.parseJSON(data).xfield;
    var yField=jQuery.parseJSON(data).yfield;
    var xDraw=(xField+0.5)* ($.board.xsize/3);
    var yDraw=(yField+0.5)* ($.board.ysize/3);
    $("#polje_"+xField+"_"+yField).remove();
    obja=$("<div id='polje_"+xField+"_"+yField+"'> <img id='figimg' src='img/figura.jpg' /> </div>");
    $("#igra").append(obja.css(
			       {'text-align':'center','position':'absolute','z-index':'1', 'left':(xDraw+'px'), 'top':(yDraw+'px')}
			       ));
    var dOffsetx=obja.width()/2;
    var dOffsety=obja.height()/2;
    obja.css({'left':'-='+dOffsetx,'top':'-='+dOffsety});

}


function waitForMsg(){
     $.ajax({
            type: "GET",
		url: "fieldsout",

		async: true, /* If set to non-async, browser shows page as "Loading.."*/
		cache: false,
		timeout:50000, /* Timeout in ms */

		success: function(data){ /* called when request to barge.php completes */
		    
		displayField(data);
		waitForMsg();
            },
		error: function(XMLHttpRequest, textStatus, errorThrown){
		waitForMsg();
	    }
        });
}

function waitForInvitations(){
    $.ajax({
            type: "GET",
		url: "pending",

		async: true, /* If set to non-async, browser shows page as "Loading.."*/
		cache: false,
		timeout:50000, /* Timeout in ms */

		success: function(data){ /* called when request to barge.php completes */
		    
		printInvitations(data);
		waitForInvitations();
            },
		error: function(XMLHttpRequest, textStatus, errorThrown){
		waitForInvitations();
	    }
        });
}

function printInvitations(data){
    var jData=$.parseJSON(data);
    var invitations="";
    for (var prop in jData){
	var val=jData[prop];
	invitations+="<a href='/joingame?gamename=tictactoe&game_uid="+prop+"'>"+val+"</a><br/>";
    }
    $("#opengames").html(invitations);
   
}



